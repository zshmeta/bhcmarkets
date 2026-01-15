import { useLocation } from 'react-router-dom';
import { useI18n } from '../../i18n';
import { Icons, IconsName } from '../Icons';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import {
    NavContainer,
    NavItem,
    IconsWrapper,
    Label,
    CenterButton,
    CenterIcons,
    CenterLabel,
} from './Nav.styles';

/* ═══════════════════════════════════════════════════════════
 * BOTTOM NAV
 * ═══════════════════════════════════════════════════════════
 * Mobile-only bottom navigation bar with 5 items.
 * The center "Trade" button is elevated for emphasis.
 * Hidden on auth page and desktop viewports.
 */

interface NavItem {
    path: string;
    Icons: IconsName;
    labelKey: string;
    fallback: string;
    isCenter?: boolean;
}

const navItems: NavItem[] = [
    { path: '/markets', Icons: 'bar-chart-3', labelKey: 'markets', fallback: 'Markets' },
    { path: '/orders', Icons: 'layers', labelKey: 'orders', fallback: 'Orders' },
    { path: '/trade', Icons: 'arrow-up-down', labelKey: 'trade', fallback: 'Trade', isCenter: true },
    { path: '/wallet', Icons: 'wallet', labelKey: 'wallet', fallback: 'Wallet' },
    { path: '/settings', Icons: 'user', labelKey: 'account', fallback: 'Account' },
];

const Nav = () => {
    const { t } = useI18n();
    const location = useLocation();
    const { trigger } = useHapticFeedback();

    // Don't render on authentication page
    if (location.pathname === '/auth') {
        return null;
    }

    return (
        <NavContainer>
            {navItems.map((item) => (
                <NavItem
                    key={item.path}
                    to={item.path}
                    $isCenter={item.isCenter}
                    data-center={item.isCenter ? 'true' : undefined}
                    onClick={() => trigger(item.isCenter ? 'medium' : 'selection')}
                >
                    {item.isCenter ? (
                        <>
                            <CenterButton>
                                <CenterIcons>
                                    <Icons name={item.Icons} size="lg" />
                                </CenterIcons>
                            </CenterButton>
                            <CenterLabel>
                                {(t.nav as Record<string, string>)?.[item.labelKey] || item.fallback}
                            </CenterLabel>
                        </>
                    ) : (
                        <>
                            <IconsWrapper className="Icons">
                                <Icons name={item.Icons} size="md" />
                            </IconsWrapper>
                            <Label>
                                {(t.nav as Record<string, string>)?.[item.labelKey] || item.fallback}
                            </Label>
                        </>
                    )}
                </NavItem>
            ))}
        </NavContainer>
    );
}

export default Nav;
