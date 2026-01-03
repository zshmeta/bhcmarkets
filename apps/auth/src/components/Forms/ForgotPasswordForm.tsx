import { useMemo, useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button, EmailInput, Notification, Text } from "@repo/ui";
import { authApi } from "../../auth/auth.api";
import { isLikelyEmail } from "../../lib/validation";
import { resolveReturnTo } from "../../lib/redirectUtils";
import { AuthShell } from "../AuthShell";

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
		<AuthShell title="Reset password" subtitle="We’ll email you a reset link">
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
					<Notification
						variant="success"
						title="Check your email"
						message="If an account exists for that address, you’ll receive a reset link shortly."
					/>
					<div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
						<Text color="secondary">
							Back to <Link to={buildLink("/login", returnTo)}>sign in</Link>
						</Text>
					</div>
				</>
			) : (
				<>
					<form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
						<EmailInput
							label="Email"
							value={email}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
							placeholder="you@company.com"
							autoComplete="email"
							autoCapitalize="none"
							spellCheck={false}
							autoFocus
							required
							disabled={loading}
							showValidation
						/>

						<Button type="submit" variant="primary" fullWidth loading={loading} disabled={!canSubmit}>
							Send reset link
						</Button>
					</form>

					<div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
						<Text color="secondary">
							Remembered it? <Link to={buildLink("/login", returnTo)}>Sign in</Link>
						</Text>
					</div>
				</>
			)}
		</AuthShell>
	);
}
