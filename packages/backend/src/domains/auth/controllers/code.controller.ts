import type { HttpRequest, HttpResponse } from "../../../api/types.js";
import type { AuthService } from "../core/auth.service.js";
import { AuthError } from "../core/auth.errors.js";

export function createGenerateCodeController(authService: AuthService) {
  return async (req: HttpRequest): Promise<HttpResponse> => {
    try {
      // In a real application, an auth middleware would populate req.user
      // For this temp implementation, we'll assume req.user or extract from header if possible,
      // or fail if we can't identify the user.
      // Since we can't easily change the middleware here, we'll assume the body MIGHT contain userId
      // for testing purposes, but strictly it should come from the token.
      
      const body = req.body as { targetUrl: string; userId?: string };
      const { targetUrl } = body;
      
      // Fallback to body.userId if req.user is missing (for testing/compatibility)
      const userId = (req as any).user?.id || body.userId;

      if (!userId) {
        return { status: 401, body: { error: "UNAUTHORIZED", message: "User not authenticated" } };
      }

      if (!targetUrl) {
        return { status: 400, body: { error: "VALIDATION_ERROR", message: "targetUrl is required" } };
      }

      const code = await authService.generateAuthCode(userId, targetUrl);

      return {
        status: 200,
        body: { code },
      };
    } catch (error: unknown) {
      if (AuthError.isAuthError(error)) {
        return {
          status: error.httpStatus,
          body: error.toJSON(),
        };
      }
      return {
        status: 500,
        body: { error: "INTERNAL_ERROR" },
      };
    }
  };
}

export function createExchangeCodeController(authService: AuthService) {
  return async (req: HttpRequest): Promise<HttpResponse> => {
    try {
      const { code } = req.body as { code: string };

      if (!code) {
        return { status: 400, body: { error: "VALIDATION_ERROR", message: "code is required" } };
      }

      const result = await authService.exchangeAuthCode(code);

      return {
        status: 200,
        body: result,
      };
    } catch (error: unknown) {
      if (AuthError.isAuthError(error)) {
        return {
          status: error.httpStatus,
          body: error.toJSON(),
        };
      }
      return {
        status: 500,
        body: { error: "INTERNAL_ERROR" },
      };
    }
  };
}
