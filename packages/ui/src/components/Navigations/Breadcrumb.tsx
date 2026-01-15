import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import styled from "styled-components";

export interface BreadcrumbItem {
	id: string;
	label: ReactNode;
	href?: string;
	onClick?: () => void;
}

export interface BreadcrumbProps extends HTMLAttributes<HTMLElement> {
	items: BreadcrumbItem[];
	separator?: ReactNode;
}

const BreadcrumbNav = styled.nav`
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: ${({ theme }) => theme.spacing.xs};
	font-size: ${({ theme }) => theme.typography.sizes.sm};
`;

const BreadcrumbLink = styled.a<{ $isLast: boolean }>`
	color: ${({ theme, $isLast }) =>
		$isLast ? theme.colors.text.primary : theme.colors.text.tertiary};
	text-decoration: none;
	font-weight: ${({ theme, $isLast }) =>
		$isLast ? theme.typography.weightSemiBold : theme.typography.weightRegular};
	transition: color 0.2s ease;
	cursor: ${({ $isLast }) => ($isLast ? "default" : "pointer")};

	&:hover {
		color: ${({ theme, $isLast }) =>
			$isLast ? theme.colors.text.primary : theme.colors.primaryHover};
	}
`;

const Separator = styled.span`
	color: ${({ theme }) => theme.colors.text.muted};
	user-select: none;
`;

export const Breadcrumb = forwardRef<HTMLElement, BreadcrumbProps>(
	({ items, separator = "/", ...props }, ref) => (
		<BreadcrumbNav ref={ref} aria-label="Breadcrumb" {...props}>
			{items.map((item, index) => {
				const isLast = index === items.length - 1;
				return (
					<div key={item.id} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
						<BreadcrumbLink
							$isLast={isLast}
							href={item.href}
							onClick={item.onClick}
							aria-current={isLast ? "page" : undefined}
						>
							{item.label}
						</BreadcrumbLink>
						{!isLast && <Separator>{separator}</Separator>}
					</div>
				);
			})}
		</BreadcrumbNav>
	)
);

Breadcrumb.displayName = "Breadcrumb";

export default Breadcrumb;
