import styled from "styled-components";
import { Button } from "@repo/ui";
import { useAuth } from "./AuthContext";

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.gradients.primarySoft};
`;

const Card = styled.div`
  width: 100%;
  max-width: 560px;
  padding: ${({ theme }) => theme.spacing.xxxl};
  background: ${({ theme }) => theme.colors.backgrounds.surface};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.elevations.overlay};
  text-align: center;
`;

const IconWrapper = styled.div`
  width: 80px;
  height: 80px;
  margin: 0 auto ${({ theme }) => theme.spacing.xl};
  background: ${({ theme }) => theme.gradients.primary};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    inset: -4px;
    background: ${({ theme }) => theme.gradients.primary};
    border-radius: 50%;
    z-index: -1;
    opacity: 0.2;
    filter: blur(12px);
  }
`;

const CheckIcon = styled.svg`
  width: 40px;
  height: 40px;
  color: ${({ theme }) => theme.colors.text.onAccent};
`;

const Title = styled.h1`
  margin: 0 0 ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.typography.sizes.xxl};
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: 1.2;
`;

const Message = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacing.lg};
  font-size: ${({ theme }) => theme.typography.sizes.base};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeights.relaxed};
`;

const UserInfo = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  background: ${({ theme }) => theme.colors.backgrounds.elevated};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border.subtle};
`;

const UserEmail = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  color: ${({ theme }) => theme.colors.text.tertiary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const UserRole = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.md};
  font-weight: ${({ theme }) => theme.typography.weightSemiBold};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

export const SuccessPage = () => {
  const { user, logout } = useAuth();

  const handleContinue = () => {
    // In a real app, this would navigate to the main application
    window.location.href = "/app";
  };

  return (
    <Container>
      <Card>
        <IconWrapper>
          <CheckIcon
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6L9 17l-5-5" />
          </CheckIcon>
        </IconWrapper>

        <Title>Welcome to BHC Markets</Title>
        <Message>
          You've successfully signed in. You can now access all features of the
          institutional trading platform.
        </Message>

        {user && (
          <UserInfo>
            <UserEmail>Signed in as</UserEmail>
            <UserRole>{user.email}</UserRole>
          </UserInfo>
        )}

        <ButtonGroup>
          <Button onClick={handleContinue} size="lg" fullWidth>
            Continue to Platform
          </Button>
          <Button onClick={logout} variant="outline" size="lg" fullWidth>
            Sign Out
          </Button>
        </ButtonGroup>
      </Card>
    </Container>
  );
};

export default SuccessPage;
