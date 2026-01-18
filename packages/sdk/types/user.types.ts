import type { UUID } from "./trading.types.js";

export type UserStatus = "active" | "pending" | "suspended" | "deleted";
export type UserRole = "user" | "admin" | "support";

export interface User {
	id: UUID;
	email: string;
	status: UserStatus;
	role: UserRole;
	createdAt: string;
	updatedAt: string;
}

export type AccountType = "spot" | "margin" | "futures" | "demo";
export type AccountStatus = "active" | "locked" | "closed";

export interface Account {
	id: UUID;
	userId: UUID;
	currency: string;
	balance: string;
	locked: string;
	accountType: AccountType;
	status: AccountStatus;
	createdAt: string;
	updatedAt: string;
}

export type KycStatus = "not_submitted" | "pending" | "verified" | "rejected";

export interface UserProfile {
	id: UUID;
	userId: UUID;
	firstName?: string;
	lastName?: string;
	country?: string;
	phoneNumber?: string;
	dateOfBirth?: string; // YYYY-MM-DD
	kycStatus: KycStatus;
	createdAt: string;
	updatedAt: string;
}
