import { describe, it, expect, vi } from "vitest";
import { createLoginController } from "../../src/domains/auth/controllers/login.controller.js";
import type { AuthService } from "../../src/domains/auth/index.js";
import type { HttpRequest } from "../../src/api/types.js";

describe("authController", () => {
    describe("login", () => {
        it("should return 200 and tokens on successful login", async () => {
            // Mock AuthService
            const mockAuthService = {
                authenticate: vi.fn().mockResolvedValue({
                    user: { id: "123", email: "test@example.com" },
                    session: { id: "sess_1" },
                    tokens: { accessToken: "access.token", refreshToken: "refresh.token" }
                }),
            } as unknown as AuthService;

            const login = createLoginController(mockAuthService);

            const request: HttpRequest = {
                body: { email: "test@example.com", password: "password123" },
                query: {},
                params: {},
                headers: {},
            };

            const response = await login(request);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                user: { id: "123", email: "test@example.com" },
                session: { id: "sess_1" },
                tokens: { accessToken: "access.token", refreshToken: "refresh.token" }
            });
            expect(mockAuthService.authenticate).toHaveBeenCalledWith({
                email: "test@example.com",
                password: "password123",
            });
        });

        it("should return 400 if validation fails", async () => {
            const mockAuthService = {
                authenticate: vi.fn(),
            } as unknown as AuthService;

            const login = createLoginController(mockAuthService);

            const request: HttpRequest = {
                body: { email: "test@example.com" }, // Missing password
                query: {},
                params: {},
                headers: {},
            };

            const response = await login(request);

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty("error");
        });

        it("should return 401 if authentication fails", async () => {
            const mockAuthService = {
                authenticate: vi.fn().mockRejectedValue({ code: "INVALID_CREDENTIALS" }),
            } as unknown as AuthService;

            const login = createLoginController(mockAuthService);

            const request: HttpRequest = {
                body: { email: "test@example.com", password: "wrong" },
                query: {},
                params: {},
                headers: {},
            };

            const response = await login(request);

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "INVALID_CREDENTIALS" });
        });
    });
});
