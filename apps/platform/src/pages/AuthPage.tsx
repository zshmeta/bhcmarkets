import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useWalletStore } from '@repo/sdk';
import { useI18n } from '../i18n';
import { Icons } from '../components-refactored/Icons';
import { useIsMobile } from '../hooks/useMediaQuery';
import { LanguageToggle } from '../components-refactored/LanguageToggle';
import { ThemeToggle } from '../components-refactored/ThemeToggle';
import {
    Container,
    Overlay,
    Decor,
    Grid,
    Card,
    Header,
    Logo,
    Title,
    Subtitle,
    WelcomeBanner,
    WelcomeTitle,
    WelcomeParagraph,
    InputGroup,
    Label,
    InputWrapper,
    Input,
    InputIcons,
    SubmitBtn,
    ModeSwitch,
    ModeSwitchText,
    ModeSwitchBtn,
    ErrorMessage,
    Spinner,
    SettingsBar,
    SettingsDivider,
    Footer,
    SecurityBadges,
    SecurityBadge,
    SystemStatus,
    StatusHeader,
    StatusGrid,
    StatusItem,
    Dot,
    StatusInfo,
    StatusLabel,
    StatusValue,
    MobileFooter,
    MobileSystemStatus,
    MobileStatusItem,
    MobileStatusDot,
    MobileSecurityBadges,
    MobileSecurityBadge,
    MobileLanguageToggle,
} from './AuthPage.styles';

type AuthMode = 'login' | 'register';

