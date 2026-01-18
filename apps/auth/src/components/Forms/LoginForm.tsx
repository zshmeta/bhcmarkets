import { useMemo, useState, type FormEvent, type ChangeEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Notification, Text } from "@repo/ui";
import { useAuth } from "../../auth/auth.hooks.js";
import { authApi } from "../../auth/auth.api.js";
import { resolveReturnTo, redirectToReturnTo } from "../../lib/redirectUtils.js";
import { AuthLayout } from "../AuthLayout.js";
import { isLikelyEmail } from "../../lib/validation.js";
import { InputWrapper, StyledInput, FloatingLabel, NeonButton, ErrorText } from "../Design/System.js";

// --- Icons ---
const AlertIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
);

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

      if (safeReturnTo?.kind === "absolute") {
        try {
          const { code } = await authApi.generateAuthCode({ targetUrl: safeReturnTo.value });
          const url = new URL(safeReturnTo.value);
          url.searchParams.set("code", code);
          window.location.replace(url.toString());
          return;
        } catch (handoffError) {
          console.error("Handoff failed", handoffError);
          setLocalError(`Login successful, but redirection failed: ${handoffError instanceof Error ? handoffError.message : String(handoffError)}`);
          // We don't clear loading state here because it's not managed by local state for submission, 
          // but we should ensure UI reflects error. The hook `loading` might be false by now.
        }
      } else {
        redirectToReturnTo(safeReturnTo, navigate);
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Login failed");
    }
  };

  return (
    <AuthLayout title="Welcome Back" subtitle="Sign in to your dashboard">
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

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 0, marginTop: 24 }}>

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

        <InputWrapper>
          <StyledInput
            id="password"
            type="password"
            value={password}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            placeholder=" "
            autoComplete="current-password"
            required
            disabled={loading}
          />
          <FloatingLabel htmlFor="password">Password</FloatingLabel>
          {localError && (
            <ErrorText><AlertIcon /> check credentials</ErrorText>
          )}
        </InputWrapper>

        <div style={{ marginBottom: 24, textAlign: 'right' }}>
          <Link
            to={buildLink("/forgot-password", returnTo)}
            style={{ color: '#58A6FF', textDecoration: 'none', fontSize: '0.875rem' }}
          >
            Forgot password?
          </Link>
        </div>

        <NeonButton type="submit" $variant="primary" disabled={!canSubmit} $loading={loading}>
          {loading ? "" : "Sign In"}
        </NeonButton>
      </form>

      <div style={{ marginTop: 24, display: "flex", justifyContent: "center" }}>
        <Text color="secondary" variant="caption">
          New to BHC Markets? <Link to={buildLink("/register", returnTo)} style={{ color: '#58A6FF', textDecoration: 'none' }}>Create Account</Link>
        </Text>
      </div>
    </AuthLayout>
  );
}
