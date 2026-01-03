import { z } from "zod";

const emailSchema = z.string().trim().email();
const passwordSchema = z.string().min(1);

const loginSchema = z
	.object({
		email: emailSchema,
		password: passwordSchema,
	})
	.strict();

const registerSchema = z
	.object({
		email: emailSchema,
		password: passwordSchema,
		issueSession: z.boolean().optional(),
	})
	.strict();

const refreshSchema = z
	.object({
		refreshToken: z.string().min(1),
	})
	.strict();

const logoutSchema = z
	.object({
		sessionId: z.string().min(1),
		userId: z.string().min(1).optional(),
		reason: z.string().min(1).optional(),
	})
	.strict();

const logoutAllSchema = z
	.object({
		userId: z.string().min(1),
		excludeSessionId: z.string().min(1).optional(),
		reason: z.string().min(1).optional(),
	})
	.strict();

export type LoginBody = z.infer<typeof loginSchema>;
export type RegisterBody = z.infer<typeof registerSchema>;
export type RefreshBody = z.infer<typeof refreshSchema>;
export type LogoutBody = z.infer<typeof logoutSchema>;
export type LogoutAllBody = z.infer<typeof logoutAllSchema>;

const fail = (msg: string): never => {
	throw new Error(`validation_error: ${msg}`);
};

export const validateLogin = (body: unknown): LoginBody => {
	const parsed = loginSchema.safeParse(body);
	if (parsed.success) return parsed.data;
	fail("email and password required");
	// Unreachable, but keeps TS happy in some configs.
	return undefined as never;
};

export const validateRegister = (body: unknown): RegisterBody => {
	const parsed = registerSchema.safeParse(body);
	if (parsed.success) return parsed.data;
	fail("email and password required");
	return undefined as never;
};

export const validateRefresh = (body: unknown): RefreshBody => {
	const parsed = refreshSchema.safeParse(body);
	if (parsed.success) return parsed.data;
	fail("refreshToken required");
	return undefined as never;
};

export const validateLogout = (body: unknown): LogoutBody => {
	const parsed = logoutSchema.safeParse(body);
	if (parsed.success) return parsed.data;
	fail("sessionId required");
	return undefined as never;
};

export const validateLogoutAll = (body: unknown): LogoutAllBody => {
	const parsed = logoutAllSchema.safeParse(body);
	if (parsed.success) return parsed.data;
	fail("userId required");
	return undefined as never;
};