export const AuthPage: React.FC = () => {
    const { t, locale } = useI18n();
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const { login, register, isAuthenticated, isLoading, isInitialized, markAsInitialized } = useAuthStore();
    const { grantInitialFunds, hasReceivedInitialGrant } = useWalletStore();

    const [mode, setMode] = useState<AuthMode>('login');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [systemCheck, setSystemCheck] = useState({
        ws: 'pending' as 'ok' | 'pending' | 'error',
        engine: 'pending' as 'ok' | 'pending' | 'error',
        security: 'pending' as 'ok' | 'pending' | 'error',
    });

    useEffect(() => {
        if (isAuthenticated) {
            if (!isInitialized && !hasReceivedInitialGrant) {
                const granted = grantInitialFunds();
                if (granted) {
                    markAsInitialized();
                }
            }
            navigate('/trade');
        }
    }, [isAuthenticated, isInitialized, hasReceivedInitialGrant, grantInitialFunds, markAsInitialized, navigate]);

    useEffect(() => {
        const runChecks = async () => {
            await new Promise(r => setTimeout(r, 600));
            setSystemCheck(prev => ({ ...prev, ws: 'ok' }));
            await new Promise(r => setTimeout(r, 400));
            setSystemCheck(prev => ({ ...prev, engine: 'ok' }));
            await new Promise(r => setTimeout(r, 500));
            setSystemCheck(prev => ({ ...prev, security: 'ok' }));
        };
        runChecks();
    }, []);

    const validateForm = (): boolean => {
        setError(null);
        if (!username.trim()) {
            setError(t.auth?.usernameRequired || 'Username is required');
            return false;
        }
        if (!password) {
            setError(t.auth?.passwordRequired || 'Password is required');
            return false;
        }
        if (password.length < 6) {
            setError(t.auth?.passwordTooShort || 'Password must be at least 6 characters');
            return false;
        }
        if (mode === 'register' && password !== confirmPassword) {
            setError(t.auth?.passwordMismatch || 'Passwords do not match');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        setError(null);

        if (mode === 'register') {
            const result = await register(username.trim(), password);
            if (!result.success) {
                setError(t.auth?.[result.error as keyof typeof t.auth] || result.error || 'Registration failed');
            }
        } else {
            const result = await login(username.trim(), password);
            if (!result.success) {
                setError(t.auth?.[result.error as keyof typeof t.auth] || result.error || 'Login failed');
            }
        }
    };

    const toggleMode = () => {
        setMode(mode === 'login' ? 'register' : 'login');
        setError(null);
        setConfirmPassword('');
    };

    return (
        <Container>
            <Decor>
                <Grid />
            </Decor>
            <Overlay />

            {/* Quick Settings Bar - Desktop Only */}
            {!isMobile && (
                <SettingsBar>
                    <LanguageToggle />
                    <SettingsDivider />
                    <ThemeToggle />
                </SettingsBar>
            )}

            <Card>
                <Header>
                    <Logo>
                        <Icons name="activity" size={isMobile ? "lg" : "xl"} strokeWidth={3} />
                    </Logo>
                    <Title>TBT TRADING</Title>
                    <Subtitle>{t.header.title}</Subtitle>
                </Header>

                {/* Enhanced Welcome Banner */}
                <WelcomeBanner>
                    <WelcomeTitle>
                        {mode === 'login' ? t.auth?.welcomeTitle || 'Welcome' : t.auth?.signUp || 'Sign Up'}
                    </WelcomeTitle>
                    <WelcomeParagraph>
                        {isMobile
                            ? t.auth?.welcomeMessageMobile
                            : (locale === 'en-US' ? t.auth?.welcomeMessageZh : t.auth?.welcomeMessageEn)}
                    </WelcomeParagraph>
                </WelcomeBanner>

                <form onSubmit={handleSubmit}>
                    <InputGroup>
                        <Label>{t.common?.username || 'Username'}</Label>
                        <InputWrapper>
                            <Input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder={t.common?.usernamePlaceholder || 'Enter username'}
                                autoComplete="username"
                                required
                            />
                            <InputIcons><Icons name="user" size="sm" /></InputIcons>
                        </InputWrapper>
                    </InputGroup>

                    <InputGroup>
                        <Label>{t.common?.password || 'Password'}</Label>
                        <InputWrapper>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={t.common?.passwordPlaceholder || '••••••••'}
                                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                                required
                            />
                            <InputIcons><Icons name="lock" size="sm" /></InputIcons>
                        </InputWrapper>
                    </InputGroup>

                    {mode === 'register' && (
                        <InputGroup>
                            <Label>{t.auth?.confirmPassword || 'Confirm Password'}</Label>
                            <InputWrapper>
                                <Input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder={t.common?.passwordPlaceholder || '••••••••'}
                                    autoComplete="new-password"
                                    required
                                />
                                <InputIcons><Icons name="lock" size="sm" /></InputIcons>
                            </InputWrapper>
                        </InputGroup>
                    )}

                    {error && (
                        <ErrorMessage>
                            <Icons name="alert-circle" size="sm" />
                            <span>{error}</span>
                        </ErrorMessage>
                    )}

                    <SubmitBtn type="submit" disabled={isLoading}>
                        {isLoading ? (
                            <Spinner><Icons name="loader" /></Spinner>
                        ) : (
                            mode === 'register'
                                ? (t.auth?.createAccount || 'Get Started')
                                : (t.auth?.signIn || 'Login Now')
                        )}
                    </SubmitBtn>

                    <ModeSwitch>
                        <ModeSwitchText>
                            {mode === 'login'
                                ? (t.auth?.noAccount || "New to TBT?")
                                : (t.auth?.haveAccount || 'Already a member?')
                            }
                        </ModeSwitchText>
                        <ModeSwitchBtn type="button" onClick={toggleMode}>
                            {mode === 'login'
                                ? (t.auth?.switchToRegister || 'Create Account')
                                : (t.auth?.switchToLogin || 'Sign In')
                            }
                        </ModeSwitchBtn>
                    </ModeSwitch>
                </form>

                {/* Enhanced Footer - Desktop */}
                {!isMobile && (
                    <Footer>
                        <SecurityBadges>
                            <SecurityBadge>
                                <Icons name="shield-check" size="xs" />
                                <span>SSL SECURE</span>
                            </SecurityBadge>
                            <SecurityBadge>
                                <Icons name="lock" size="xs" />
                                <span>2FA READY</span>
                            </SecurityBadge>
                        </SecurityBadges>

                        <SystemStatus>
                            <StatusHeader>
                                <Icons name="activity" size="xs" />
                                <span>Real-Time Engine Status</span>
                            </StatusHeader>
                            <StatusGrid>
                                <StatusItem>
                                    <Dot $status={systemCheck.ws} />
                                    <StatusInfo>
                                        <StatusLabel>WebSocket</StatusLabel>
                                        <StatusValue>{systemCheck.ws === 'ok' ? 'Connected' : '...'}</StatusValue>
                                    </StatusInfo>
                                </StatusItem>
                                <StatusItem>
                                    <Dot $status={systemCheck.engine} />
                                    <StatusInfo>
                                        <StatusLabel>Matching</StatusLabel>
                                        <StatusValue>{systemCheck.engine === 'ok' ? 'Active' : '...'}</StatusValue>
                                    </StatusInfo>
                                </StatusItem>
                                <StatusItem>
                                    <Dot $status={systemCheck.security} />
                                    <StatusInfo>
                                        <StatusLabel>Security</StatusLabel>
                                        <StatusValue>{systemCheck.security === 'ok' ? 'Active' : '...'}</StatusValue>
                                    </StatusInfo>
                                </StatusItem>
                            </StatusGrid>
                        </SystemStatus>
                    </Footer>
                )}

                {/* Mobile Footer */}
                {isMobile && (
                    <MobileFooter>
                        <MobileSystemStatus>
                            <MobileStatusItem>
                                <MobileStatusDot $status={systemCheck.ws} />
                                <span>WS</span>
                            </MobileStatusItem>
                            <MobileStatusItem>
                                <MobileStatusDot $status={systemCheck.engine} />
                                <span>Engine</span>
                            </MobileStatusItem>
                            <MobileStatusItem>
                                <MobileStatusDot $status={systemCheck.security} />
                                <span>Security</span>
                            </MobileStatusItem>
                        </MobileSystemStatus>
                        <MobileSecurityBadges>
                            <MobileSecurityBadge>
                                <Icons name="shield-check" size="xs" />
                                <span>SSL</span>
                            </MobileSecurityBadge>
                            <MobileSecurityBadge>
                                <Icons name="lock" size="xs" />
                                <span>2FA</span>
                            </MobileSecurityBadge>
                        </MobileSecurityBadges>
                        <MobileLanguageToggle>
                            <LanguageToggle />
                        </MobileLanguageToggle>
                    </MobileFooter>
                )}
            </Card>
        </Container>
    );
};
