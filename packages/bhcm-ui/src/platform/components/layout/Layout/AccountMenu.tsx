import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useI18n } from '../../i18n';
import { Icons } from '../Icons';
import {
  Container,
  Trigger,
  Avatar,
  AvatarImg,
  LargeAvatar,
  Chevron,
  Dropdown,
  DropdownHeader,
  ProfileInfo,
  ProfileText,
  ProfileName,
  ProfileId,
  MenuItems,
  MenuSection,
  SectionLabel,
  MenuItem,
  Divider,
} from './AccountMenu.styles';

/**
 * ACCOUNT MENU
 * User account dropdown with profile info, settings, and logout.
 * Uses click-outside detection to close.
 */

export const AccountMenu: React.FC = () => {
  const { t } = useI18n();
  const { user, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Theme state with localStorage persistence
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') return stored;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const handleLogout = () => {
    setIsOpen(false);
    logout();
  };

  const isChinese = t.common?.login === '登录';

  return (
    <Container ref={menuRef}>
      <Trigger $active={isOpen} onClick={() => setIsOpen(!isOpen)}>
        <Avatar>
          {user.avatar ? (
            <AvatarImg src={user.avatar} alt="" />
          ) : (
            <Icons name="user" size="sm" strokeWidth={2} />
          )}
        </Avatar>
        <Chevron $rotated={isOpen}>
          <Icons name="chevron-down" size="xs" />
        </Chevron>
      </Trigger>

      {isOpen && (
        <Dropdown>
          <DropdownHeader>
            <ProfileInfo>
              <LargeAvatar>
                {user.avatar ? (
                  <AvatarImg src={user.avatar} alt="" />
                ) : (
                  <Icons name="user" size="md" />
                )}
              </LargeAvatar>
              <ProfileText>
                <ProfileName>{user.displayName || user.username}</ProfileName>
                <ProfileId>ID: {user.id}</ProfileId>
              </ProfileText>
            </ProfileInfo>
          </DropdownHeader>

          <MenuItems>
            <MenuSection>
              <SectionLabel>{isChinese ? '会话信息' : 'SESSION'}</SectionLabel>
              <MenuItem as="div">
                <Icons name="clock" size="xs" />
                <span>
                  {isChinese ? '上次登录: ' : 'Last login: '}
                  {new Date(user.lastLogin).toLocaleTimeString()}
                </span>
              </MenuItem>
            </MenuSection>

            <Divider />

            <MenuItem as={Link} to="/settings" onClick={() => setIsOpen(false)}>
              <Icons name="settings" size="xs" />
              <span>{t.accountOverview?.accountSettings || (isChinese ? '账户设置' : 'Account Settings')}</span>
            </MenuItem>

            <MenuItem as={Link} to="/wallet" onClick={() => setIsOpen(false)}>
              <Icons name="wallet" size="xs" />
              <span>{t.accountOverview?.viewWallet || (isChinese ? '钱包' : 'Wallet')}</span>
            </MenuItem>

            <MenuItem onClick={(e) => { e.preventDefault(); toggleTheme(); }}>
              <Icons name={theme === 'light' ? 'moon' : 'sun'} size="xs" />
              <span>
                {theme === 'light'
                  ? (isChinese ? '深色模式' : 'Dark Mode')
                  : (isChinese ? '日间模式' : 'Light Mode')}
              </span>
            </MenuItem>

            <Divider />

            <MenuItem $logout onClick={handleLogout}>
              <Icons name="log-out" size="xs" />
              <span>{isChinese ? '退出登录' : 'Sign Out'}</span>
            </MenuItem>
          </MenuItems>
        </Dropdown>
      )}
    </Container>
  );
};
