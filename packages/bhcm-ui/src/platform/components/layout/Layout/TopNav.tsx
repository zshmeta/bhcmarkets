import { useI18n } from '../../i18n';
import { Nav, StyledNavLink } from './TopNav.styles';

/**
 * TOP NAV - Main navigation for desktop layout
 * Uses react-router NavLink for active state detection
 */

const TopNav = () => {
  const { t } = useI18n();

  return (
    <Nav>
      <StyledNavLink to="/assets">
        {t.wallet?.overview || 'Overview'}
      </StyledNavLink>
      <StyledNavLink to="/trade">
        {t.nav?.trade || 'Trade'}
      </StyledNavLink>
      <StyledNavLink to="/markets">
        {t.nav?.markets || 'Markets'}
      </StyledNavLink>
      <StyledNavLink to="/wallet">
        {t.nav?.wallet || 'Wallet'}
      </StyledNavLink>
      <StyledNavLink to="/orders">
        {t.nav?.orders || 'Orders'}
      </StyledNavLink>
    </Nav>
  );
}

export default TopNav;
