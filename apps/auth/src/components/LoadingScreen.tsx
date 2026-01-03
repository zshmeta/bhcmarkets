import { Loader } from "@repo/ui";
import styled from "styled-components";

export const LoadingContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.backgrounds.app};
  gap: ${({ theme }) => theme.spacing.lg};
`;

export const LoadingText = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weightMedium};
  text-align: center;
`;

>>>>>>> 644203f (Add password reset, loading states, success page and accessibility improvements)
interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = "Loading..." }) => {
  return (
    <LoadingContainer>
      <Loader variant="spinner" size="lg" />
      <LoadingText>{message}</LoadingText>
    </LoadingContainer>
  );
};

export default LoadingScreen;
