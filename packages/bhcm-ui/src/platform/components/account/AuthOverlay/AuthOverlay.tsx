import type { ReactNode } from 'react';
import { useAuthStore } from '@repo/sdk';
import { Icons } from '@repo/bhcm-ui/core';
import {
    Wrapper,
    Overlay,
    LockIcon,
    Message,
    Title,
    Description,
    LoginButton,
    DemoHint,
} from './AuthOverlay.styles';

export interface AuthOverlayProps {
    /** Content to wrap with the auth overlay */
    children: ReactNode;
    /** Overlay variant - 'component' for smaller elements, 'page' for full pages */
    variant?: 'component' | 'page';
    /** Custom title message */
    title?: string;
    /** Custom description message */
    description?: string;
    /** Whether to show the component content blurred behind overlay (default: true) */
    showContent?: boolean;
    /** Custom login handler - if not provided, uses demo login from authStore */
    onLogin?: () => void;
    /** Additional class name */
    className?: string;
}

/**
 * AuthOverlay - A reusable component that covers its children with a 
 * transparent/blurry login prompt when the user is not authenticated.
 * 
 * Use cases:
 * - Wrap individual components (e.g., OrderBook on TradePage)
 * - Wrap entire page content (e.g., WalletPage, OrdersPage, AccountPage)
 * 
 * @example
 * // Component-level usage (partial coverage)
 * <AuthOverlay variant="component">
 *   <OrderBook />
 * </AuthOverlay>
 * 
 * @example
 * // Page-level usage (full page coverage)
 * <AuthOverlay variant="page" title="Account Access Required">
 *   <AccountPageContent />
 * </AuthOverlay>
 */
export const AuthOverlay = ({
    children,
    variant = 'component',
    title = 'Sign In Required',
    description = 'Please sign in to access this feature',
    showContent = true,
    onLogin,
    className,
}: AuthOverlayProps) => {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const loginWithRedirect = useAuthStore((s) => s.loginWithRedirect);

    const handleLogin = () => {
        if (onLogin) {
            onLogin();
        } else {
            // Redirect to auth app
            loginWithRedirect();
        }
    };

    // If authenticated, just render children normally
    if (isAuthenticated) {
        return <>{children}</>;
    }

    return (
        <Wrapper className={className}>
            {/* Render content behind overlay if showContent is true */}
            {showContent && children}

            <Overlay $variant={variant}>
                <LockIcon>
                    <Icons name="lock" size="md" />
                </LockIcon>

                <Message>
                    <Title>{title}</Title>
                    <Description>{description}</Description>
                </Message>

                <LoginButton onClick={handleLogin}>
                    <Icons name="key-round" size="sm" />
                    Sign In
                </LoginButton>

                <DemoHint>Secure authentication</DemoHint>
            </Overlay>
        </Wrapper>
    );
};

export default AuthOverlay;
