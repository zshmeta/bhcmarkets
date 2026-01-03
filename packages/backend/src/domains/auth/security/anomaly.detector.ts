/**
 * Anomaly Detection Service.
 * 
 * Detects suspicious authentication patterns and potential security threats.
 * Includes token reuse detection, impossible travel, and concurrent sessions.
 */

import type { AnomalyDetectionPolicy } from "../core/auth.policies.js";
import type { UUID } from "../core/auth.types.js";

/**
 * Anomaly type.
 */
export type AnomalyType =
  | "TOKEN_REUSE"
  | "IMPOSSIBLE_TRAVEL"
  | "CONCURRENT_LOCATIONS"
  | "UNUSUAL_LOGIN_TIME"
  | "DEVICE_CHANGE"
  | "IP_CHANGE";

/**
 * Detected anomaly.
 */
export interface Anomaly {
  /** Type of anomaly */
  type: AnomalyType;
  
  /** Severity level */
  severity: "low" | "medium" | "high" | "critical";
  
  /** Description of the anomaly */
  description: string;
  
  /** User ID affected */
  userId?: UUID;
  
  /** Session ID affected */
  sessionId?: UUID;
  
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  
  /** Timestamp when anomaly was detected */
  detectedAt: string;
}

/**
 * Location information for geolocation checks.
 */
export interface Location {
  /** Latitude */
  lat: number;
  
  /** Longitude */
  lon: number;
  
  /** Timestamp of this location */
  timestamp: number;
}

/**
 * Anomaly Detector.
 * Monitors authentication patterns for suspicious activity.
 */
export class AnomalyDetector {
  // Track token usage to detect reuse
  private readonly tokenUsage = new Map<string, number>();
  
  // Track user locations for impossible travel detection
  private readonly userLocations = new Map<UUID, Location[]>();

  constructor(private readonly policy: AnomalyDetectionPolicy) {}

  /**
   * Check for token reuse anomaly.
   * Tokens should only be used once for refresh operations.
   * 
   * @param tokenHash - Hash of the token
   * @returns Anomaly if detected, null otherwise
   */
  checkTokenReuse(tokenHash: string, userId: UUID, sessionId: UUID): Anomaly | null {
    if (!this.policy.enabled || !this.policy.detectTokenReuse) {
      return null;
    }

    const usageCount = this.tokenUsage.get(tokenHash) || 0;
    this.tokenUsage.set(tokenHash, usageCount + 1);

    if (usageCount > 0) {
      // Token has been used before - potential theft
      return {
        type: "TOKEN_REUSE",
        severity: "critical",
        description: "Refresh token was reused, indicating possible token theft",
        userId,
        sessionId,
        metadata: {
          tokenHash: tokenHash.substring(0, 8) + "...", // Partial hash for logging
          usageCount: usageCount + 1,
        },
        detectedAt: new Date().toISOString(),
      };
    }

    return null;
  }

  /**
   * Check for impossible travel anomaly.
   * Detects logins from locations that are impossibly far apart in time.
   * 
   * @param userId - User ID
   * @param currentLocation - Current login location
   * @returns Anomaly if detected, null otherwise
   */
  checkImpossibleTravel(userId: UUID, currentLocation: Location): Anomaly | null {
    if (!this.policy.enabled || !this.policy.detectImpossibleTravel) {
      return null;
    }

    const locations = this.userLocations.get(userId) || [];
    
    // Add current location to history
    locations.push(currentLocation);
    this.userLocations.set(userId, locations.slice(-10)); // Keep last 10 locations

    // Need at least 2 locations to detect travel
    if (locations.length < 2) {
      return null;
    }

    const previousLocation = locations[locations.length - 2];
    
    // Calculate distance in kilometers
    const distance = this.calculateDistance(
      previousLocation.lat,
      previousLocation.lon,
      currentLocation.lat,
      currentLocation.lon
    );

    // Calculate time difference in hours
    const timeDiff = (currentLocation.timestamp - previousLocation.timestamp) / (1000 * 60 * 60);

    // Calculate required speed in km/h
    const speed = distance / timeDiff;

    // Check if travel is impossible
    if (speed > this.policy.maxTravelSpeedKmh) {
      return {
        type: "IMPOSSIBLE_TRAVEL",
        severity: "high",
        description: `Login from ${distance.toFixed(0)}km away in ${timeDiff.toFixed(1)} hours (${speed.toFixed(0)} km/h)`,
        userId,
        metadata: {
          distance: distance.toFixed(2),
          timeDiff: timeDiff.toFixed(2),
          speed: speed.toFixed(2),
          maxSpeed: this.policy.maxTravelSpeedKmh,
          from: {
            lat: previousLocation.lat,
            lon: previousLocation.lon,
          },
          to: {
            lat: currentLocation.lat,
            lon: currentLocation.lon,
          },
        },
        detectedAt: new Date().toISOString(),
      };
    }

    return null;
  }

  /**
   * Calculate distance between two coordinates using Haversine formula.
   * 
   * @param lat1 - Latitude of first point
   * @param lon1 - Longitude of first point
   * @param lat2 - Latitude of second point
   * @param lon2 - Longitude of second point
   * @returns Distance in kilometers
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians.
   */
  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Handle detected anomaly according to policy.
   * 
   * @param anomaly - Detected anomaly
   * @returns Action to take
   */
  handleAnomaly(anomaly: Anomaly): "allow" | "challenge" | "block" {
    if (!this.policy.enabled) {
      return "allow";
    }

    // Map policy action to return value
    switch (this.policy.onAnomalyDetected) {
      case "log":
      case "alert":
        return "allow"; // Log/alert but don't interfere
      case "challenge":
        return "challenge"; // Require additional verification
      case "block":
        return "block"; // Block the request
      default:
        return "allow";
    }
  }

  /**
   * Clear token usage tracking for cleanup.
   */
  clearTokenUsage(tokenHash: string): void {
    this.tokenUsage.delete(tokenHash);
  }

  /**
   * Clear location history for a user.
   */
  clearLocationHistory(userId: UUID): void {
    this.userLocations.delete(userId);
  }

  /**
   * Clean up old data to prevent memory leaks.
   */
  cleanup(): void {
    // Clear token usage older than 1 hour
    // In production, this should be based on token TTL
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    
    // Clear old locations
    for (const [userId, locations] of this.userLocations.entries()) {
      const recentLocations = locations.filter(
        (loc) => loc.timestamp > oneHourAgo
      );
      if (recentLocations.length === 0) {
        this.userLocations.delete(userId);
      } else {
        this.userLocations.set(userId, recentLocations);
      }
    }
  }
}

/**
 * Factory function to create an anomaly detector.
 */
export function createAnomalyDetector(policy: AnomalyDetectionPolicy): AnomalyDetector {
  return new AnomalyDetector(policy);
}
