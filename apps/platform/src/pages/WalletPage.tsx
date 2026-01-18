import { useState } from 'react';
import { useWalletStore } from '@repo/sdk';
import { useI18n } from '@repo/bhcm-ui/i18n';
import { Icons } from '@repo/bhcm-ui/core';
import { useIsMobile } from '../hooks/useMediaQuery';
import { MobileWalletPage } from '../../../mobile/src/pages';
import {
    AccountOverviewCard,
    AssetBalancesPanel,
    LinkedMethodsPanel,
    LedgerTable,
    DepositDrawer,
    WithdrawDrawer,
    OnboardingGuide,
    AuthOverlay,
} from '@repo/bhcm-ui/account';
import {
    Container,
    Header,
    HeaderLeft,
    Title,
    SimulatedBadge,
    HeaderActions,
    DepositButton,
    WithdrawButton,
    TabsContainer,
    Tab,
    MainContentArea,
    OnboardingWrapper,
    Content,
    LeftColumn,
    RightColumn,
    FullWidthColumn,
} from './WalletPage.styles';

type WalletTab = 'overview' | 'spot' | 'funding' | 'history';

export const WalletPage = () => {
    const isMobile = useIsMobile();
    const { t } = useI18n();
    const stage = useWalletStore((state) => state.getOnboardingStage());
    const [activeTab, setActiveTab] = useState<WalletTab>('overview');
    const [depositOpen, setDepositOpen] = useState(false);
    const [withdrawOpen, setWithdrawOpen] = useState(false);

    // Render mobile layout
    if (isMobile) {
        return <MobileWalletPage />;
    }

    const tabs: { id: WalletTab; label: string; Icons: any }[] = [
        { id: 'overview', label: t.wallet?.overview || 'Overview', Icons: 'layout' },
        { id: 'spot', label: t.wallet?.spot || 'Spot', Icons: 'wallet' },
        { id: 'funding', label: t.wallet?.funding || 'Funding', Icons: 'banknote' },
        { id: 'history', label: t.wallet?.history || 'History', Icons: 'history' },
    ];

    return (
        <AuthOverlay variant="page" title="Wallet Access" description="Sign in to view your wallet and balances">
            <Container>
                {/* Header with Simulated Badge */}
                <Header>
                    <HeaderLeft>
                        <Title>
                            <Icons name="wallet" size="lg" />
                            {t.wallet?.title || 'Wallet'}
                        </Title>
                        <SimulatedBadge
                            title={t.wallet?.simulatedTooltip || 'This is a simulated wallet for paper trading.'}
                        >
                            {t.wallet?.simulatedBadge || 'Simulated'}
                        </SimulatedBadge>
                    </HeaderLeft>

                    <HeaderActions>
                        {stage !== 'not_created' && (
                            <>
                                <DepositButton onClick={() => setDepositOpen(true)}>
                                    <Icons name="download" size="sm" />
                                    {t.wallet?.deposit || 'Deposit'}
                                </DepositButton>
                                <WithdrawButton onClick={() => setWithdrawOpen(true)}>
                                    <Icons name="upload" size="sm" />
                                    {t.wallet?.withdraw || 'Withdraw'}
                                </WithdrawButton>
                            </>
                        )}
                    </HeaderActions>
                </Header>

                {/* Tabs */}
                {stage !== 'not_created' && (
                    <TabsContainer>
                        {tabs.map((tab) => (
                            <Tab
                                key={tab.id}
                                $active={activeTab === tab.id}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <Icons name={tab.Icons} size="sm" />
                                <span>{tab.label}</span>
                            </Tab>
                        ))}
                    </TabsContainer>
                )}

                {/* Main Content */}
                <MainContentArea>
                    {stage === 'not_created' ? (
                        <OnboardingWrapper>
                            <OnboardingGuide stage={stage} />
                        </OnboardingWrapper>
                    ) : (
                        <>
                            {/* Onboarding Banner (for stages after account creation) */}
                            {(stage === 'no_payment_method' || stage === 'no_funds') && (
                                <OnboardingGuide
                                    stage={stage}
                                    onOpenDeposit={() => setDepositOpen(true)}
                                />
                            )}

                            <Content>
                                {activeTab === 'overview' && (
                                    <>
                                        {/* Left Column */}
                                        <LeftColumn>
                                            <AccountOverviewCard />
                                            <LinkedMethodsPanel highlightAdd={stage === 'no_payment_method'} />
                                        </LeftColumn>

                                        {/* Right Column */}
                                        <RightColumn>
                                            <AssetBalancesPanel
                                                onDeposit={() => setDepositOpen(true)}
                                                onWithdraw={() => setWithdrawOpen(true)}
                                            />
                                        </RightColumn>
                                    </>
                                )}

                                {activeTab === 'spot' && (
                                    <FullWidthColumn>
                                        <AssetBalancesPanel
                                            onDeposit={() => setDepositOpen(true)}
                                            onWithdraw={() => setWithdrawOpen(true)}
                                        />
                                    </FullWidthColumn>
                                )}

                                {activeTab === 'funding' && (
                                    <FullWidthColumn>
                                        <LinkedMethodsPanel highlightAdd={stage === 'no_payment_method'} />
                                    </FullWidthColumn>
                                )}

                                {activeTab === 'history' && (
                                    <FullWidthColumn>
                                        <LedgerTable />
                                    </FullWidthColumn>
                                )}
                            </Content>
                        </>
                    )}
                </MainContentArea>

                {/* Drawers */}
                <DepositDrawer
                    isOpen={depositOpen}
                    onClose={() => setDepositOpen(false)}
                />
                <WithdrawDrawer
                    isOpen={withdrawOpen}
                    onClose={() => setWithdrawOpen(false)}
                />
            </Container>
        </AuthOverlay>
    );
}
