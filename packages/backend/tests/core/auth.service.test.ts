import { describe, it, expect, vi, beforeEach } from "vitest";
import { createAuthService, AuthError } from "../../src/domains/auth/index.js";

// Mock dependencies
const mockUserRepository = {
    findByEmail: vi.fn(),
    create: vi.fn(),
    findById: vi.fn(),
    updateLastLogin: vi.fn(),
};
const mockCredentialRepository = {
    create: vi.fn(),
    getByUserId: vi.fn(),
    recordFailedAttempt: vi.fn(),
    resetFailedAttempts: vi.fn(),
};
const mockSessionRepository = {
    create: vi.fn(),
    listActiveByUser: vi.fn(),
    markInactive: vi.fn(),
};
const mockPasswordHasher = {
    hash: vi.fn().mockResolvedValue("hashed_password"),
    verify: vi.fn(),
};
const mockTokenManager = {
    issueAccessToken: vi.fn().mockResolvedValue("access_token"),
    issueRefreshToken: vi.fn().mockResolvedValue("refresh_token"),
    parseRefreshToken: vi.fn(),
};

describe("AuthService", () => {
    let authService: any;

    const mockAuthCodeRepository = {
        save: vi.fn(),
        findByCode: vi.fn(),
        markUsed: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        authService = createAuthService({
            userRepository: mockUserRepository as any,
            credentialRepository: mockCredentialRepository as any,
            sessionRepository: mockSessionRepository as any,
            authCodeRepository: mockAuthCodeRepository as any,
            passwordHasher: mockPasswordHasher,
            tokenManager: mockTokenManager as any,
        });
    });

    describe("register", () => {
        it("should register a new user successfully", async () => {
            mockUserRepository.findByEmail.mockResolvedValue(null);
            mockUserRepository.create.mockResolvedValue({ id: "user_1", email: "test@example.com", role: "user", status: "pending" });
            mockCredentialRepository.create.mockResolvedValue({ userId: "user_1", version: 1 });
            mockSessionRepository.create.mockResolvedValue({ id: "session_1", refreshTokenVersion: 1, createdAt: new Date().toISOString() });
            mockSessionRepository.listActiveByUser.mockResolvedValue([]);

            const result = await authService.register({
                email: "test@example.com",
                password: "password123",
            });

            expect(result.user).toBeDefined();
            expect(result.user.email).toBe("test@example.com");
            expect(mockUserRepository.create).toHaveBeenCalled();
            expect(mockCredentialRepository.create).toHaveBeenCalled();
        });

        it("should throw if email already exists", async () => {
            mockUserRepository.findByEmail.mockResolvedValue({ id: "user_1" });

            await expect(authService.register({
                email: "test@example.com",
                password: "password123",
            })).rejects.toThrow(AuthError);
        });
    });

    describe("authenticate", () => {
        it("should authenticate valid credentials", async () => {
            const user = { id: "user_1", email: "test@example.com", status: "active", role: "user" };
            const credential = { userId: "user_1", passwordHash: "hashed_password", version: 1 };

            mockUserRepository.findByEmail.mockResolvedValue(user);
            mockCredentialRepository.getByUserId.mockResolvedValue(credential);
            mockPasswordHasher.verify.mockResolvedValue(true);
            mockSessionRepository.create.mockResolvedValue({ id: "session_1", refreshTokenVersion: 1 });
            mockSessionRepository.listActiveByUser.mockResolvedValue([]);

            const result = await authService.authenticate({
                email: "test@example.com",
                password: "password123",
            });

            expect(result.tokens).toBeDefined();
            expect(result.tokens.accessToken).toBe("access_token");
        });

        it("should throw on invalid password", async () => {
            const user = { id: "user_1", email: "test@example.com", status: "active" };
            const credential = { userId: "user_1", passwordHash: "hashed_password" };

            mockUserRepository.findByEmail.mockResolvedValue(user);
            mockCredentialRepository.getByUserId.mockResolvedValue(credential);
            mockPasswordHasher.verify.mockResolvedValue(false);

            await expect(authService.authenticate({
                email: "test@example.com",
                password: "wrong_password",
            })).rejects.toThrow(AuthError);
        });
    });
});
