/**
 * Account Service - Re-export for convenience
 *
 * This file provides a simpler import path for the account service,
 * specifically for use by the auth domain when creating accounts on registration.
 */

// Re-export the service interface as AccountService (type alias for auth domain)
export type { AccountServiceInterface as AccountService } from  '@repo/sdk';

// Re-export the service factory
export { createAccountService } from './core/account.service.js';
