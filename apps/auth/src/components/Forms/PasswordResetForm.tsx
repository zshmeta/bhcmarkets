import { useState, type FormEvent } from "react";
import styled from "styled-components";
import { Button, TextField } from "@repo/ui";
import { createAuthClient, ApiError } from "../../lib/api-client";

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
  align-items: start;
  gap: ${({ theme }) => theme.spacing.sm};

  &::before {
    content: "✓";
    font-size: 18px;
    flex-shrink: 0;
  }
`;

const InfoMessage = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  background: rgba(63, 140, 255, 0.08);
  border: 1px solid rgba(63, 140, 255, 0.25);
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  line-height: ${({ theme }) => theme.typography.lineHeights.normal};
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weightMedium};
  font-family: ${({ theme }) => theme.typography.fontFamily};
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  transition: color 0.2s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
  }

  &::before {
    content: "←";
    font-size: 18px;
  }
`;

export interface PasswordResetFormProps {
  onBackToLogin?: () => void;
}

export const PasswordResetForm = ({ onBackToLogin }: PasswordResetFormProps) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const authClient = createAuthClient();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      await authClient.requestPasswordReset({ email: email.trim() });
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        switch (err.code) {
          case "NETWORK_ERROR":
            setError("Network error. Please check your connection and try again.");
            break;
          default:
            // For security, don't reveal if email exists or not
            setSuccess(true);
        }
      } else {
        setError(err instanceof Error ? err.message : "Failed to send reset email.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      {onBackToLogin && (
        <BackButton type="button" onClick={onBackToLogin} disabled={loading}>
          Back to Sign In
        </BackButton>
      )}

      <InfoMessage>
        Enter your email address and we'll send you a link to reset your password.
      </InfoMessage>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && (
        <SuccessMessage>
          If an account exists with that email, we've sent password reset instructions.
          Please check your inbox and spam folder.
        </SuccessMessage>
      )}

      <TextField
        id="email"
        type="email"
        label="Email Address"
        placeholder="you@company.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={loading || success}
        autoComplete="email"
        autoFocus
      />

      <Button type="submit" disabled={loading || success} loading={loading} fullWidth size="lg">
        {loading ? "Sending..." : success ? "Email Sent" : "Send Reset Link"}
      </Button>

      {success && onBackToLogin && (
        <Button
          type="button"
          variant="outline"
          onClick={onBackToLogin}
          fullWidth
          size="lg"
        >
          Return to Sign In
        </Button>
      )}
    </Form>
  );
};

export default PasswordResetForm;
