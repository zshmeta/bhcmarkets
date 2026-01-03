/**
 * Login Page.
 * 
 * User login interface with email and password.
 */

import { useMemo, useState, type FormEvent, type ChangeEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button, EmailInput, Notification, PasswordInput, Text } from "@repo/ui";
import { useAuth } from "../../auth/auth.hooks.js";
import { authApi } from "../../auth/auth.api.js";
import { resolveReturnTo, redirectToReturnTo } from "../../lib/redirectUtils.js";
import { AuthShell } from "../AuthShell.js";
import { isLikelyEmail } from "../../lib/validation.js";

function buildLink(path: string, returnTo?: string): string {
	if (!returnTo) return path;
	return `${path}?returnTo=${encodeURIComponent(returnTo)}`;
}

export function LoginPage() {
  const { login, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

	const canSubmit = isLikelyEmail(email) && password.length > 0 && !loading;

	const safeReturnTo = useMemo(() => resolveReturnTo(new URLSearchParams(location.search)), [location.search]);

	const returnTo = safeReturnTo?.value;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

		if (!isLikelyEmail(email)) {
			setLocalError("Enter a valid email address");
			return;
		}

    try {
      await login({ email, password });

      // If we have an external return URL, we need to perform a secure handoff.
      // The local login established a session on THIS domain (auth.example.com).
      // Now we need to pass a one-time code to the target domain (app.example.com)
      // so it can exchange it for its own tokens.
      if (safeReturnTo?.kind === "absolute") {
        try {
          const { code } = await authApi.generateAuthCode({ targetUrl: safeReturnTo.value });
          
          // Append code to the return URL
          const url = new URL(safeReturnTo.value);
          url.searchParams.set("code", code);
          
          // Redirect to the target app with the code
          window.location.replace(url.toString());
          return;
        } catch (handoffError) {
          console.error("Handoff failed", handoffError);
          // Fallback: just redirect (user might need to login again or SSO cookie might work)
          redirectToReturnTo(safeReturnTo, navigate);
        }
      } else {
        redirectToReturnTo(safeReturnTo, navigate);
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Login failed");
    }
  };

  return (
		<AuthShell title="Sign in" subtitle="Access your account securely">
			{(error || localError) ? (
				<Notification
					variant="danger"
					title="Unable to sign in"
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
					placeholder="Your password"
					autoComplete="current-password"
					required
					disabled={loading}
				/>

				<Button type="submit" variant="primary" fullWidth loading={loading} disabled={!canSubmit}>
					Sign in
				</Button>
			</form>

			<div style={{ marginTop: 12, display: "flex", justifyContent: "center" }}>
				<Text variant="caption" color="tertiary" align="center">
					Use a trusted device. Sessions can be revoked anytime.
				</Text>
			</div>

			<div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
				<Text color="secondary">
					No account? <Link to={buildLink("/register", returnTo)}>Create one</Link>
				</Text>
			</div>
			<div style={{ marginTop: 8, display: "flex", justifyContent: "center" }}>
				<Text color="tertiary">
					<Link to={buildLink("/forgot-password", returnTo)}>Forgot password?</Link>
				</Text>
			</div>
		</AuthShell>
  );
}
