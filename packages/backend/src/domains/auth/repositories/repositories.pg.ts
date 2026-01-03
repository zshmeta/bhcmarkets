/*
  repositories.pg.ts
  Postgres-backed repository implementations for the auth domain.
  We keep SQL explicit and minimal to teach data flow and ease future migrations.
*/

import type { Pool } from "pg";
import type {
	CreateCredentialParams,
	CreateSessionParams,
	CreateUserParams,
	SessionInvalidationReason,
	User,
	UserCredential,
	UserCredentialRepository,
	UserRepository,
	UserSession,
	UserSessionRepository,
	UUID,
} from "./auth.types.js";

type Row = Record<string, unknown>;

const toIsoString = (value: unknown): string => {
	if (!value) return new Date().toISOString();
	if (value instanceof Date) return value.toISOString();
	const parsed = new Date(String(value));
	return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
};

const mapUser = (r: Row): User => ({
	id: String(r.id),
	email: String(r.email),
	status: r.status as User["status"],
	role: r.role as User["role"],
	createdAt: toIsoString(r.created_at),
	updatedAt: toIsoString(r.updated_at),
});

const mapCredential = (r: Row): UserCredential => ({
	userId: String(r.user_id),
	passwordHash: String(r.password_hash),
	version: Number(r.version ?? 1),
	failedAttemptCount: Number(r.failed_attempt_count ?? 0),
	lockedUntil: r.locked_until ? String(r.locked_until) : undefined,
	passwordUpdatedAt: toIsoString(r.password_updated_at),
	createdAt: toIsoString(r.created_at),
	updatedAt: toIsoString(r.updated_at),
});

const mapSession = (r: Row): UserSession => ({
	id: String(r.id),
	userId: String(r.user_id),
	refreshTokenHash: String(r.refresh_token_hash),
	refreshTokenVersion: Number(r.refresh_token_version ?? 1),
	passwordVersion: Number(r.password_version ?? 1),
	status: r.status as UserSession["status"],
	ipAddress: r.ip_address ? String(r.ip_address) : undefined,
	userAgent: r.user_agent ? String(r.user_agent) : undefined,
	createdAt: toIsoString(r.created_at),
	lastSeenAt: toIsoString(r.last_seen_at ?? r.created_at),
	expiresAt: toIsoString(r.expires_at),
	revokedAt: r.revoked_at ? toIsoString(r.revoked_at) : undefined,
	revokedReason: r.revoked_reason
		? (String(r.revoked_reason) as SessionInvalidationReason)
		: undefined,
});

export function createUserRepository(pool: Pool): UserRepository {
	return {
		async create(input: CreateUserParams) {
			const { rows } = await pool.query(
				`INSERT INTO users (id, email, status, role, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING *`,
				[input.id, input.email, input.status, input.role, input.createdAt, input.updatedAt],
			);
			return mapUser(rows[0]);
		},
		async findByEmail(email: string) {
			const { rows } = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
			return rows[0] ? mapUser(rows[0]) : null;
		},
		async findById(id: UUID) {
			const { rows } = await pool.query(`SELECT * FROM users WHERE id = $1`, [id]);
			return rows[0] ? mapUser(rows[0]) : null;
		},
		async updateStatus(id: UUID, status: User["status"]) {
			await pool.query(`UPDATE users SET status = $2, updated_at = now() WHERE id = $1`, [id, status]);
		},
		async updateLastLogin(id: UUID, at: string) {
			await pool.query(`UPDATE users SET last_login_at = $2, updated_at = now() WHERE id = $1`, [id, at]);
		},
	};
}

