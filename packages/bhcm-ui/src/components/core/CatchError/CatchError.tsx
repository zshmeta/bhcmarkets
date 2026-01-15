import { Component, ReactNode } from 'react';
import { Icons } from '../Icons';
import {
    Container,
    Content,
    ErrorIcons,
    Title,
    Message,
    Actions,
    ReloadButton,
    Details,
    StackTrace,
} from './CatchError.styles';

/* ═══════════════════════════════════════════════════════════
 * ERROR BOUNDARY
 * ═══════════════════════════════════════════════════════════
 * React error boundary that catches JavaScript errors in the
 * component tree below it. Shows a friendly error UI instead
 * of crashing the entire application.
 *
 * Usage:
 *   <CatchError name="TradingPanel">
 *     <TradingPanel />
 *   </CatchError>
 *
 * The `name` prop helps identify which boundary caught the
 * error in logs, useful for debugging in production.
 */

interface CatchErrorProps {
    children: ReactNode;
    /** Custom fallback UI to show instead of default error card */
    fallback?: ReactNode;
    /** Name for identifying this boundary in error logs */
    name?: string;
}

interface CatchErrorState {
    hasError: boolean;
    error: Error | null;
}

export class CatchError extends Component<CatchErrorProps, CatchErrorState> {
    constructor(props: CatchErrorProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): CatchErrorState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        const boundaryName = this.props.name || 'Anonymous';
        console.error(`CatchError [${boundaryName}] caught an error:`, error, errorInfo);
    }

    handleReload = (): void => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    render() {
        const { hasError, error } = this.state;
        const { children, fallback } = this.props;

        if (!hasError) {
            return children;
        }

        // Use custom fallback if provided
        if (fallback) {
            return fallback;
        }

        // Default error UI
        return (
            <Container>
                <Content>
                    <ErrorIcons>
                        <Icons name="alert-circle" size="xl" />
                    </ErrorIcons>
                    <Title>System Error</Title>
                    <Message>
                        {error?.message || 'An unexpected error occurred.'}
                    </Message>
                    <Actions>
                        <ReloadButton onClick={this.handleReload}>
                            Reload Page
                        </ReloadButton>
                    </Actions>
                    {error?.stack && (
                        <Details>
                            <summary>Error Details</summary>
                            <StackTrace>{error.stack}</StackTrace>
                        </Details>
                    )}
                </Content>
            </Container>
        );
    }
}
