import { forwardRef, type HTMLAttributes } from "react";
import styled, { keyframes } from "styled-components";

type LoaderVariant = "spinner" | "dots" | "bars" | "pulse";
type LoaderSize = "sm" | "md" | "lg";

export interface LoaderProps extends HTMLAttributes<HTMLDivElement> {
	variant?: LoaderVariant;
	size?: LoaderSize;
	color?: string;
}

const spin = keyframes`
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
`;

const bounce = keyframes`
	0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
	40% { transform: scale(1); opacity: 1; }
`;

const pulse = keyframes`
	0%, 100% { opacity: 1; }
	50% { opacity: 0.3; }
`;

const LoaderContainer = styled.div`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 4px;
`;

const Spinner = styled.div<{ $size: number; $color: string }>`
	width: \${({ $size }) => $size}px;
	height: \${({ $size }) => $size}px;
	border: \${({ $size }) => Math.max(2, $size / 8)}px solid rgba(255, 255, 255, 0.2);
	border-top-color: \${({ $color }) => $color};
	border-radius: 50%;
	animation: \${spin} 0.8s linear infinite;
`;

const Dot = styled.div<{ $size: number; $color: string; $delay: number }>`
	width: \${({ $size }) => $size / 3}px;
	height: \${({ $size }) => $size / 3}px;
	background: \${({ $color }) => $color};
	border-radius: 50%;
	animation: \${bounce} 1.4s ease-in-out \${({ $delay }) => $delay}s infinite;
`;

const Bar = styled.div<{ $size: number; $color: string; $delay: number }>`
	width: \${({ $size }) => $size / 5}px;
	height: \${({ $size }) => $size}px;
	background: \${({ $color }) => $color};
	border-radius: 2px;
	animation: \${pulse} 1s ease-in-out \${({ $delay }) => $delay}s infinite;
`;

const sizes = {
	sm: 20,
	md: 32,
	lg: 48,
};

export const Loader = forwardRef<HTMLDivElement, LoaderProps>(
	({ variant = "spinner", size = "md", color, style, ...props }, ref) => {
		const pixelSize = sizes[size];
		const loaderColor = color || "#3F8CFF";

		const renderLoader = () => {
			switch (variant) {
				case "dots":
					return (
						<>
							<Dot $size={pixelSize} $color={loaderColor} $delay={0} />
							<Dot $size={pixelSize} $color={loaderColor} $delay={0.15} />
							<Dot $size={pixelSize} $color={loaderColor} $delay={0.3} />
						</>
					);
				case "bars":
					return (
						<>
							<Bar $size={pixelSize} $color={loaderColor} $delay={0} />
							<Bar $size={pixelSize} $color={loaderColor} $delay={0.15} />
							<Bar $size={pixelSize} $color={loaderColor} $delay={0.3} />
						</>
					);
				case "pulse":
					return <Spinner $size={pixelSize} $color={loaderColor} style={{ animation: `${pulse} 1.5s ease-in-out infinite
						` }} />; 	default:
					return <Spinner $size={pixelSize} $color={loaderColor} />;
			}
		};

		return (
			<LoaderContainer ref={ref} style={style} {...props}>
				{renderLoader()}
			</LoaderContainer>
		);
	}
);

Loader.displayName = "Loader";

export default Loader;
