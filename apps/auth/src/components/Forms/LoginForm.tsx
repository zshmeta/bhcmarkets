import { useState, type FormEvent } from "react";
import styled from "styled-components";
import { Button, EmailInput, Notification, PasswordInput } from "@repo/ui";
import { authApi } from "../../lib/authApi";
import { useAuth } from "../AuthContext";
import { useToast } from "../ToastContext";

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  width: 100%;
`;

const Banner = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

export interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToSignup?: () => void;
}

export const LoginForm = ({ onSuccess, onSwitchToSignup }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  // Keep the error string generic; avoid account enumeration.

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await authApi.login({ email: email.trim(), password });
      login(result.user, result.tokens.accessToken, result.tokens.refreshToken);

      showSuccess("Login successful! Redirecting...", "Welcome back");

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      {(error || success) && (
        <Banner>
		  {error && <Notification variant="danger" title="Sign-in failed" message={error} />}
		  {success && <Notification variant="success" title="Signed in" message="Redirecting…" />}
        </Banner>
      )}

      <EmailInput
        id="email"
        label="Email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={loading}
        showValidation
      />

      <PasswordInput
        id="password"
        label="Password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        disabled={loading}
      />

      <Button type="submit" disabled={loading} loading={loading} fullWidth>
        {loading ? "Logging in..." : "Log In"}
      </Button>

      {onSwitchToSignup && (
        <Button type="button" variant="ghost" onClick={onSwitchToSignup} disabled={loading} fullWidth>
          Don't have an account? Sign up
        </Button>
      )}
    </Form>
  );
};

export default LoginForm;
