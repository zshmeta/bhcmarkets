import { Link } from 'react-router-dom';
import { Icon } from '../../components/DONE/Icon';
import { AccountMenu } from './AccountMenu';
import {
  Header,
  Left,
  Right,
  LogoLink,
  LogoIcon,
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

export function MobileHeader({
  title,
  showBack = false,
  onBack,
  showActions = true,
  rightAction,
}: MobileHeaderProps) {
  return (
    <Header>
      <Left>
        {showBack ? (
          <BackBtn onClick={onBack}>
            <Icon name="chevron-left" size="lg" />
          </BackBtn>
        ) : (
          <LogoLink as={Link} to="/">
            <LogoIcon>
              <Icon name="trending-up" size="lg" strokeWidth={2.5} />
            </LogoIcon>
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
