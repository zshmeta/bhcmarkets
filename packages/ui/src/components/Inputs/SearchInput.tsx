import { forwardRef, useState, useCallback, useEffect, type InputHTMLAttributes } from "react";
import styled from "styled-components";

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
	label?: string;
	onSearch?: (value: string) => void;
	debounceMs?: number;
	showClear?: boolean;
}

const InputWrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${({ theme }) => theme.spacing.xs};
	width: 100%;
`;

const Label = styled.label`
	font-family: ${({ theme }) => theme.typography.fontFamily};
	font-size: ${({ theme }) => theme.typography.sizes.sm};
	font-weight: ${({ theme }) => theme.typography.weightMedium};
	color: ${({ theme }) => theme.colors.text.secondary};
	text-transform: uppercase;
	letter-spacing: 0.05em;
`;

const InputContainer = styled.div`
	position: relative;
	display: flex;
	align-items: center;
`;

const SearchIcon = styled.span`
	position: absolute;
	left: ${({ theme }) => theme.spacing.md};
	display: flex;
	align-items: center;
	pointer-events: none;
	color: ${({ theme }) => theme.colors.text.tertiary};
	font-size: 18px;
`;

const ClearButton = styled.button`
	position: absolute;
	right: ${({ theme }) => theme.spacing.md};
	display: flex;
	align-items: center;
	justify-content: center;
	width: 24px;
	height: 24px;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.1);
	border: none;
	cursor: pointer;
	color: ${({ theme }) => theme.colors.text.tertiary};
	transition: all 0.2s ease;

	&:hover {
		background: rgba(255, 255, 255, 0.2);
		color: ${({ theme }) => theme.colors.text.primary};
	}
`;

const StyledInput = styled.input`
	width: 100%;
	height: 44px;
	padding: 0 ${({ theme }) => theme.spacing.xxxl};
	font-family: ${({ theme }) => theme.typography.fontFamily};
	font-size: ${({ theme }) => theme.typography.sizes.base};
	color: ${({ theme }) => theme.colors.text.primary};
	background: ${({ theme }) => theme.colors.backgrounds.surface};
	border: 2px solid ${({ theme }) => theme.colors.border.default};
	border-radius: ${({ theme }) => theme.radii.pill};
	transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	outline: none;

	&::placeholder {
		color: ${({ theme }) => theme.colors.text.muted};
	}

	&:hover {
		border-color: ${({ theme }) => theme.colors.border.accent};
	}

	&:focus {
		border-color: ${({ theme }) => theme.colors.primary};
		box-shadow: 0 0 0 4px ${({ theme }) => theme.colors.focus};
	}
`;

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
	({ label, onSearch, debounceMs = 300, showClear = true, value, onChange, ...props }, ref) => {
		const [localValue, setLocalValue] = useState("");
		const currentValue = value !== undefined ? String(value) : localValue;

		const debouncedSearch = useCallback(
			(searchValue: string) => {
				const timeout = setTimeout(() => {
					onSearch?.(searchValue);
				}, debounceMs);
				return () => clearTimeout(timeout);
			},
			[onSearch, debounceMs]
		);

		useEffect(() => {
			if (currentValue) {
				return debouncedSearch(currentValue);
			}
		}, [currentValue, debouncedSearch]);

		const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			setLocalValue(e.target.value);
			onChange?.(e);
		};

		const handleClear = () => {
			setLocalValue("");
			onSearch?.("");
		};

		return (
			<InputWrapper>
				{label && <Label>{label}</Label>}
				<InputContainer>
					<SearchIcon>🔍</SearchIcon>
					<StyledInput
						ref={ref}
						type="search"
						value={currentValue}
						onChange={handleChange}
						placeholder="Search..."
						{...props}
					/>
					{showClear && currentValue && (
						<ClearButton onClick={handleClear} type="button" aria-label="Clear search">
							×
						</ClearButton>
					)}
				</InputContainer>
			</InputWrapper>
		);
	}
);

SearchInput.displayName = "SearchInput";

export default SearchInput;
