import { useState } from "react";
import styled from "styled-components";
import { Card, CardBody, CardHeader } from "@repo/ui";
import { LoginForm } from "./Forms/LoginForm";
import { RegisterForm } from "./Forms/RegisterForm";
import { PasswordResetForm } from "./Forms/PasswordResetForm";

const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.gradients.primarySoft};
  position: relative;
  overflow: hidden;

  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.spacing.md};
  }

  &::before {
    content: "";
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(
      circle at 30% 50%,
      rgba(63, 140, 255, 0.08) 0%,
      transparent 50%
    );
    animation: pulse 20s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(1) rotate(0deg);
      opacity: 0.6;
    }
    50% {
      transform: scale(1.1) rotate(180deg);
      opacity: 0.8;
    }
  }
`;

const AuthCard = styled(Card)`
  width: 100%;
  max-width: 480px;
  backdrop-filter: blur(24px);
  background: ${({ theme }) => theme.colors.backgrounds.surface};
  box-shadow: ${({ theme }) => theme.elevations.overlay},
    0 0 0 1px rgba(255, 255, 255, 0.05);
  border-radius: ${({ theme }) => theme.radii.lg};
  position: relative;
  z-index: 1;
  overflow: hidden;

  @media (max-width: 768px) {
    max-width: 100%;
  }

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.1),
      transparent
    );
  }
`;

const TabContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xxs};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  padding: ${({ theme }) => theme.spacing.xxs};
  background: ${({ theme }) => theme.colors.backgrounds.app};
  border-radius: ${({ theme }) => theme.radii.md};
  position: relative;
`;

const TabIndicator = styled.div<{ $activeIndex: number }>`
  position: absolute;
  top: ${({ theme }) => theme.spacing.xxs};
  bottom: ${({ theme }) => theme.spacing.xxs};
  left: ${({ $activeIndex }) => ($activeIndex === 0 ? "4px" : "calc(50% + 2px)")};
  width: calc(50% - 6px);
  background: ${({ theme }) => theme.gradients.primary};
  border-radius: ${({ theme }) => theme.radii.sm};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: ${({ theme }) => theme.shadows.soft};
`;

const Tab = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: transparent;
  border: none;
  color: ${({ $active, theme }) =>
    $active ? theme.colors.text.primary : theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.sizes.base};
  font-weight: ${({ theme }) => theme.typography.weightSemiBold};
  font-family: ${({ theme }) => theme.typography.fontFamily};
  cursor: pointer;
  transition: color 0.3s ease;
  position: relative;
  z-index: 1;
  border-radius: ${({ theme }) => theme.radii.sm};

  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const Logo = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const LogoIcon = styled.div`
  width: 64px;
  height: 64px;
  margin: 0 auto ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.gradients.primary};
  border-radius: ${({ theme }) => theme.radii.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: ${({ theme }) => theme.colors.text.onAccent};
  box-shadow: ${({ theme }) => theme.shadows.soft},
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  position: relative;

  &::after {
    content: "";
    position: absolute;
    inset: -2px;
    background: ${({ theme }) => theme.gradients.primary};
    border-radius: ${({ theme }) => theme.radii.lg};
    z-index: -1;
    opacity: 0.3;
    filter: blur(8px);
  }
`;

const LogoText = styled.h1`
  margin: 0;
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: ${({ theme }) => theme.colors.text.primary};
  letter-spacing: -0.02em;
  line-height: 1.2;
`;

const Subtitle = styled.p`
  margin: ${({ theme }) => theme.spacing.xs} 0 0;
  color: ${({ theme }) => theme.colors.text.tertiary};
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weightMedium};
  letter-spacing: 0.03em;
  text-transform: uppercase;
`;

const FooterText = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xl};
  padding-top: ${({ theme }) => theme.spacing.lg};
  border-top: 1px solid ${({ theme }) => theme.colors.border.subtle};
  text-align: center;
  color: ${({ theme }) => theme.colors.text.tertiary};
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  line-height: ${({ theme }) => theme.typography.lineHeights.relaxed};
`;

const SecurityBadge = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-top: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.text.muted};
  font-size: ${({ theme }) => theme.typography.sizes.xs};

  svg {
    width: 14px;
    height: 14px;
  }
`;

type AuthMode = "login" | "signup" | "reset-password";

export const AuthPage = () => {
  const [mode, setMode] = useState<AuthMode>("login");

  const handleAuthSuccess = () => {
    // Navigation handled by AuthContext
  };

  return (
    <PageContainer role="main" aria-label="Authentication">
      <AuthCard>
        <CardHeader>
          <Logo>
            <LogoIcon aria-hidden="true">B</LogoIcon>
            <LogoText>BHC Markets</LogoText>
            <Subtitle>Institutional Trading Platform</Subtitle>
          </Logo>
        </CardHeader>
        <CardBody>
          {mode !== "reset-password" && (
            <TabContainer role="tablist" aria-label="Authentication mode">
              <TabIndicator $activeIndex={mode === "login" ? 0 : 1} aria-hidden="true" />
              <Tab
                role="tab"
                aria-selected={mode === "login"}
                $active={mode === "login"}
                onClick={() => setMode("login")}
              >
                Sign In
              </Tab>
              <Tab
                role="tab"
                aria-selected={mode === "signup"}
                $active={mode === "signup"}
                onClick={() => setMode("signup")}
              >
                Create Account
              </Tab>
            </TabContainer>
          )}

          {mode === "login" ? (
            <LoginForm
              onSuccess={handleAuthSuccess}
              onSwitchToSignup={() => setMode("signup")}
              onForgotPassword={() => setMode("reset-password")}
            />
          ) : mode === "signup" ? (
            <RegisterForm
              onSuccess={handleAuthSuccess}
              onSwitchToLogin={() => setMode("login")}
            />
          ) : (
            <PasswordResetForm onBackToLogin={() => setMode("login")} />
          )}

          <FooterText>
            By continuing, you agree to BHC Markets' Terms of Service and Privacy
            Policy.
            <SecurityBadge aria-label="Security information">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Bank-grade 256-bit encryption
            </SecurityBadge>
          </FooterText>
        </CardBody>
      </AuthCard>
    </PageContainer>
  );
};

export default AuthPage;
