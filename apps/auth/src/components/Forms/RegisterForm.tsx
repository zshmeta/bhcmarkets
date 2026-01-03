/**
 * Register Page.
 * 
 * User registration interface with email and password.
 */

import { useMemo, useState, type FormEvent, type ChangeEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button, EmailInput, Notification, PasswordInput, Text } from "@repo/ui";
import { useAuth } from "../../auth/auth.hooks.js";
import { authApi } from "../../auth/auth.api.js";
import { AuthShell } from "../AuthShell.js";
import { isAcceptablePassword, isLikelyEmail } from "../../lib/validation.js";
import { resolveReturnTo, redirectToReturnTo } from "../../lib/redirectUtils.js";

function buildLink(path: string, returnTo?: string): string {
	if (!returnTo) return path;
	return `${path}?returnTo=${encodeURIComponent(returnTo)}`;
}

export function RegisterPage() {
  const { register, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
	const location = useLocation();

	const safeReturnTo = useMemo(() => resolveReturnTo(new URLSearchParams(location.search)), [location.search]);

	const returnTo = safeReturnTo?.value;
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

	const canSubmit =
		isLikelyEmail(email) &&
		isAcceptablePassword(password) &&
		password === confirmPassword &&
		!loading;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    // Validate basic inputs (UX only; backend is source of truth)
    if (!isLikelyEmail(email)) {
      setLocalError("Enter a valid email address");
      return;
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    if (!isAcceptablePassword(password)) {
			setLocalError("Password must be at least 12 characters");
      return;
    }

    try {
      await register({ 
        email, 
        password,
        issueSession: true // Automatically log in after registration
      });

      // If we have an external return URL, we need to perform a secure handoff.
      if (safeReturnTo?.kind === "absolute") {
        try {
          const { code } = await authApi.generateAuthCode({ targetUrl: safeReturnTo.value });
          const url = new URL(safeReturnTo.value);
          url.searchParams.set("code", code);
          window.location.replace(url.toString());
          return;
        } catch (handoffError) {
          console.error("Handoff failed", handoffError);
          redirectToReturnTo(safeReturnTo, navigate);
        }
      } else {
        redirectToReturnTo(safeReturnTo, navigate);
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Registration failed");
    }
  };

  return (
		<AuthShell title="Create account" subtitle="Set up your account in minutes">
			{(error || localError) ? (
				<Notification
					variant="danger"
					title="Unable to create account"
					message={error || localError || undefined}
					onClose={() => {
						setLocalError(null);
						clearError();
					}}
				/>
			) : null}

			<form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
				<EmailInput
					label="Email"
					value={email}
					onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
					placeholder="you@company.com"
					autoComplete="email"
					autoCapitalize="none"
					spellCheck={false}
					autoFocus
					required
					disabled={loading}
					showValidation
				/>

				<PasswordInput
					label="Password"
					value={password}
					onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
					placeholder="Minimum 12 characters"
					helpText="Use at least 12 characters."
					autoComplete="new-password"
					showStrength
					required
					disabled={loading}
				/>

				<PasswordInput
					label="Confirm password"
					value={confirmPassword}
					onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
					placeholder="Re-enter password"
					autoComplete="new-password"
					required
					disabled={loading}
				/>

				<Button type="submit" variant="primary" fullWidth loading={loading} disabled={!canSubmit}>
					Create account
				</Button>
			</form>

			<div style={{ marginTop: 12, display: "flex", justifyContent: "center" }}>
				<Text variant="caption" color="tertiary" align="center">
					You can manage and revoke sessions after sign in.
				</Text>
			</div>

			<div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
				<Text color="secondary">
					Already have an account? <Link to={buildLink("/login", returnTo)}>Sign in</Link>
				</Text>
			</div>
		</AuthShell>
  );
}
