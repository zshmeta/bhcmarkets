import { useMemo, useState, type FormEvent, type ChangeEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Notification, Text } from "@repo/ui";
import { AuthLayout } from "../AuthLayout.js";
import { authApi } from "../../auth/auth.api.js";
import { isAcceptablePassword } from "../../lib/validation.js";
import { resolveReturnTo } from "../../lib/redirectUtils.js";
import { InputWrapper, StyledInput, FloatingLabel, NeonButton, ErrorText } from "../Design/System.js";

function buildLink(path: string, returnTo?: string): string {
	if (!returnTo) return path;
	return `${path}?returnTo=${encodeURIComponent(returnTo)}`;
}

function useQueryToken(): string {
	const location = useLocation();
	return useMemo(() => new URLSearchParams(location.search).get("token") || "", [location.search]);
}

export default function ResetPasswordPage() {
	const navigate = useNavigate();
	const location = useLocation();
	const token = useQueryToken();
	const returnTo = useMemo(() => {
		return resolveReturnTo(new URLSearchParams(location.search))?.value;
	}, [location.search]);

	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [done, setDone] = useState(false);

	const canSubmit =
		token.length > 0 &&
		isAcceptablePassword(password) &&
		password === confirmPassword &&
		!loading;

	const submit = async (e: FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!token) {
			setError("Missing reset token. Please use the link from your email.");
			return;
		}

		if (!isAcceptablePassword(password)) {
			setError("Password must be at least 12 characters");
			return;
		}

		if (password !== confirmPassword) {
			setError("Passwords do not match");
			return;
		}

		setLoading(true);
		try {
			await authApi.confirmPasswordReset({ token, newPassword: password });
			setDone(true);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unable to reset password");
		} finally {
			setLoading(false);
		}
	};

	return (
		<AuthLayout title="Choose a new password" subtitle="Make it strong and unique">
			{error ? (
				<Notification
					variant="danger"
					title="Reset failed"
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
            <Text variant="h3" color="success" style={{ marginBottom: '8px' }}>Password Updated</Text>
            <Text color="secondary">
              Your password has been reset successfully. You can now sign in with your new credentials.
            </Text>
					</div>

					<div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
						<NeonButton
							type="button"
							$variant="primary"
							onClick={() => navigate(buildLink("/login", returnTo), { replace: true })}
						>
							Go to Sign In
						</NeonButton>
					</div>
				</>
			) : (
				<>
					<form onSubmit={submit} style={{ display: "flex", flexDirection: "column", marginTop: 24 }}>
            <InputWrapper>
              <StyledInput
                id="password"
                type="password"
                value={password}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                placeholder=" "
                autoComplete="new-password"
                required
                disabled={loading}
              />
              <FloatingLabel htmlFor="password">New Password (Min 12 chars)</FloatingLabel>
            </InputWrapper>

            <InputWrapper>
              <StyledInput
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                placeholder=" "
                autoComplete="new-password"
                required
                disabled={loading}
              />
              <FloatingLabel htmlFor="confirmPassword">Confirm New Password</FloatingLabel>
              {confirmPassword && password !== confirmPassword && (
                <ErrorText>Passwords do not match</ErrorText>
              )}
            </InputWrapper>

						<NeonButton type="submit" $variant="primary" disabled={!canSubmit} $loading={loading}>
							{loading ? "" : "Update Password"}
						</NeonButton>
					</form>

					<div style={{ marginTop: 24, display: "flex", justifyContent: "center" }}>
						<Text color="secondary">
							Back to <Link to={buildLink("/login", returnTo)} style={{ color: '#58A6FF', textDecoration: 'none' }}>sign in</Link>
						</Text>
					</div>
				</>
			)}
		</AuthLayout>
	);
}
