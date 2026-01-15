import { Icons } from '../Icons';
import type {
    UserInfo,
    AccountInfo,
    EquityData,
    AccountOverviewTranslations,
} from './useUserOverview';
import { formatNumber } from '../../utils';
import {
    Container,
    NotLoggedInWrapper,
    NotLoggedInIcons,
    NotLoggedInTitle,
    NotLoggedInDesc,
    SignInButton,
    Header,
    AvatarWrapper,
    Avatar,
    AvatarPlaceholder,
    UserInfo as UserInfoStyled,
    DisplayName,
    AccountId,
    EquitySection,
    EquityLabel,
    EquityValue,
    CurrencySymbol,
    CurrencyCode,
    BalanceGrid,
    BalanceItem,
    BalanceLabel,
    BalanceValue,
    NoFundsPrompt,
    QuickActions,
    ActionButton,
} from './UserOverview.styles';

/* ═══════════════════════════════════════════════════════════
 * PURE PRESENTATIONAL COMPONENT
 * ═══════════════════════════════════════════════════════════
 * UserOverview.view.tsx - Dumb component with no store hooks.
 * All data and callbacks passed via props.
 */

/* ═══════════════════════════════════════════════════════════
 * VIEW PROPS INTERFACE
 * ═══════════════════════════════════════════════════════════
 */
export interface NavigationConfig {
    signIn: string;
    wallet: string;
    orders: string;
    settings: string;
}

export interface UserOverviewViewProps {
    /** Whether user is authenticated */
    isAuthenticated: boolean;
    /** User info (if authenticated) */
    user: UserInfo | null;
    /** Account info (if available) */
    account: AccountInfo | null;
    /** Equity data */
    equity: EquityData;
    /** Translations */
    translations: AccountOverviewTranslations;
    /** Navigation routes (or hrefs) */
    navigation: NavigationConfig;
}

/* ═══════════════════════════════════════════════════════════
 * MAIN VIEW COMPONENT
 * ═══════════════════════════════════════════════════════════
 */
const UserOverviewView = ({
    isAuthenticated,
    user,
    account,
    equity,
    translations: t,
    navigation,
}: UserOverviewViewProps) => {
    // Not logged in state
    if (!isAuthenticated || !user) {
        return (
            <Container>
                <NotLoggedInWrapper>
                    <NotLoggedInIcons>
                        <Icons name="user" size="lg" />
                    </NotLoggedInIcons>
                    <NotLoggedInTitle>{t.notLoggedIn}</NotLoggedInTitle>
                    <NotLoggedInDesc>{t.signInPrompt}</NotLoggedInDesc>
                    <SignInButton href={navigation.signIn}>{t.signIn}</SignInButton>
                </NotLoggedInWrapper>
            </Container>
        );
    }

    // Authenticated state
    return (
        <Container>
            {/* Header: Avatar + User Info */}
            <Header>
                <AvatarWrapper>
                    {user.avatar ? (
                        <Avatar src={user.avatar} alt="" />
                    ) : (
                        <AvatarPlaceholder>
                            <Icons name="user" size="sm" />
                        </AvatarPlaceholder>
                    )}
                </AvatarWrapper>
                <UserInfoStyled>
                    <DisplayName>{user.displayName}</DisplayName>
                    {account && <AccountId>{account.accountId}</AccountId>}
                </UserInfoStyled>
            </Header>

            {/* Equity Display */}
            <EquitySection>
                <EquityLabel>{t.totalEquity}</EquityLabel>
                <EquityValue>
                    <CurrencySymbol>$</CurrencySymbol>
                    {formatNumber(equity.totalEquity)}
                    <CurrencyCode>USD</CurrencyCode>
                </EquityValue>
            </EquitySection>

            {/* Balance Grid */}
            <BalanceGrid>
                <BalanceItem>
                    <BalanceLabel>{t.available}</BalanceLabel>
                    <BalanceValue>${formatNumber(equity.availableBalance)}</BalanceValue>
                </BalanceItem>
                <BalanceItem>
                    <BalanceLabel>{t.reserved}</BalanceLabel>
                    <BalanceValue>${formatNumber(equity.frozenBalance)}</BalanceValue>
                </BalanceItem>
            </BalanceGrid>

            {/* No Funds Warning */}
            {!equity.hasFunds && (
                <NoFundsPrompt>
                    <Icons name="wallet" size="sm" />
                    <span>{t.depositPrompt}</span>
                </NoFundsPrompt>
            )}

            {/* Quick Action Buttons */}
            <QuickActions>
                <ActionButton href={navigation.wallet}>
                    <Icons name="wallet" size="sm" />
                    <span>{t.viewWallet}</span>
                </ActionButton>
                <ActionButton href={navigation.orders}>
                    <Icons name="file-text" size="sm" />
                    <span>{t.viewOrders}</span>
                </ActionButton>
                <ActionButton href={navigation.settings}>
                    <Icons name="settings" size="sm" />
                    <span>{t.accountSettings}</span>
                </ActionButton>
            </QuickActions>
        </Container>
    );
}

export { UserOverviewView };
