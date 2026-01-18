import React from 'react';
import {
  Container,
  List,
  MarketItem,
  AssetInfo,
  AssetName,
  AssetQuoteRow,
  AssetQuote,
  PriceCol,
  Price,
  ChangeBadge
} from '../MarketsPage.mobile.styles';
import { Header } from '../../components/Header';
import { H3, Body, Mono, Caption } from '../../components/Typography';
import { useMarketDataContext } from '../../context/MarketDataContext';
import styled from 'styled-components';
import { SPACING, COLORS } from '../../theme/theme';

// Temporary local styles until ensured they are in the style file
const Section = styled.div`
  margin-top: ${SPACING.l}px;
`;

const SectionTitle = styled(Caption)`
  margin-left: ${SPACING.l}px;
  margin-bottom: ${SPACING.s}px;
  letter-spacing: 1px;
`;

const TrendingList = styled.div`
  display: flex;
  overflow-x: auto;
  padding: 0 ${SPACING.l}px;
  gap: ${SPACING.m}px;
  -webkit-overflow-scrolling: touch;
  &::-webkit-scrollbar { display: none; }
`;

const TrendingCard = styled.div`
  min-width: 160px;
  padding: ${SPACING.m}px;
  background-color: ${COLORS.bgLayer1};
  border-radius: 8px;
  flex-shrink: 0;
`;

const TrendingHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: ${SPACING.xs}px;
`;

const TrendingPrice = styled(Mono)`
  font-size: 20px;
  margin-top: ${SPACING.m}px;
`;

const TRENDING = [
  { symbol: 'BTC', name: 'Bitcoin', change: '+5.2%', price: '$48,234' },
  { symbol: 'ETH', name: 'Ethereum', change: '+3.1%', price: '$2,845' },
  { symbol: 'SOL', name: 'Solana', change: '+12.4%', price: '$145' },
];

export const MobileMarketsPage = () => {
  const { latestData } = useMarketDataContext();

  return (
    <Container>
      <Header title="Markets" />
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 100 }}>

        {/* Trending Section */}
        <Section>
          <SectionTitle>TRENDING ASSETS</SectionTitle>
          <TrendingList>
            {TRENDING.map((item) => (
              <TrendingCard key={item.symbol}>
                <TrendingHeader>
                  <H3>{item.symbol}</H3>
                  <Mono color={COLORS.secondary} weight="600">{item.change}</Mono>
                </TrendingHeader>
                <Body color={COLORS.textTertiary}>{item.name}</Body>
                <TrendingPrice weight="700">{item.price}</TrendingPrice>
              </TrendingCard>
            ))}
          </TrendingList>
        </Section>

        {/* All Assets List */}
        <Section>
          <SectionTitle>ALL ASSETS</SectionTitle>
          <List>
            {['BTC-USD', 'ETH-USD', 'SOL-USD', 'AVAX-USD', 'DOT-USD'].map((symbol) => {
              const data = latestData[symbol];
              const price = data ? `$${data.price.toFixed(2)}` : '---';

              return (
                <MarketItem key={symbol}>
                  <AssetInfo>
                    <AssetName>{symbol.split('-')[0]}</AssetName>
                    <AssetQuoteRow>
                      <AssetQuote>Perpetual</AssetQuote>
                    </AssetQuoteRow>
                  </AssetInfo>
                  <PriceCol>
                    <Price>{price}</Price>
                    <ChangeBadge $positive>+2.4%</ChangeBadge>
                  </PriceCol>
                </MarketItem>
              );
            })}
          </List>
        </Section>

      </div>
    </Container>
  );
};
