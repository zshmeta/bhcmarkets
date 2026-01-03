/**
 * Auth Hooks.
 * 
 * Provides React hooks for authentication functionality.
 * Re-exports useAuth from auth.store and adds additional hooks.
 */

export { useAuth } from "./auth.store.js";

import { useEffect } from "react";
import { useAuth } from "./auth.store.js";

/**
 * Hook to require authentication.
 * Redirects to login if not authenticated.
 * 
 * @param redirectUrl - URL to redirect to after login
 */
export function useRequireAuth(redirectUrl = "/login") {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Store intended destination
      sessionStorage.setItem("auth_redirect", window.location.pathname);
      
      // Redirect to login
      window.location.href = redirectUrl;
    }
  }, [isAuthenticated, loading, redirectUrl]);

  return { isAuthenticated, loading };
}

/**
 * Hook to get redirect URL after login.
 * Returns the URL the user was trying to access before login.
 */
export function useAuthRedirect(): string {
  const redirectUrl = sessionStorage.getItem("auth_redirect");
  
  // Clear the stored redirect
  if (redirectUrl) {
    sessionStorage.removeItem("auth_redirect");
  }
  
  return redirectUrl || "/";
}

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
