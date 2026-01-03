/**
 * Device Fingerprinting.
 * 
 * Creates stable identifiers for devices based on browser/client characteristics.
 * Used for anomaly detection and trusted device management.
 */

import { createHash } from "node:crypto";
import type { DevicePolicy } from "../core/auth.policies.js";
import type { DeviceMetadata } from "../core/auth.types.js";

/**
 * Extended device information for fingerprinting.
 */
export interface DeviceInfo extends DeviceMetadata {
  /** Screen resolution (if available) */
  screenResolution?: string;
  
  /** Timezone offset in minutes */
  timezoneOffset?: number;
  
  /** Browser language */
  language?: string;
  
  /** Operating system platform */
  platform?: string;
}

/**
 * Device fingerprint result.
 */
export interface DeviceFingerprint {
  /** Stable fingerprint hash */
  fingerprint: string;
  
  /** Components used to create fingerprint */
  components: {
    userAgent?: string;
    ipAddress?: string;
    screenResolution?: string;
    timezone?: number;
    language?: string;
    platform?: string;
  };
  
  /** Fingerprint confidence score (0-100) */
  confidence: number;
}

/**
 * Device Fingerprinter.
 * Creates stable device identifiers for security purposes.
 */
export class DeviceFingerprinter {
  constructor(private readonly policy: DevicePolicy) {}

  /**
   * Generate device fingerprint from device information.
   * 
   * @param info - Device information
   * @returns Device fingerprint with confidence score
   */
  generate(info: DeviceInfo): DeviceFingerprint {
    if (!this.policy.enabled) {
      // Return a dummy fingerprint if disabled
      return {
        fingerprint: "disabled",
        components: {},
        confidence: 0,
      };
    }

    const components: DeviceFingerprint["components"] = {};
    const parts: string[] = [];
    let componentCount = 0;

    // Add user agent if enabled
    if (this.policy.fingerprintComponents.userAgent && info.userAgent) {
      components.userAgent = info.userAgent;
      parts.push(`ua:${info.userAgent}`);
      componentCount++;
    }

    // Add screen resolution if enabled
    if (this.policy.fingerprintComponents.screenResolution && info.screenResolution) {
      components.screenResolution = info.screenResolution;
      parts.push(`sr:${info.screenResolution}`);
      componentCount++;
    }

    // Add timezone if enabled
    if (this.policy.fingerprintComponents.timezone && info.timezoneOffset !== undefined) {
      components.timezone = info.timezoneOffset;
      parts.push(`tz:${info.timezoneOffset}`);
      componentCount++;
    }

    // Add language if enabled
    if (this.policy.fingerprintComponents.language && info.language) {
      components.language = info.language;
      parts.push(`lang:${info.language}`);
      componentCount++;
    }

    // Add platform if enabled
    if (this.policy.fingerprintComponents.platform && info.platform) {
      components.platform = info.platform;
      parts.push(`platform:${info.platform}`);
      componentCount++;
    }

    // Create hash from components
    const fingerprint = this.hash(parts.join("|"));

    // Calculate confidence based on number of components
    const maxComponents = Object.values(this.policy.fingerprintComponents).filter(Boolean).length;
    const confidence = maxComponents > 0 ? Math.round((componentCount / maxComponents) * 100) : 0;

    return {
      fingerprint,
      components,
      confidence,
    };
  }

  /**
   * Compare two device fingerprints.
   * 
   * @param fp1 - First fingerprint
   * @param fp2 - Second fingerprint
   * @returns Similarity score (0-100), 100 = identical
   */
  compare(fp1: DeviceFingerprint, fp2: DeviceFingerprint): number {
    if (fp1.fingerprint === fp2.fingerprint) {
      return 100;
    }

    // Compare individual components
    let matches = 0;
    let total = 0;

    const components = [
      "userAgent",
      "screenResolution",
      "timezone",
      "language",
      "platform",
    ] as const;

    for (const component of components) {
      if (fp1.components[component] !== undefined || fp2.components[component] !== undefined) {
        total++;
        if (fp1.components[component] === fp2.components[component]) {
          matches++;
        }
      }
    }

    return total > 0 ? Math.round((matches / total) * 100) : 0;
  }

  /**
   * Check if a device fingerprint has changed significantly.
   * 
   * @param previous - Previous fingerprint
   * @param current - Current fingerprint
   * @returns True if device has changed significantly
   */
  hasChanged(previous: DeviceFingerprint, current: DeviceFingerprint): boolean {
    if (!this.policy.trackChanges) {
      return false;
    }

    const similarity = this.compare(previous, current);
    
    // Consider changed if similarity is below 70%
    return similarity < 70;
  }

  /**
   * Create hash from a string.
   */
  private hash(value: string): string {
    return createHash("sha256").update(value).digest("hex");
  }
}

/**
 * Extract device information from HTTP request headers.
 * 
 * @param headers - HTTP request headers
 * @returns Device information
 */
export function extractDeviceInfo(headers: Record<string, string | undefined>): DeviceInfo {
  return {
    userAgent: headers["user-agent"],
    ipAddress: headers["x-forwarded-for"]?.split(",")[0].trim() || headers["x-real-ip"],
    platform: headers["sec-ch-ua-platform"]?.replace(/"/g, ""),
    language: headers["accept-language"]?.split(",")[0].trim(),
  };
}

/**
 * Factory function to create a device fingerprinter.
 */
export function createDeviceFingerprinter(policy: DevicePolicy): DeviceFingerprinter {
  return new DeviceFingerprinter(policy);
}
