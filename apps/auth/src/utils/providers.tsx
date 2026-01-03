/**
 * App Providers.
 * 
 * Wraps the app with all necessary context providers.
 */

import { type ReactNode } from "react";
import { AuthProvider } from "../auth/auth.store.js";

export interface ProvidersProps {
  children: ReactNode;
}

/**
 * All app providers.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
