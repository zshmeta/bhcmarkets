export { useAuth } from "./auth.store.js";

import { useAuth } from "./auth.store.js";

/**
 * Hook to check if user has a specific role.
 * 
 * @param role - Role to check
 * @returns Whether user has the role
 */
export function useHasRole(role: string): boolean {
  const { user } = useAuth();
  return user?.role === role;
}

/**
 * Hook to check if user has any of the specified roles.
 * 
 * @param roles - Roles to check
 * @returns Whether user has any of the roles
 */
export function useHasAnyRole(roles: string[]): boolean {
  const { user } = useAuth();
  return user ? roles.includes(user.role) : false;
}
