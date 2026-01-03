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

export interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export const RegisterForm = ({ onSuccess, onSwitchToLogin }: RegisterFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      showError("Passwords do not match", "Validation Error");
      return;
    }

    if (password.length < 8) {
      showError("Password must be at least 8 characters long", "Validation Error");
      return;
    }

    setLoading(true);

    try {
      const result = await authApi.register({ email: email.trim(), password, issueSession: true });

      if ("tokens" in result) {
        login(result.user, result.tokens.accessToken, result.tokens.refreshToken);
      }

      showSuccess("Registration successful! Redirecting...", "Welcome");

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      {(error || success) && (
        <Banner>
		  {error && <Notification variant="danger" title="Sign-up failed" message={error} />}
		  {success && <Notification variant="success" title="Account created" message="Redirecting…" />}
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
        helpText="We'll never share your email with anyone else."
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
        helpText="Minimum 8 characters"
        showStrength
      />

      <PasswordInput
        id="confirmPassword"
        label="Confirm Password"
        placeholder="••••••••"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        disabled={loading}
      />

      <Button type="submit" disabled={loading} loading={loading} fullWidth>
        {loading ? "Creating account..." : "Sign Up"}
      </Button>

      {onSwitchToLogin && (
        <Button type="button" variant="ghost" onClick={onSwitchToLogin} disabled={loading} fullWidth>
          Already have an account? Log in
        </Button>
      )}
    </Form>
  );
};

export default RegisterForm;
