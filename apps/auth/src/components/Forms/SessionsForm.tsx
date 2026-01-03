import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Button, Card, Loader, Notification, Table, Text } from "@repo/ui";
import { authApi } from "../../auth/auth.api";
import { useAuth } from "../../auth/auth.hooks";
import { AppShell } from "../layouts/AppShell";

const Actions = styled.div`
	display: flex;
	gap: 12px;
	margin-bottom: 16px;
	flex-wrap: wrap;
 	align-items: center;
`;

const HeaderRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: ${({ theme }) => theme.spacing.md};
	align-items: center;
	justify-content: space-between;
	margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const SmallMeta = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${({ theme }) => theme.spacing.xxxs};
`;

function formatSessionId(id: string): string {
	if (id.length <= 14) return id;
	return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

// This page provides basic session visibility and revocation.
// It is security-sensitive: keep messages generic and avoid leaking token details.
export default function SessionsPage() {
	const { user, session, logout, refreshToken } = useAuth();

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [sessions, setSessions] = useState<
		Array<{ id: string; createdAt: string; lastSeenAt: string; expiresAt: string }>
	>([]);

	const currentUserId = user?.id;

	const load = async () => {
		if (!currentUserId) return;
		setError(null);
		setLoading(true);

		try {
			// Refresh once before listing sessions so access token is up-to-date.
			// This reduces “mysterious 401s” on fresh page loads.
			await refreshToken();

			const result = await authApi.getSessions(currentUserId);
			setSessions(
				result.map((s) => ({
					id: s.id,
					createdAt: s.createdAt,
					lastSeenAt: s.lastSeenAt,
					expiresAt: s.expiresAt,
				})),
			);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Failed to load sessions");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentUserId]);

	const rows = useMemo(
		() =>
			sessions.map((s) => ({
				...s,
				isCurrent: Boolean(session?.id && session.id === s.id),
			})),
		[sessions, session?.id],
	);

	const revoke = async (sessionId: string) => {
		if (!user) return;
		setError(null);

		try {
			await authApi.logout({ sessionId, userId: user.id, reason: "manual" });

			// If the user revoked their current session, treat it as a logout.
			if (session?.id === sessionId) {
				logout();
				return;
			}

			await load();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Failed to revoke session");
		}
	};

	const revokeAll = async () => {
		if (!user) return;
		setError(null);

		try {
			await authApi.logoutAll({ userId: user.id, excludeSessionId: session?.id, reason: "logout_all" });
			await load();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Failed to revoke sessions");
		}
	};

	return (
		<AppShell>
			<Card header="Active sessions" variant="elevated" padding="lg">
				<HeaderRow>
					<SmallMeta>
						<Text variant="label" color="tertiary">
							Signed in as
						</Text>
						<Text>{user?.email ?? "—"}</Text>
					</SmallMeta>

					<Button type="button" variant="ghost" onClick={() => void logout()}>
						Sign out
					</Button>
				</HeaderRow>

				{error && <Notification variant="danger" title="Unable to load sessions" message={error} />}

					{loading ? (
						<Loader />
					) : (
						<>
							<Actions>
								<Button type="button" variant="secondary" onClick={() => void load()}>
									Refresh
								</Button>
								<Button type="button" variant="danger" onClick={() => void revokeAll()}>
									Log out other sessions
								</Button>
							</Actions>

							{rows.length === 0 ? (
								<Notification
									variant="info"
									title="No active sessions"
									message="When you sign in on other devices, they will appear here."
								/>
							) : (
								<Table striped hoverable={false}>
									<Table.Head>
										<Table.Row>
											<Table.Header>Session</Table.Header>
											<Table.Header>Created</Table.Header>
											<Table.Header>Last seen</Table.Header>
											<Table.Header>Expires</Table.Header>
											<Table.Header aria-label="Actions" />
										</Table.Row>
									</Table.Head>

									<Table.Body>
										{rows.map((row) => (
											<Table.Row key={row.id}>
												<Table.Cell title={row.id}>
													<Text as="span" variant="code">
														{formatSessionId(row.id)}
													</Text>
													{row.isCurrent ? (
														<Text as="span" variant="caption" color="tertiary" style={{ marginLeft: 10 }}>
															(current)
														</Text>
													) : null}
												</Table.Cell>
												<Table.Cell>{row.createdAt}</Table.Cell>
												<Table.Cell>{row.lastSeenAt}</Table.Cell>
												<Table.Cell>{row.expiresAt}</Table.Cell>
												<Table.Cell>
													<div style={{ display: "flex", justifyContent: "flex-end" }}>
														<Button
															type="button"
															variant={row.isCurrent ? "outline" : "ghost"}
															onClick={() => void revoke(row.id)}
														>
															{row.isCurrent ? "Log out" : "Revoke"}
														</Button>
													</div>
												</Table.Cell>
											</Table.Row>
										))}
									</Table.Body>
								</Table>
							)}
						</>
					)}
			</Card>
		</AppShell>
	);
}
