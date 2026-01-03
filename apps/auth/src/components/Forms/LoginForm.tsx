import { useState, type FormEvent } from "react";
import styled from "styled-components";
import { Button, TextField } from "@repo/ui";
import { createAuthClient, type LoginRequest, ApiError } from "../../lib/api-client";
import { useAuth } from "../AuthContext";

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
  width: 100%;
`;

const ErrorMessage = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  background: rgba(255, 90, 95, 0.08);
  border: 1px solid rgba(255, 90, 95, 0.25);
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.status.danger};
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  line-height: ${({ theme }) => theme.typography.lineHeights.normal};
  display: flex;
  align-items: start;
  gap: ${({ theme }) => theme.spacing.sm};

  &::before {
    content: "⚠";
    font-size: 18px;
    flex-shrink: 0;
  }
`;

const SuccessMessage = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  background: rgba(50, 215, 75, 0.08);
  border: 1px solid rgba(50, 215, 75, 0.25);
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.status.success};
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  line-height: ${({ theme }) => theme.typography.lineHeights.normal};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};

  &::before {
    content: "✓";
    font-size: 18px;
    flex-shrink: 0;
  }
`;

const ForgotPasswordLink = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weightMedium};
  font-family: ${({ theme }) => theme.typography.fontFamily};
  cursor: pointer;
  padding: 0;
  text-align: right;
  transition: color 0.2s ease;
  margin-top: -${({ theme }) => theme.spacing.sm};

  &:hover {
    color: ${({ theme }) => theme.colors.primaryHover};
    text-decoration: underline;
  }
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin: ${({ theme }) => theme.spacing.sm} 0;
  color: ${({ theme }) => theme.colors.text.tertiary};
  font-size: ${({ theme }) => theme.typography.sizes.xs};

  &::before,
  &::after {
    content: "";
    flex: 1;
    height: 1px;
    background: ${({ theme }) => theme.colors.border.subtle};
  }
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

export interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToSignup?: () => void;
  onForgotPassword?: () => void;
}

export const LoginForm = ({ onSuccess, onSwitchToSignup, onForgotPassword }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { login } = useAuth();
  const authClient = createAuthClient();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const loginData: LoginRequest = {
        email: email.trim(),
        password,
      };

      const result = await authClient.login(loginData);
      login(result.user, result.tokens.accessToken, result.tokens.refreshToken);

      setSuccess(true);

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 500);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        switch (err.code) {
          case "INVALID_CREDENTIALS":
            setError("Invalid email or password. Please try again.");
            break;
          case "USER_NOT_ACTIVE":
            setError("Your account is not active. Please verify your email.");
            break;
          case "USER_SUSPENDED":
            setError("Your account has been suspended. Please contact support.");
            break;
          case "NETWORK_ERROR":
            setError("Network error. Please check your connection and try again.");
            break;
          default:
            setError("Login failed. Please try again.");
        }
      } else {
        setError(err instanceof Error ? err.message : "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>Login successful! Redirecting...</SuccessMessage>}

      <InputGroup>
        <TextField
          id="email"
          type="email"
          label="Email Address"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          autoComplete="email"
          autoFocus
        />

        <TextField
          id="password"
          type="password"
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          autoComplete="current-password"
        />

        <ForgotPasswordLink type="button" onClick={onForgotPassword} disabled={loading}>
          Forgot password?
        </ForgotPasswordLink>
      </InputGroup>

      <Button type="submit" disabled={loading} loading={loading} fullWidth size="lg">
        {loading ? "Signing in..." : "Sign In"}
      </Button>

      {onSwitchToSignup && (
        <>
          <Divider>or</Divider>
          <Button
            type="button"
            variant="outline"
            onClick={onSwitchToSignup}
            disabled={loading}
            fullWidth
            size="lg"
          >
            Create New Account
          </Button>
        </>
      )}
    </Form>
  );
};

export default LoginForm;
