// Mobile Page Styled-Components Barrel Exports
export * as TradePageMobileStyles from './TradePage.mobile.styles';
export * as WalletPageMobileStyles from './WalletPage.mobile.styles';
export * as OrdersPageMobileStyles from './OrdersPage.mobile.styles';
export * as MarketsPageMobileStyles from './MarketsPage.mobile.styles';
export * as AccountPageMobileStyles from './AccountPage.mobile.styles';

// Mobile Page Stub Components - TODO: implement properly
const MobilePagePlaceholder = ({ name }: { name: string }) => (
    <div style= {{ padding: '20px', textAlign: 'center' }}>
        { name } - Mobile view coming soon
            </div>
);

export const MobileTradePage = () => <MobilePagePlaceholder name="Trade" />;
export const MobileMarketsPage = () => <MobilePagePlaceholder name="Markets" />;
export const MobileOrdersPage = () => <MobilePagePlaceholder name="Orders" />;
export const MobileAccountPage = () => <MobilePagePlaceholder name="Account" />;
export const MobileWalletPage = () => <MobilePagePlaceholder name="Wallet" />;
