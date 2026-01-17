import { useMemo, useState, type FormEvent, type ChangeEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { Notification, Text } from "@repo/ui";
import { authApi } from "../../auth/auth.api.js";
import { isLikelyEmail } from "../../lib/validation.js";
import { resolveReturnTo } from "../../lib/redirectUtils.js";
import { AuthLayout } from "../AuthLayout.js";
import { InputWrapper, StyledInput, FloatingLabel, NeonButton } from "../Design/System.js";

function buildLink(path: string, returnTo?: string): string {
	if (!returnTo) return path;
	return `${path}?returnTo=${encodeURIComponent(returnTo)}`;
}

export default function ForgotPasswordPage() {
	const location = useLocation();
	const returnTo = useMemo(() => {
		return resolveReturnTo(new URLSearchParams(location.search))?.value;
	}, [location.search]);

	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [done, setDone] = useState(false);

	const canSubmit = isLikelyEmail(email) && !loading;

	const submit = async (e: FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!isLikelyEmail(email)) {
			setError("Enter a valid email address");
			return;
		}

		setLoading(true);
		try {
			// For security, the UI stays generic regardless of whether the email exists.
			await authApi.requestPasswordReset({ email });
			setDone(true);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unable to send reset email");
		} finally {
			setLoading(false);
		}
	};

	return (
		<AuthLayout title="Reset Password" subtitle="Enter your email to receive instructions">
			{error ? (
				<Notification
					variant="danger"
					title="Request failed"
					message={error}
					onClose={() => setError(null)}
				/>
			) : null}

			{done ? (
				<>
					<div style={{ 
            background: 'rgba(63, 185, 80, 0.1)', 
            border: '1px solid rgba(63, 185, 80, 0.2)', 
            borderRadius: '12px', 
            padding: '24px',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            <Text variant="h3" color="success" style={{ marginBottom: '8px' }}>Check your email</Text>
            <Text color="secondary">
              If an account exists for <strong>{email}</strong>, you will receive a reset link shortly.
            </Text>
					</div>
          
					<div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
						<Link 
              to={buildLink("/login", returnTo)}
              style={{ 
                color: '#58A6FF', 
                textDecoration: 'none',
                fontWeight: 600
              }}
            >
              Back to sign in
            </Link>
					</div>
				</>
			) : (
				<>
					<form onSubmit={submit} style={{ display: "flex", flexDirection: "column", marginTop: 24 }}>
            <InputWrapper>
              <StyledInput
                id="email"
                value={email}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                placeholder=" "
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                autoFocus
                required
                disabled={loading}
              />
              <FloatingLabel htmlFor="email">Email Address</FloatingLabel>
            </InputWrapper>

						<NeonButton type="submit" $variant="primary" disabled={!canSubmit} $loading={loading}>
							{loading ? "" : "Send Reset Link"}
						</NeonButton>
					</form>

					<div style={{ marginTop: 24, display: "flex", justifyContent: "center" }}>
						<Text color="secondary">
							Remembered it? <Link to={buildLink("/login", returnTo)} style={{ color: '#58A6FF', textDecoration: 'none' }}>Sign in</Link>
						</Text>
					</div>
				</>
			)}
		</AuthLayout>
	);
}
