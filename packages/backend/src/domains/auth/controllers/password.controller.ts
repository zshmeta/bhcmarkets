import type { HttpRequest, HttpResponse } from "../../../../api/types.js";
import type { AuthService } from "../core/auth.service.js";
import { z } from "zod";
import { AuthError } from "../core/auth.errors.js";

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

export const createRequestPasswordResetController = (auth: AuthService) => {
  return async (req: HttpRequest): Promise<HttpResponse> => {
    const result = forgotPasswordSchema.safeParse(req.body);
    if (!result.success) {
      return { status: 400, body: { error: "INVALID_EMAIL" } };
    }

    await auth.requestPasswordReset(result.data.email);
    // Always return 200 even if user not found
    return { status: 200, body: { success: true, message: "If that email exists, a reset link has been sent." } };
  };
};

export const createConfirmPasswordResetController = (auth: AuthService) => {
  return async (req: HttpRequest): Promise<HttpResponse> => {
    const result = resetPasswordSchema.safeParse(req.body);
    if (!result.success) {
      return { status: 400, body: { error: "INVALID_INPUT", details: result.error.flatten() } };
    }

    try {
      await auth.confirmPasswordReset(result.data.token, result.data.password);
      return { status: 200, body: { success: true, message: "Password updated successfully" } };
    } catch (err: unknown) {
      if (err instanceof AuthError) {
        return { status: err.httpStatus, body: err.toJSON() };
      }
      throw err;
    }
  };
};
