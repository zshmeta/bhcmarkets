/**
 * Admin Domain - Barrel Export
 *
 * Public API for the Admin domain.
 */

// --- Core Types ---
export type {
  UUID,
  UserRole,
  AdminAction,
  AuditTargetType,
  AdminAuditEntry,
  CreateAuditEntryInput,
  AuditLogFilter,
  AdminUserView,
  SuspendUserInput,
  UpdateUserRoleInput,
  AdminAccountView,
  AdminBalanceOperationInput,
  HouseExposureSummary,
  PlatformRiskMetrics,
  SymbolConfig,
  UpsertSymbolInput,
  AdminService,
  RequestContext,
  AdminRepository,
  // Phase 2 types
  OrderStatus,
  OrderSide,
  OrderType,
  AdminOrderView,
  AdminOrderFilter,
  AdminCancelOrderInput,
  AdminCancelAllOrdersInput,
  AdminPositionView,
  AdminPositionFilter,
  AdminForceClosePositionInput,
  ReportPeriod,
  DailyTradingSummary,
  UserActivitySummary,
  PlatformPnLSummary,
} from "./core/admin.types.js";

export { ROLE_PERMISSIONS } from "./core/admin.types.js";

// --- Errors ---
export { AdminError, isAdminError, type AdminErrorCode } from "./core/admin.errors.js";

// --- Service ---
export {
  createAdminService,
  type AdminServiceDependencies,
} from "./core/admin.service.js";

// --- Repository ---
export {
  createAdminRepositoryPg,
  adminAuditLog,
  symbols,
} from "./repositories/admin.repository.pg.js";

// --- Routes ---
export { createAdminRoutes } from "./routes/admin.routes.js";

// --- API Registration (integrates with existing Router) ---
export { registerAdminApiRoutes } from "./api/admin.api.js";

// --- Validators ---
export {
  listUsersSchema,
  suspendUserSchema,
  unsuspendUserSchema,
  updateUserRoleSchema,
  listAccountsSchema,
  adminDepositSchema,
  adminWithdrawSchema,
  freezeAccountSchema,
  unfreezeAccountSchema,
  circuitBreakerSchema,
  upsertSymbolSchema,
  symbolActionSchema,
  auditLogFilterSchema,
  // Phase 2 validators
  listOrdersSchema,
  cancelOrderSchema,
  cancelAllOrdersSchema,
  listPositionsSchema,
  forceClosePositionSchema,
  reportPeriodSchema,
} from "./validators/admin.validators.js";

export type {
  ListUsersInput,
  SuspendUserInput as SuspendUserValidatedInput,
  UnsuspendUserInput as UnsuspendUserValidatedInput,
  UpdateUserRoleInput as UpdateUserRoleValidatedInput,
  ListAccountsInput,
  AdminDepositInput,
  AdminWithdrawInput,
  FreezeAccountInput,
  UnfreezeAccountInput,
  CircuitBreakerInput,
  UpsertSymbolInput as UpsertSymbolValidatedInput,
  SymbolActionInput,
  AuditLogFilterInput,
  // Phase 2 validator types
  ListOrdersInput,
  CancelOrderInput,
  CancelAllOrdersInput,
  ListPositionsInput,
  ForceClosePositionInput,
  ReportPeriodInput,
} from "./validators/admin.validators.js";
