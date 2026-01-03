import { Component, type ReactNode } from "react";
import { Button, Card, Notification } from "@repo/ui";

type ErrorBoundaryProps = {
	children: ReactNode;
};

type ErrorBoundaryState = {
	hasError: boolean;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	state: ErrorBoundaryState = { hasError: false };

	static getDerivedStateFromError(): ErrorBoundaryState {
		return { hasError: true };
	}

	componentDidCatch(error: unknown): void {
		// In production, wire this to your telemetry (Sentry, OpenTelemetry, etc.).
		// Keep it minimal here: no secrets, no PII.
		console.error("Unhandled UI error:", error);
	}

	render(): ReactNode {
		if (!this.state.hasError) return this.props.children;

		return (
			<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
				<div style={{ width: "100%", maxWidth: 520 }}>
					<Card header="Auth" variant="elevated" padding="lg">
						<Notification
							variant="danger"
							title="Something went wrong"
							message="Please refresh the page. If the issue persists, contact support."
						/>
						<div style={{ marginTop: 16, display: "flex", gap: 12, justifyContent: "flex-end" }}>
							<Button type="button" variant="secondary" onClick={() => location.reload()}>
								Reload
							</Button>
						</div>
					</Card>
				</div>
			</div>
		);
	}
}
