import type React from "react";
import styled from "styled-components";

export type FooterColumnItem = {
    title: React.ReactNode;
    url?: string;
    openExternal?: boolean;
    icon?: React.ReactNode;
    description?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    LinkComponent?: React.ElementType<any>;
};

export type FooterColumn = {
    title?: React.ReactNode;
    icon?: React.ReactNode;
    items?: FooterColumnItem[];
    className?: string;
    style?: React.CSSProperties;
};

export type FooterProps = React.HTMLAttributes<HTMLElement> & {
    columns?: FooterColumn[];
    bottom?: React.ReactNode;
    maxColumnsPerRow?: number;
    columnLayout?: React.CSSProperties["justifyContent"];
    backgroundColor?: string;
};

const FooterRoot = styled.footer<{ $backgroundColor?: string }>`
    width: 100%;
    background: ${({ theme, $backgroundColor }) =>
        $backgroundColor ?? theme.colors.backgrounds.surface};
    border-top: 1px solid ${({ theme }) => theme.colors.border.subtle};
    color: ${({ theme }) => theme.colors.text.primary};
`;

const Container = styled.div`
    max-width: ${({ theme }) => theme.layout.contentMaxWidth};
    margin: 0 auto;
    padding: ${({ theme }) => `${theme.spacing.xl} ${theme.spacing.xl}`};
`;

const Columns = styled.section<{ $justify?: React.CSSProperties["justifyContent"] }>`
    display: grid;
    gap: ${({ theme }) => theme.spacing.xl};
    align-items: start;
    justify-content: ${({ $justify }) => $justify ?? "space-between"};
    grid-template-columns: repeat(var(--footer-cols, auto-fit), minmax(220px, 1fr));
`;

const ColumnRoot = styled.div`
    min-width: 0;
`;

const ColumnTitle = styled.h2`
    margin: 0 0 ${({ theme }) => theme.spacing.sm} 0;
    font-family: ${({ theme }) => theme.typography.headingsFamily};
    font-size: ${({ theme }) => theme.typography.sizes.md};
    font-weight: ${({ theme }) => theme.typography.weightSemiBold};
    color: ${({ theme }) => theme.colors.text.primary};
    display: inline-flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing.xs};
`;

const Items = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing.xs};
`;

const ItemRow = styled.div`
    display: flex;
    align-items: baseline;
    gap: ${({ theme }) => theme.spacing.xs};
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: ${({ theme }) => theme.typography.sizes.sm};
    line-height: ${({ theme }) => theme.typography.lineHeights.normal};
`;

const ItemLink = styled.a`
    color: ${({ theme }) => theme.colors.text.primary};
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing.xs};
    transition: ${({ theme }) => theme.transitions.fast};

    &:hover {
        color: ${({ theme }) => theme.colors.primary};
        text-decoration: underline;
    }

    &:focus-visible {
        outline: 2px solid ${({ theme }) => theme.colors.focus};
        outline-offset: 2px;
        border-radius: ${({ theme }) => theme.radii.sm};
    }
`;

const Separator = styled.span`
    opacity: ${({ theme }) => theme.opacity.strong};
`;

const Description = styled.span`
    color: ${({ theme }) => theme.colors.text.muted};
`;

const BottomBar = styled.section`
    border-top: 1px solid ${({ theme }) => theme.colors.border.subtle};
    background: ${({ theme }) => theme.colors.backgrounds.soft};
`;

const BottomInner = styled.div`
    max-width: ${({ theme }) => theme.layout.contentMaxWidth};
    margin: 0 auto;
    padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.xl}`};
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: ${({ theme }) => theme.typography.sizes.sm};
`;

const isPositiveInt = (value: unknown): value is number =>
    typeof value === "number" && Number.isFinite(value) && value > 0;

const getItemKey = (item: FooterColumnItem, fallbackIndex: number) => {
    if (typeof item.url === "string" && item.url.length > 0) return item.url;
    if (typeof item.title === "string" && item.title.length > 0) return item.title;
    return `item-${fallbackIndex}`;
};

const Column: React.FC<{ column: FooterColumn }> = ({ column }) => {
    const { title, icon, items = [], className, style } = column;

    if (!title && !icon && items.length === 0) {
        return null;
    }

    return (
        <ColumnRoot className={className} style={style}>
            {(title || icon) && (
                <ColumnTitle>
                    {icon}
                    {title}
                </ColumnTitle>
            )}
            {items.length > 0 && (
                <Items>
                    {items.map((item, index) => {
                        const LinkComponent = item.LinkComponent ?? "a";
                        const isIntrinsic = typeof LinkComponent === "string";

                        const linkProps = isIntrinsic
                            ? {
                                    href: item.url,
                                    target: item.openExternal ? "_blank" : undefined,
                                    rel: item.openExternal ? "noopener noreferrer" : undefined,
                                }
                            : {
                                    to: item.url,
                                };

                        const content = (
                            <>
                                {item.icon}
                                {item.title}
                            </>
                        );

                        return (
                            <ItemRow key={getItemKey(item, index)} className={item.className} style={item.style}>
                                <ItemLink as={LinkComponent as any} {...(linkProps as any)}>
                                    {content}
                                </ItemLink>
                                {item.description && (
                                    <>
                                        <Separator>-</Separator>
                                        <Description>{item.description}</Description>
                                    </>
                                )}
                            </ItemRow>
                        );
                    })}
                </Items>
            )}
        </ColumnRoot>
    );
};

export const Footer: React.FC<FooterProps> = ({
    columns,
    bottom,
    maxColumnsPerRow,
    columnLayout,
    backgroundColor,
    children,
    ...rest
}) => {
    const hasColumns = Array.isArray(columns) && columns.length > 0;
    const cols = isPositiveInt(maxColumnsPerRow) ? Math.floor(maxColumnsPerRow) : undefined;

    return (
        <FooterRoot {...rest} $backgroundColor={backgroundColor}>
            <Container>
                {hasColumns ? (
                    <Columns
                        $justify={columnLayout}
                        style={cols ? ({ ["--footer-cols" as any]: cols } as React.CSSProperties) : undefined}
                    >
                        {columns!.map((column, index) => (
                            <Column key={index} column={column} />
                        ))}
                    </Columns>
                ) : (
                    children
                )}
            </Container>
            {bottom && (
                <BottomBar>
                    <BottomInner>{bottom}</BottomInner>
                </BottomBar>
            )}
        </FooterRoot>
    );
};

Footer.displayName = "Footer";

export default Footer;
