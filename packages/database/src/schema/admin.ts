/**
 * Admin Schema
 * ============
 *
 * Tables for admin audit logging and compliance tracking.
 */

import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './core.js';

// =============================================================================
// ADMIN AUDIT LOG
// =============================================================================

/**
 * Admin Audit Log - Immutable record of all admin actions
 *
 * CRITICAL TABLE - This is the compliance and security audit trail.
 * This table is APPEND-ONLY. Records are NEVER updated or deleted.
 */
export const adminAuditLog = pgTable('admin_audit_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  adminUserId: uuid('admin_user_id').notNull().references(() => users.id),
  adminEmail: varchar('admin_email', { length: 255 }),
  action: varchar('action', { length: 100 }).notNull(),
  targetType: varchar('target_type', { length: 50 }).notNull(),
  targetId: uuid('target_id'),
  targetIdentifier: varchar('target_identifier', { length: 255 }),
  oldValue: jsonb('old_value'),
  newValue: jsonb('new_value'),
  reason: varchar('reason', { length: 1000 }).notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: varchar('user_agent', { length: 500 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  adminUserIdx: index('idx_admin_audit_admin').on(table.adminUserId),
  actionIdx: index('idx_admin_audit_action').on(table.action),
  targetIdx: index('idx_admin_audit_target').on(table.targetType, table.targetId),
  timeIdx: index('idx_admin_audit_time').on(table.createdAt),
}));
