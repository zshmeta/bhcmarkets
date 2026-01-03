/**
 * Password Policy Enforcement.
 * 
 * Implements password validation and strength checking based on configured policies.
 * Prevents weak, common, and breached passwords.
 */

import type { PasswordPolicy } from "../core/auth.policies.js";
import { validatePasswordAgainstPolicy, calculatePasswordEntropy } from "../core/auth.policies.js";
import { AuthError } from "../core/auth.errors.js";

/**
 * Password validation result.
 */
export interface PasswordValidationResult {
  /** Whether the password is valid */
  valid: boolean;
  
  /** Validation errors (if any) */
  errors: string[];
  
  /** Password strength score (0-100) */
  strength: number;
  
  /** Password entropy in bits */
  entropy: number;
}

/**
 * Common passwords list (top 100 most common).
 * In production, this should be loaded from a file or database.
 */
const COMMON_PASSWORDS = new Set([
  "password", "123456", "123456789", "12345678", "12345",
  "1234567", "password1", "12345678", "qwerty", "abc123",
  "111111", "1234567890", "1234567", "password123", "000000",
  "iloveyou", "1234", "1q2w3e4r5t", "qwertyuiop", "123",
  "monkey", "dragon", "princess", "letmein", "master",
  "666666", "123123", "654321", "superman", "batman",
  "admin", "welcome", "login", "hello", "sunshine",
  "football", "baseball", "basketball", "soccer", "hockey",
  "passw0rd", "password!", "Password1", "Password123", "qwerty123",
  "abc123456", "password1234", "qwertyuiop123", "1q2w3e4r",
]);

/**
 * Password Policy Enforcer.
 * Validates passwords according to security policies.
 */
export class PasswordPolicyEnforcer {
  constructor(private readonly policy: PasswordPolicy) {}

  /**
   * Validate a password against the configured policy.
   * Throws AuthError if password is invalid.
   */
  validate(password: string): void {
    const result = this.check(password);
    
    if (!result.valid) {
      throw new AuthError(
        "PASSWORD_TOO_WEAK",
        `Password does not meet security requirements: ${result.errors.join(", ")}`,
        { errors: result.errors, strength: result.strength }
      );
    }
  }

  /**
   * Check password strength without throwing errors.
   * Returns detailed validation result.
   */
  check(password: string): PasswordValidationResult {
    const errors: string[] = [];

    // Basic policy validation
    const policyErrors = validatePasswordAgainstPolicy(password, this.policy);
    errors.push(...policyErrors);

    // Check for common passwords
    if (this.policy.preventCommonPasswords) {
      const lowerPassword = password.toLowerCase();
      if (COMMON_PASSWORDS.has(lowerPassword)) {
        errors.push("This password is too common and easily guessable");
      }
    }

    // Calculate entropy
    const entropy = calculatePasswordEntropy(password);
    if (this.policy.minEntropy && entropy < this.policy.minEntropy) {
      errors.push(`Password entropy (${entropy.toFixed(1)} bits) is below required minimum (${this.policy.minEntropy} bits)`);
    }

    // Calculate strength score (0-100)
    const strength = this.calculateStrength(password, entropy);

    return {
      valid: errors.length === 0,
      errors,
      strength,
      entropy,
    };
  }

  /**
   * Calculate password strength score (0-100).
   * Higher is better.
   */
  private calculateStrength(password: string, entropy: number): number {
    let score = 0;

    // Length contribution (up to 30 points)
    const lengthScore = Math.min(30, (password.length / 20) * 30);
    score += lengthScore;

    // Character diversity contribution (up to 40 points)
    let diversityScore = 0;
    if (/[a-z]/.test(password)) diversityScore += 10;
    if (/[A-Z]/.test(password)) diversityScore += 10;
    if (/\d/.test(password)) diversityScore += 10;
    if (/[^a-zA-Z0-9]/.test(password)) diversityScore += 10;
    score += diversityScore;

    // Entropy contribution (up to 30 points)
    const entropyScore = Math.min(30, (entropy / 100) * 30);
    score += entropyScore;

    // Penalize common patterns
    if (this.hasCommonPatterns(password)) {
      score *= 0.7; // 30% penalty
    }

    // Penalize dictionary words
    if (COMMON_PASSWORDS.has(password.toLowerCase())) {
      score *= 0.3; // 70% penalty
    }

    return Math.round(Math.min(100, Math.max(0, score)));
  }

  /**
   * Check for common password patterns.
   */
  private hasCommonPatterns(password: string): boolean {
    // Sequential characters
    if (/abc|bcd|cde|def|123|234|345|456|567|678|789/i.test(password)) {
      return true;
    }

    // Repeated characters
    if (/(.)\1{2,}/.test(password)) {
      return true;
    }

    // Keyboard patterns
    if (/qwerty|asdfgh|zxcvbn|qazwsx/i.test(password)) {
      return true;
    }

    return false;
  }

  /**
   * Check if a password has been found in known breaches.
   * This would typically call an external API like HaveIBeenPwned.
   * 
   * @param password - Password to check
   * @returns True if password has been breached
   */
  async checkBreachedPassword(password: string): Promise<boolean> {
    if (!this.policy.checkBreachedPasswords) {
      return false;
    }

    // TODO: Implement actual breach check using HaveIBeenPwned API
    // For now, just check against common passwords
    return COMMON_PASSWORDS.has(password.toLowerCase());
  }
}

/**
 * Factory function to create a password policy enforcer.
 */
export function createPasswordPolicyEnforcer(policy: PasswordPolicy): PasswordPolicyEnforcer {
  return new PasswordPolicyEnforcer(policy);
}
