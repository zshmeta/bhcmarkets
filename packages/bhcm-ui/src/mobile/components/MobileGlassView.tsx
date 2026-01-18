import styled, { css } from 'styled-components';
import { COLORS, RADIUS } from '../theme';

/**
 * Mobile Glass View Component
 * 
 * Frosted glass effect container with configurable blur intensity.
 */

interface MobileGlassViewProps {
    children: React.ReactNode;
    intensity?: number;
    hasBorder?: boolean;
    className?: string;
    style?: React.CSSProperties;
}

const Container = styled.div<{ $intensity: number; $hasBorder: boolean }>`
  background-color: ${({ $intensity }) =>
        `rgba(22, 27, 34, ${Math.min($intensity / 100, 0.9)})`};
  backdrop-filter: blur(${({ $intensity }) => $intensity}px);
  -webkit-backdrop-filter: blur(${({ $intensity }) => $intensity}px);
  border-radius: ${RADIUS.l}px;
  overflow: hidden;
  position: relative;

  ${({ $hasBorder }) => $hasBorder && css`
    border: 1px solid ${COLORS.glassBorder};
  `}
`;

const Content = styled.div`
  position: relative;
  z-index: 1;
`;

export const MobileGlassView = ({
    children,
    intensity = 20,
    hasBorder = true,
    className,
    style,
}: MobileGlassViewProps) => (
    <Container
        $intensity={intensity}
        $hasBorder={hasBorder}
        className={className}
        style={style}
    >
        <Content>{children}</Content>
    </Container>
);

export { MobileGlassView as GlassView };
