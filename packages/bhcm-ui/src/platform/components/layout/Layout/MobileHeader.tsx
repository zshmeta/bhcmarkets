import { Link } from 'react-router-dom';
import { Icons } from '../Icons';
import { AccountMenu } from './AccountMenu';
import {
  Header,
  Left,
  Right,
  LogoLink,
  LogoIcons,
  BackBtn,
  Title,
} from './MobileHeader.styles';

/**
 * MOBILE HEADER - Compact navigation for mobile screens
 * With optional back button and blur effect
 */

interface MobileHeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  showActions?: boolean;
  rightAction?: React.ReactNode;
}

const MobileHeader = ({
  title,
  showBack = false,
  onBack,
  showActions = true,
  rightAction,
}: MobileHeaderProps) => {
  return (
    <Header>
      <Left>
        {showBack ? (
          <BackBtn onClick={onBack}>
            <Icons name="chevron-left" size="lg" />
          </BackBtn>
        ) : (
          <LogoLink as={Link} to="/">
            <LogoIcons>
              <Icons name="trending-up" size="lg" strokeWidth={2.5} />
            </LogoIcons>
          </LogoLink>
        )}
      </Left>

      {title && <Title>{title}</Title>}

      <Right>
        {rightAction}
        {showActions && <AccountMenu />}
      </Right>
    </Header>
  );
}

export default MobileHeader;
