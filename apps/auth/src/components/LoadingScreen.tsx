import styled, { keyframes } from "styled-components";

const shimmer = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`;

export const LoadingContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.backgrounds.app};
`;

export const LoadingSpinner = styled.div`
  width: 48px;
  height: 48px;
  border: 4px solid ${({ theme }) => theme.colors.border.subtle};
  border-top-color: ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

export const LoadingText = styled.p`
  margin-top: ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weightMedium};
  text-align: center;
`;

export const SkeletonBox = styled.div<{
  $width?: string;
  $height?: string;
  $borderRadius?: string;
}>`
  width: ${({ $width }) => $width || "100%"};
  height: ${({ $height }) => $height || "20px"};
  border-radius: ${({ $borderRadius, theme }) => $borderRadius || theme.radii.md};
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.colors.backgrounds.surface} 0%,
    ${({ theme }) => theme.colors.backgrounds.elevated} 50%,
    ${({ theme }) => theme.colors.backgrounds.surface} 100%
  );
  background-size: 1000px 100%;
  animation: ${shimmer} 2s infinite;
`;

export const SkeletonText = styled(SkeletonBox)`
  height: 16px;
  border-radius: 4px;
`;

export const SkeletonCircle = styled(SkeletonBox)`
  border-radius: 50%;
`;

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = "Loading..." }) => {
  return (
    <LoadingContainer>
      <div>
        <LoadingSpinner />
        <LoadingText>{message}</LoadingText>
      </div>
    </LoadingContainer>
  );
};

export default LoadingScreen;
