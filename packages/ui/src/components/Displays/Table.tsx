import { forwardRef, type HTMLAttributes, type ThHTMLAttributes, type TdHTMLAttributes } from "react";
import styled, { css } from "styled-components";

export interface TableProps extends HTMLAttributes<HTMLTableElement> {
	hoverable?: boolean;
	striped?: boolean;
	borderless?: boolean;
	compact?: boolean;
}

const StyledTable = styled.table<{
	$hoverable: boolean;
	$striped: boolean;
	$borderless: boolean;
	$compact: boolean;
}>`
	width: 100%;
	border-collapse: separate;
	border-spacing: 0;
	font-family: ${({ theme }) => theme.typography.fontFamily};
	font-size: ${({ theme }) => theme.typography.sizes.sm};
	border-radius: ${({ theme }) => theme.radii.md};
	overflow: hidden;
	border: ${({ theme, $borderless }) =>
		$borderless ? "none" : `1px solid ${theme.colors.border.subtle}`};

	tr {
		transition: background-color 0.15s ease;

		${({ $striped }) =>
			$striped &&
			css`
				&:nth-child(even) {
					background: rgba(255, 255, 255, 0.02);
				}
			`}

		${({ $hoverable }) =>
			$hoverable &&
			css`
				&:hover {
					background: rgba(255, 255, 255, 0.06);
					cursor: pointer;
				}
			`}
	}
`;

const Thead = styled.thead`
	background: ${({ theme }) => theme.colors.backgrounds.elevated};
	position: sticky;
	top: 0;
	z-index: 1;

	&::after {
		content: "";
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: linear-gradient(
			90deg,
			transparent,
			${({ theme }) => theme.colors.border.accent},
			transparent
		);
	}
`;

const Th = styled.th<ThHTMLAttributes<HTMLTableCellElement> & { sortable?: boolean }>`
	padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.lg}`};
	text-align: left;
	font-weight: ${({ theme }) => theme.typography.weightBold};
	color: ${({ theme }) => theme.colors.text.primary};
	text-transform: uppercase;
	letter-spacing: 0.05em;
	font-size: ${({ theme }) => theme.typography.sizes.xs};
	white-space: nowrap;
	user-select: none;
	position: relative;

	${({ sortable }) =>
		sortable &&
		css`
			cursor: pointer;
			&:hover {
				background: rgba(255, 255, 255, 0.05);
			}
		`}
`;

const Td = styled.td<TdHTMLAttributes<HTMLTableCellElement>>`
	padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.lg}`};
	border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};
	color: ${({ theme }) => theme.colors.text.secondary};
	font-size: ${({ theme }) => theme.typography.sizes.sm};
	line-height: ${({ theme }) => theme.typography.lineHeights.normal};

	&:first-child {
		font-weight: ${({ theme }) => theme.typography.weightMedium};
		color: ${({ theme }) => theme.colors.text.primary};
	}
`;

const Tbody = styled.tbody`
	tr:last-child td {
		border-bottom: none;
	}
`;

const Tfoot = styled.tfoot`
	background: ${({ theme }) => theme.colors.backgrounds.elevated};
	border-top: 2px solid ${({ theme }) => theme.colors.border.default};
	font-weight: ${({ theme }) => theme.typography.weightSemiBold};
`;

const Tr = styled.tr``;

export const Table = Object.assign(
	forwardRef<HTMLTableElement, TableProps>(
		(
			{
				hoverable = true,
				striped = false,
				borderless = false,
				compact = false,
				children,
				...props
			},
			ref
		) => (
			<StyledTable
				ref={ref}
				$hoverable={hoverable}
				$striped={striped}
				$borderless={borderless}
				$compact={compact}
				{...props}
			>
				{children}
			</StyledTable>
		)
	),
	{
		Head: Thead,
		Body: Tbody,
		Foot: Tfoot,
		Row: Tr,
		Header: Th,
		Cell: Td,
		displayName: "Table",
	}
);

export default Table;