export function createCredentialRepository(pool: Pool): UserCredentialRepository {
	return {
		async create(input: CreateCredentialParams) {
			const { rows } = await pool.query(
				`INSERT INTO user_credentials (user_id, password_hash, version, password_updated_at, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING *`,
				[
					input.userId,
					input.passwordHash,
					input.version,
					input.passwordUpdatedAt,
					input.createdAt,
					input.updatedAt,
				],
			);
			return mapCredential(rows[0]);
		},
		async getByUserId(userId: UUID) {
			const { rows } = await pool.query(`SELECT * FROM user_credentials WHERE user_id = $1`, [userId]);
			return rows[0] ? mapCredential(rows[0]) : null;
		},
		async updatePassword(
			userId: UUID,
			params: { passwordHash: string; version: number; passwordUpdatedAt: string; updatedAt: string },
		) {
			await pool.query(
				`UPDATE user_credentials
           SET password_hash=$2, version=$3, password_updated_at=$4, updated_at=$5
         WHERE user_id=$1`,
				[userId, params.passwordHash, params.version, params.passwordUpdatedAt, params.updatedAt],
			);
		},
		async recordFailedAttempt(userId: UUID, at: string) {
			await pool.query(
				`UPDATE user_credentials
           SET failed_attempt_count = COALESCE(failed_attempt_count,0) + 1, updated_at=$2
         WHERE user_id=$1`,
				[userId, at],
			);
		},
		async resetFailedAttempts(userId: UUID) {
			await pool.query(`UPDATE user_credentials SET failed_attempt_count = 0 WHERE user_id=$1`, [userId]);
		},
	};
}

export function createSessionRepository(pool: Pool): UserSessionRepository {
	return {
		async create(input: CreateSessionParams) {
			const { rows } = await pool.query(
				`INSERT INTO auth_sessions (id, user_id, refresh_token_hash, refresh_token_version, password_version, status, user_agent, ip_address, device_fingerprint, created_at, last_seen_at, expires_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NULL,$9,$10,$11)
         RETURNING *`,
				[
					input.id,
					input.userId,
					input.refreshTokenHash,
					input.refreshTokenVersion,
					input.passwordVersion,
					input.status,
					input.userAgent ?? null,
					input.ipAddress ?? null,
					input.createdAt,
					input.lastSeenAt,
					input.expiresAt,
				],
			);
			return mapSession(rows[0]);
		},
		async getById(id: UUID) {
			const { rows } = await pool.query(`SELECT * FROM auth_sessions WHERE id = $1`, [id]);
			return rows[0] ? mapSession(rows[0]) : null;
		},
		async listActiveByUser(userId: UUID) {
			const { rows } = await pool.query(
				`SELECT * FROM auth_sessions WHERE user_id = $1 AND status = 'active' AND expires_at > now() ORDER BY created_at ASC`,
				[userId],
			);
			return rows.map(mapSession);
		},
		async markInactive(sessionId: UUID, reason: SessionInvalidationReason, at: string) {
			const status = reason === "expired" ? "expired" : "revoked";
			await pool.query(
				`UPDATE auth_sessions
           SET status = $2, revoked_reason = $3, revoked_at = $4
         WHERE id = $1 AND status = 'active'`,
				[sessionId, status, reason, at],
			);
		},
		async markInactiveByUser(
			userId: UUID,
			reason: SessionInvalidationReason,
			at: string,
			options?: { excludeSessionId?: UUID },
		) {
			const status = reason === "expired" ? "expired" : "revoked";
			if (options?.excludeSessionId) {
				await pool.query(
					`UPDATE auth_sessions
             SET status = $3, revoked_reason = $4, revoked_at = $5
           WHERE user_id = $1 AND id <> $2 AND status = 'active'`,
					[userId, options.excludeSessionId, status, reason, at],
				);
			} else {
				await pool.query(
					`UPDATE auth_sessions
             SET status = $2, revoked_reason = $3, revoked_at = $4
           WHERE user_id = $1 AND status = 'active'`,
					[userId, status, reason, at],
				);
			}
		},
		async replaceRefreshToken(params) {
			const { rows } = await pool.query(
				`UPDATE auth_sessions
            SET refresh_token_hash = $2,
                refresh_token_version = $3,
                expires_at = $4,
                last_seen_at = $5,
                user_agent = $6,
                ip_address = $7,
                status = 'active'
          WHERE id=$1
          RETURNING *`,
				[
					params.sessionId,
					params.refreshTokenHash,
					params.refreshTokenVersion,
					params.expiresAt,
					params.lastSeenAt,
					params.userAgent ?? null,
					params.ipAddress ?? null,
				],
			);
			return rows[0] ? mapSession(rows[0]) : null;
		},
		async touch(sessionId, { lastSeenAt, ipAddress, userAgent }) {
			await pool.query(
				`UPDATE auth_sessions SET last_seen_at=$2, ip_address=$3, user_agent=$4 WHERE id=$1`,
				[sessionId, lastSeenAt, ipAddress ?? null, userAgent ?? null],
			);
		},
	};
}
