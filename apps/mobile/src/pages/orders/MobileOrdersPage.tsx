import { useState } from 'react';
import styled from 'styled-components';
import { COLORS, SPACING, RADIUS } from '../../theme/theme';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { H1, Body, Caption, Mono } from '../../components/Typography';

/**
 * MOBILE ORDERS PAGE
 * View open orders, positions, and order history.
 */

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${COLORS.bg};
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: ${SPACING.l}px;
  padding-bottom: 100px;
`;

const TabBar = styled.div`
  display: flex;
  gap: ${SPACING.s}px;
  margin-bottom: ${SPACING.l}px;
`;

const Tab = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: ${SPACING.s}px ${SPACING.m}px;
  border: none;
  border-radius: ${RADIUS.m}px;
  background: ${({ $active }) => $active ? COLORS.primary : COLORS.glass};
  color: ${({ $active }) => $active ? '#fff' : COLORS.textSecondary};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:active {
    transform: scale(0.98);
  }
`;

const OrderCard = styled(Card)`
  margin-bottom: ${SPACING.m}px;
`;

const OrderHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${SPACING.s}px;
`;

const OrderDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${SPACING.xs}px;
`;

const OrderRow = styled.div`
  display: flex;
  justify-content: space-between;
`;

const Badge = styled.span<{ $type: 'buy' | 'sell' }>`
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  background: ${({ $type }) =>
        $type === 'buy' ? 'rgba(0, 227, 150, 0.15)' : 'rgba(255, 69, 96, 0.15)'};
  color: ${({ $type }) =>
        $type === 'buy' ? COLORS.secondary : COLORS.error};
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${SPACING.xxl}px;
  text-align: center;
`;

// Mock data
const MOCK_ORDERS = [
    { id: '1', symbol: 'BTC-USD', side: 'buy' as const, price: '48,250.00', quantity: '0.05', status: 'pending' },
    { id: '2', symbol: 'ETH-USD', side: 'sell' as const, price: '2,650.00', quantity: '1.5', status: 'pending' },
];

const MOCK_POSITIONS = [
    { symbol: 'BTC-USD', side: 'long' as const, entry: '47,500.00', current: '48,234.50', pnl: '+1.54%', quantity: '0.1' },
];

export const MobileOrdersPage = () => {
    const [activeTab, setActiveTab] = useState<'orders' | 'positions' | 'history'>('orders');

    return (
        <Container>
            <Header title="Orders" />

            <Content>
                <TabBar>
                    <Tab
                        $active={activeTab === 'orders'}
                        onClick={() => setActiveTab('orders')}
                    >
                        Open
                    </Tab>
                    <Tab
                        $active={activeTab === 'positions'}
                        onClick={() => setActiveTab('positions')}
                    >
                        Positions
                    </Tab>
                    <Tab
                        $active={activeTab === 'history'}
                        onClick={() => setActiveTab('history')}
                    >
                        History
                    </Tab>
                </TabBar>

                {activeTab === 'orders' && (
                    <>
                        {MOCK_ORDERS.length > 0 ? (
                            MOCK_ORDERS.map(order => (
                                <OrderCard key={order.id}>
                                    <OrderHeader>
                                        <H1 style={{ fontSize: 18, margin: 0 }}>{order.symbol}</H1>
                                        <Badge $type={order.side}>{order.side.toUpperCase()}</Badge>
                                    </OrderHeader>
                                    <OrderDetails>
                                        <OrderRow>
                                            <Caption>Price</Caption>
                                            <Mono>${order.price}</Mono>
                                        </OrderRow>
                                        <OrderRow>
                                            <Caption>Quantity</Caption>
                                            <Mono>{order.quantity}</Mono>
                                        </OrderRow>
                                    </OrderDetails>
                                    <div style={{ marginTop: SPACING.m, display: 'flex', gap: SPACING.s }}>
                                        <Button
                                            title="Modify"
                                            variant="outline"
                                            size="small"
                                            onPress={() => { }}
                                            style={{ flex: 1 }}
                                        />
                                        <Button
                                            title="Cancel"
                                            variant="danger"
                                            size="small"
                                            onPress={() => { }}
                                            style={{ flex: 1 }}
                                        />
                                    </div>
                                </OrderCard>
                            ))
                        ) : (
                            <EmptyState>
                                <Body>No open orders</Body>
                                <Caption>Your pending orders will appear here</Caption>
                            </EmptyState>
                        )}
                    </>
                )}

                {activeTab === 'positions' && (
                    <>
                        {MOCK_POSITIONS.map(pos => (
                            <OrderCard key={pos.symbol}>
                                <OrderHeader>
                                    <H1 style={{ fontSize: 18, margin: 0 }}>{pos.symbol}</H1>
                                    <Mono color={COLORS.secondary}>{pos.pnl}</Mono>
                                </OrderHeader>
                                <OrderDetails>
                                    <OrderRow>
                                        <Caption>Entry</Caption>
                                        <Mono>${pos.entry}</Mono>
                                    </OrderRow>
                                    <OrderRow>
                                        <Caption>Current</Caption>
                                        <Mono>${pos.current}</Mono>
                                    </OrderRow>
                                    <OrderRow>
                                        <Caption>Quantity</Caption>
                                        <Mono>{pos.quantity}</Mono>
                                    </OrderRow>
                                </OrderDetails>
                            </OrderCard>
                        ))}
                    </>
                )}

                {activeTab === 'history' && (
                    <EmptyState>
                        <Body>No order history</Body>
                        <Caption>Your completed orders will appear here</Caption>
                    </EmptyState>
                )}
            </Content>
        </Container>
    );
};
