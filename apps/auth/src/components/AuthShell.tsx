import { type ReactNode } from "react";
import styled from "styled-components";
import { Card, Text } from "@repo/ui";
import { Header } from "@/Header";


const Viewport = styled.div`
	min-height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: ${({ theme }) => theme.spacing.xl};
`;

const Stack = styled.div`
	width: 100%;
	max-width: 420px;
	display: flex;
	flex-direction: column;
	gap: ${({ theme }) => theme.spacing.md};
`;


export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
	return (
		<Viewport>
			<Stack>
				<Header>
					<Text variant="overline" color="tertiary" align="center">
						BHC Markets
					</Text>
					<Text variant="h2" gradient align="center">
						{title}
					</Text>
					{subtitle ? (
						<Text color="secondary" align="center">
							{subtitle}
						</Text>
					) : null}
				</Header>

				<Card variant="elevated" padding="lg">
					{children}
				</Card>
			</Stack>
		</Viewport>
	);
}
