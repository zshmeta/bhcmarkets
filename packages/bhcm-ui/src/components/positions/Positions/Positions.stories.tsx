import type { Meta, StoryObj } from '@storybook/react';
import PositionsView from './Positions.view';
import type { PositionsViewProps } from './Positions.view';
import type { Position, PositionPnL } from './usePositions';

/* ═══════════════════════════════════════════════════════════
 * PositionsView Stories
 * ═══════════════════════════════════════════════════════════
 */

const mockPositions: [string, Position][] = [
  ['BTCUSDT', { symbol: 'BTCUSDT', side: 'long', quantity: '0.5', avgEntryPrice: '50000' }],
  ['ETHUSDT', { symbol: 'ETHUSDT', side: 'long', quantity: '2.5', avgEntryPrice: '3000' }],
];

const calculatePnL = (pos: Position): PositionPnL => {
  const entry = parseFloat(pos.avgEntryPrice);
  const currentPrice = 52500; // Mock
  const pnl = (currentPrice - entry) * parseFloat(pos.quantity);
  return {
    pnl,
    pnlPercent: entry > 0 ? (pnl / (entry * parseFloat(pos.quantity))) * 100 : 0,
    hasPrice: true,
  };
};

const defaultProps: PositionsViewProps = {
  positions: mockPositions,
  currentSymbol: 'BTCUSDT',
  currentPrice: 52500,
  totalPnL: 1124.50,
  usdtBalance: { asset: 'USDT', available: '10000.00', locked: '500.00' },
  translations: {
    title: 'Positions',
    noPositions: 'No open positions',
    symbol: 'Symbol',
    quantity: 'Qty',
    entryPrice: 'Entry',
    marketPrice: 'Market',
    pnl: 'PnL',
    actions: 'Actions',
    tpsl: {
      takeProfit: 'Take Profit',
      stopLoss: 'Stop Loss',
      triggerPrice: 'Trigger Price',
      save: 'Save',
      cancel: 'Cancel',
      close: 'Close',
      error: 'Error',
      success: 'Success',
    },
  },
  confirmClose: null,
  tpslSymbol: null,
  calculatePnL,
  onSetConfirmClose: () => { },
  onSetTPSLSymbol: () => { },
  onClosePosition: () => { },
  onTogglePrivacy: () => { },
  privacyMode: false,
  onSaveTPSL: () => { },
};

const meta: Meta<typeof PositionsView> = {
  title: 'Trading/PositionsView',
  component: PositionsView,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Positions table with P&L tracking, close actions, and TP/SL management.',
      },
    },
  },

  argTypes: {
    onSetConfirmClose: { action: 'confirm close' },
    onSetTPSLSymbol: { action: 'open TPSL' },
    onClosePosition: { action: 'close position' },
    onTogglePrivacy: { action: 'toggle privacy' },
    onSaveTPSL: { action: 'save TPSL' },
  },
};

export default meta;
type Story = StoryObj<typeof PositionsView>;

export const Default: Story = {
  args: defaultProps,
  decorators: [(Story) => <div style={{ width: 700 }}><Story /></div>],
};

export const Empty: Story = {
  args: { ...defaultProps, positions: [], totalPnL: 0 },
  decorators: [(Story) => <div style={{ width: 700 }}><Story /></div>],
};

export const WithProfit: Story = {
  args: {
    ...defaultProps,
    totalPnL: 2500.75,
    calculatePnL: () => ({ pnl: 2500.75, pnlPercent: 5.2, hasPrice: true }),
  },
  decorators: [(Story) => <div style={{ width: 700 }}><Story /></div>],
};

export const WithLoss: Story = {
  args: {
    ...defaultProps,
    totalPnL: -850.25,
    calculatePnL: () => ({ pnl: -850.25, pnlPercent: -3.1, hasPrice: true }),
  },
  decorators: [(Story) => <div style={{ width: 700 }}><Story /></div>],
};

export const ConfirmCloseModal: Story = {
  args: { ...defaultProps, confirmClose: 'BTCUSDT' },
  decorators: [(Story) => <div style={{ width: 700 }}><Story /></div>],
};

export const NoPriceData: Story = {
  args: {
    ...defaultProps,
    currentPrice: 0,
    calculatePnL: () => ({ pnl: null, pnlPercent: null, hasPrice: false }),
  },
  decorators: [(Story) => <div style={{ width: 700 }}><Story /></div>],
};
