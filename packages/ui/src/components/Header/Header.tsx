import styled from "styled-components";

export type HeaderProps = React.HTMLAttributes<HTMLElement> & {
    title?: React.ReactNode;
    left?: React.ReactNode;
    right?: React.ReactNode;
    backgroundColor?: string;
};

export const HeaderContainer = styled.header<{ $backgroundColor?: string }>`
    width: 100%;
    padding: ${({ theme }) => `${theme.spacing.lg} ${theme.spacing.xl}`};
    background: ${({ theme, $backgroundColor }) =>
        $backgroundColor ?? theme.colors.backgrounds.surface};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};
`;

const Inner = styled.div`
    max-width: ${({ theme }) => theme.layout.contentMaxWidth};
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${({ theme }) => theme.spacing.lg};
`;

const Slot = styled.div`
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing.sm};
    min-width: 0;
`;

export const Title = styled.h1`
    margin: 0;
    font-size: ${({ theme }) => theme.typography.sizes.xl};
    color: ${({ theme }) => theme.colors.text.primary};
    font-family: ${({ theme }) => theme.typography.fontFamily};
    font-weight: ${({ theme }) => theme.typography.weightBold};
    line-height: ${({ theme }) => theme.typography.lineHeights.snug};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

export const Header: React.FC<HeaderProps> = ({
    title = "BHCM - Brokerage House Capital Markets",
    left,
    right,
    backgroundColor,
    ...rest
}) => {
    return (
        <HeaderContainer {...rest} $backgroundColor={backgroundColor}>
            <Inner>
                <Slot>
                    {left}
                    {title && <Title>{title}</Title>}
                </Slot>
                {right && <Slot>{right}</Slot>}
            </Inner>
        </HeaderContainer>
    );
};

Header.displayName = "Header";

export default Header;
