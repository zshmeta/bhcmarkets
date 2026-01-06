/**
 * Admin Domain - Input Validators
 *
 * Zod schemas for validating admin API inputs.
 * Every schema that modifies data requires a "reason" field.
 */

import { z } from "zod";

// =============================================================================
// COMMON SCHEMAS
// =============================================================================

/**
 * UUID string validation.
 */
const uuidSchema = z.string().uuid("Invalid UUID format");

/**
 * Positive amount string (for balance operations).
 */
const positiveAmountSchema = z
  .string()
  .refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Amount must be a positive number");

/**
 * Reason field - required for all modifying operations.
 */
const reasonSchema = z
  .string()
  .min(3, "Reason must be at least 3 characters")
  .max(1000, "Reason must be at most 1000 characters");

/**
 * User role enum.
 */
const userRoleSchema = z.enum(["user", "admin", "support"]);

// =============================================================================
// USER MANAGEMENT SCHEMAS
// =============================================================================

/**
 * List users query parameters.
 */
export const listUsersSchema = z.object({
  role: userRoleSchema.optional(),
  status: z.enum(["active", "pending", "suspended", "deleted"]).optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

/**
 * Suspend user input.
 */
export const suspendUserSchema = z.object({
  userId: uuidSchema,
  reason: reasonSchema,
});

/**
 * Unsuspend user input.
 */
export const unsuspendUserSchema = z.object({
  userId: uuidSchema,
  reason: reasonSchema,
});

/**
 * Update user role input.
 */
export const updateUserRoleSchema = z.object({
  userId: uuidSchema,
  newRole: userRoleSchema,
  reason: reasonSchema,
});

// =============================================================================
// ACCOUNT MANAGEMENT SCHEMAS
// =============================================================================

/**
 * List accounts query parameters.
 */
export const listAccountsSchema = z.object({
  userId: uuidSchema.optional(),
  currency: z.string().max(10).optional(),
  status: z.enum(["active", "locked", "closed"]).optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

/**
 * Admin deposit input.
 */
export const adminDepositSchema = z.object({
  accountId: uuidSchema,
  amount: positiveAmountSchema,
  reason: reasonSchema,
});

/**
 * Admin withdrawal input.
 */
export const adminWithdrawSchema = z.object({
  accountId: uuidSchema,
  amount: positiveAmountSchema,
  reason: reasonSchema,
});

/**
 * Freeze account input.
 */
export const freezeAccountSchema = z.object({
  accountId: uuidSchema,
  reason: reasonSchema,
});

/**
 * Unfreeze account input.
 */
export const unfreezeAccountSchema = z.object({
  accountId: uuidSchema,
  reason: reasonSchema,
});

// =============================================================================
// RISK MANAGEMENT SCHEMAS
// =============================================================================

/**
 * Circuit breaker activation/deactivation input.
 */
export const circuitBreakerSchema = z.object({
  reason: reasonSchema,
  symbol: z.string().max(20).optional(), // Optional: specific symbol or platform-wide
});

// =============================================================================
// SYMBOL MANAGEMENT SCHEMAS
// =============================================================================

/**
 * Create or update symbol input.
 */
export const upsertSymbolSchema = z.object({
  symbol: z
    .string()
    .min(2, "Symbol must be at least 2 characters")
    .max(20, "Symbol must be at most 20 characters")
    .regex(/^[A-Z0-9\-_]+$/i, "Symbol must be alphanumeric with hyphens/underscores"),
  baseCurrency: z.string().min(2).max(10),
  quoteCurrency: z.string().min(2).max(10),
  tradingEnabled: z.boolean().optional(),
  minOrderSize: z.number().positive().optional(),
  maxOrderSize: z.number().positive().optional(),
  makerFee: z.number().min(0).max(1).optional(), // 0-100%
  takerFee: z.number().min(0).max(1).optional(),
  priceDecimals: z.number().int().min(0).max(18).optional(),
  quantityDecimals: z.number().int().min(0).max(18).optional(),
  reason: reasonSchema,
});

/**
 * Enable/disable symbol input.
 */
export const symbolActionSchema = z.object({
  symbol: z.string().max(20),
  reason: reasonSchema,
});

// =============================================================================
// AUDIT LOG SCHEMAS
// =============================================================================

/**
 * Audit log filter query parameters.
 */
export const auditLogFilterSchema = z.object({
  adminUserId: uuidSchema.optional(),
  action: z.string().optional(),
  targetType: z
    .enum([
      "user",
      "account",
      "order",
      "position",
      "symbol",
      "risk_config",
      "circuit_breaker",
      "system",
    ])
    .optional(),
  targetId: uuidSchema.optional(),
  startDate: z.string().optional(), // ISO date string
  endDate: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

// =============================================================================
// PHASE 2: ORDER MANAGEMENT SCHEMAS
// =============================================================================

/**
 * Order status enum.
 */
const orderStatusSchema = z.enum([
  "new",
  "partially_filled",
  "filled",
  "cancelled",
  "rejected",
  "expired",
]);

/**
 * Order side enum.
 */
const orderSideSchema = z.enum(["buy", "sell"]);

/**
 * Order type enum.
 */
const orderTypeSchema = z.enum(["market", "limit", "stop", "stop_limit"]);

/**
 * List orders query parameters.
 */
export const listOrdersSchema = z.object({
  userId: uuidSchema.optional(),
  accountId: uuidSchema.optional(),
  symbol: z.string().max(20).optional(),
  status: orderStatusSchema.optional(),
  side: orderSideSchema.optional(),
  type: orderTypeSchema.optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

/**
 * Cancel order input.
 */
export const cancelOrderSchema = z.object({
  orderId: uuidSchema,
  reason: reasonSchema,
});

/**
 * Cancel all orders input.
 */
export const cancelAllOrdersSchema = z.object({
  userId: uuidSchema.optional(),
  accountId: uuidSchema.optional(),
  symbol: z.string().max(20).optional(),
  reason: reasonSchema,
});

// =============================================================================
// PHASE 2: POSITION MANAGEMENT SCHEMAS
// =============================================================================

/**
 * Position side enum.
 */
const positionSideSchema = z.enum(["long", "short"]);

/**
 * List positions query parameters.
 */
export const listPositionsSchema = z.object({
  userId: uuidSchema.optional(),
  accountId: uuidSchema.optional(),
  symbol: z.string().max(20).optional(),
  side: positionSideSchema.optional(),
  minQuantity: z.coerce.number().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

/**
 * Force close position input.
 */
export const forceClosePositionSchema = z.object({
  accountId: uuidSchema,
  symbol: z.string().max(20),
  reason: reasonSchema,
});

// =============================================================================
// PHASE 2: REPORT SCHEMAS
// =============================================================================

/**
 * Report period input.
 */
export const reportPeriodSchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
}).refine(
  (data) => new Date(data.startDate) <= new Date(data.endDate),
  "Start date must be before or equal to end date"
);

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type ListUsersInput = z.infer<typeof listUsersSchema>;
export type SuspendUserInput = z.infer<typeof suspendUserSchema>;
export type UnsuspendUserInput = z.infer<typeof unsuspendUserSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type ListAccountsInput = z.infer<typeof listAccountsSchema>;
export type AdminDepositInput = z.infer<typeof adminDepositSchema>;
export type AdminWithdrawInput = z.infer<typeof adminWithdrawSchema>;
export type FreezeAccountInput = z.infer<typeof freezeAccountSchema>;
export type UnfreezeAccountInput = z.infer<typeof unfreezeAccountSchema>;
export type CircuitBreakerInput = z.infer<typeof circuitBreakerSchema>;
export type UpsertSymbolInput = z.infer<typeof upsertSymbolSchema>;
export type SymbolActionInput = z.infer<typeof symbolActionSchema>;
export type AuditLogFilterInput = z.infer<typeof auditLogFilterSchema>;
// Phase 2 types
export type ListOrdersInput = z.infer<typeof listOrdersSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
export type CancelAllOrdersInput = z.infer<typeof cancelAllOrdersSchema>;
export type ListPositionsInput = z.infer<typeof listPositionsSchema>;
export type ForceClosePositionInput = z.infer<typeof forceClosePositionSchema>;
export type ReportPeriodInput = z.infer<typeof reportPeriodSchema>;
