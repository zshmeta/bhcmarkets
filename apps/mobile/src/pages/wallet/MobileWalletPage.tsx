import React from 'react';
import {
    Container,
    ScrollContent,
    BalanceCard,
    BalanceHeader,
    BalanceLabel,
    HideBtn,
    TotalBalance,
    Currency,
    Amount,
    Equivalent,
    QuickActions,
    ActionBtn,
    ActionIcons,
    AssetSection,
    SectionHeader,
    SectionTitle,
    AssetList,
    AssetItem,
    AssetIcons,
    AssetInfo,
    AssetName,
    AssetFullName,
    AssetBalance,
    BalanceAmount,
    BalanceValue
} from '../WalletPage.mobile.styles';
import { Header } from '../../components/Header';
import { H1, H3, Body, Mono, Caption } from '../../components/Typography';

export const MobileWalletPage = () => {
    return (
        <Container>
            <Header title="Wallet" />
            <ScrollContent>

                {/* Balance Card */}
                <BalanceCard>
                    <BalanceHeader>
                        <BalanceLabel>Total Balance</BalanceLabel>
                        <HideBtn>👁️</HideBtn>
                    </BalanceHeader>
                    <TotalBalance>
                        <Currency>$</Currency>
                        <Amount>12,450.00</Amount>
                        <Equivalent>≈ 0.18 BTC</Equivalent>
                    </TotalBalance>

                    <QuickActions>
                        <ActionBtn onClick={() => { }}>
                            <ActionIcons>↓</ActionIcons>
                            <span>Deposit</span>
                        </ActionBtn>
                        <ActionBtn onClick={() => { }}>
                            <ActionIcons>↑</ActionIcons>
                            <span>Withdraw</span>
                        </ActionBtn>
                        <ActionBtn onClick={() => { }}>
                            <ActionIcons>⇄</ActionIcons>
                            <span>Transfer</span>
                        </ActionBtn>
                        <ActionBtn onClick={() => { }}>
                            <ActionIcons>↻</ActionIcons>
                            <span>Convert</span>
                        </ActionBtn>
                    </QuickActions>
                </BalanceCard>

                {/* Assets Section */}
                <AssetSection>
                    <SectionHeader>
                        <SectionTitle>ASSETS</SectionTitle>
                    </SectionHeader>
                    <AssetList>
                        <AssetItem>
                            <AssetIcons>💲</AssetIcons>
                            <AssetInfo>
                                <AssetName>USDC</AssetName>
                                <AssetFullName>USD Coin</AssetFullName>
                            </AssetInfo>
                            <AssetBalance>
                                <BalanceAmount>12,450.00</BalanceAmount>
                                <BalanceValue>$12,450.00</BalanceValue>
                            </AssetBalance>
                        </AssetItem>
                    </AssetList>
                </AssetSection>

            </ScrollContent>
        </Container>
    );
};
