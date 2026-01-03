import { useMemo, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button, Notification, PasswordInput, Text } from "@repo/ui";
import { AuthShell } from "../AuthShell";
import { authApi } from "../../auth/auth.api";
import { isAcceptablePassword } from "../../lib/validation";
import { resolveReturnTo } from "../../lib/redirectUtils";

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
		<AuthShell title="Choose a new password" subtitle="Make it strong and unique">
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
					<Notification
						variant="success"
						title="Password updated"
						message="You can now sign in with your new password."
					/>
					<div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
						<Button
							type="button"
							variant="primary"
							onClick={() => navigate(buildLink("/login", returnTo), { replace: true })}
						>
							Go to sign in
						</Button>
					</div>
				</>
			) : (
				<>
					<form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
						<PasswordInput
							label="New password"
							value={password}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
							placeholder="Minimum 12 characters"
							autoComplete="new-password"
							required
							disabled={loading}
							showStrength
						/>
						<PasswordInput
							label="Confirm new password"
							value={confirmPassword}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
							placeholder="Re-enter password"
							autoComplete="new-password"
							required
							disabled={loading}
						/>

						<Button type="submit" variant="primary" fullWidth loading={loading} disabled={!canSubmit}>
							Update password
						</Button>
					</form>

					<div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
						<Text color="secondary">
							Back to <Link to={buildModeLink("login", returnTo)}>sign in</Link>
						</Text>
					</div>
				</>
			)}
		</AuthShell>
	);
}
