/**
 * Mobile Module - Public API
 * 
 * Exports all mobile UI components, theme tokens, and utilities.
 * Smart pages with business logic are in apps/mobile, not here.
 */

// Theme
export * from './theme';

// Layout components
export { MobileDrawer } from './components/MobileDrawer';
export { MobileActionSheet } from './components/MobileActionSheet';
export { MobileSegmentedControl } from './components/MobileSegmentedControl';

// Navigation
export { default as MobileHeader } from './components/MobileHeader';
export { MobileTabNavigator, TabNavigator, type TabRoute } from './components/MobileTabNavigator';

// Primitives
export { MobileButton, Button } from './components/MobileButton';
export { MobileCard, Card } from './components/MobileCard';
export { MobileInput, Input } from './components/MobileInput';
export { MobileGlassView, GlassView } from './components/MobileGlassView';

// Typography
export {
    H1, H2, H3, Body, Caption, Mono, Label,
} from './components/MobileTypography';

// Layouts
export { default as MobileLayout } from './layouts/MobileLayout';

// Trading - Mobile wrappers for platform components
export { MobileChart, Chart as TradingChart } from './trading/MobileChart';
export { MobileOrderBook, OrderBook as TradingOrderBook } from './trading/MobileOrderBook';

