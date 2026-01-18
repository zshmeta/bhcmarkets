import { useState, useEffect } from 'react';
import { useAuthStore } from '@repo/sdk';
import { useI18n } from '@repo/bhcm-ui/i18n';
import { Icons } from '@repo/bhcm-ui/core';
import { Avatar, AuthOverlay } from '@repo/bhcm-ui/account';
import { useIsMobile } from '../hooks/useMediaQuery';
import { MobileAccountPage } from '../../../mobile/src/pages';
import {
  Container,
  Sidebar,
  SidebarHeader,
  SidebarTitle,
  Nav,
  NavItem,
  Content,
  Section,
  SectionHeader,
  SectionTitle,
  SectionDesc,
  Card,
  CardTitle,
  AvatarSection,
  FormGroup,
  FieldLabel,
  Input,
  Textarea,
  Select,
  FieldHint,
  FormActions,
  PrimaryBtn,
  OptionGroup,
  OptionBtn,
  InfoRow,
  InfoLabel,
  InfoValue,
  ErrorMessage,
  SuccessMessage,
  NotLoggedIn,
} from './SettingsPage.styles';

type SettingsSection = 'profile' | 'security' | 'preferences';

export const SettingsPage = () => {
  const isMobile = useIsMobile();
  const { t, locale, setLocale } = useI18n();
  const { user, preferences, updateProfile, updateAvatar, updatePreferences, changePassword } = useAuthStore();

  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');

  // Render mobile layout
  if (isMobile) {
    return <MobileAccountPage />;
  }

  // Profile form state
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [timezone, setTimezone] = useState(user?.timezone || 'UTC');
  const [profileSaved, setProfileSaved] = useState(false);

  // Password form state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Preferences state
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark' | 'system'>(preferences.theme);
  const [quoteAsset, setQuoteAsset] = useState<'USD' | 'BTC'>(preferences.quoteAsset);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setBio(user.bio || '');
      setTimezone(user.timezone || 'UTC');
    }
  }, [user]);

  useEffect(() => {
    setCurrentTheme(preferences.theme);
    setQuoteAsset(preferences.quoteAsset);
  }, [preferences]);

  const handleSaveProfile = () => {
    updateProfile({ displayName, bio, timezone });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const handleChangePassword = () => {
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword.length < 6) {
      setPasswordError(t.auth?.passwordTooShort || 'Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError(t.auth?.passwordMismatch || 'Passwords do not match');
      return;
    }

    const result = changePassword(oldPassword, newPassword);
    if (result.success) {
      setPasswordSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } else {
      setPasswordError(
        result.error === 'incorrectPassword'
          ? (locale === 'en-US' ? '当前密码错误' : 'Current password is incorrect')
          : (locale === 'en-US' ? '修改失败' : 'Failed to change password')
      );
    }
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    setCurrentTheme(theme);
    updatePreferences({ theme });

    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
    localStorage.setItem('theme', theme);
  };

  const handleLanguageChange = (lang: 'en-US' | 'en-US') => {
    setLocale(lang);
    updatePreferences({ language: lang });
  };

  const handleQuoteAssetChange = (asset: 'USD' | 'BTC') => {
    setQuoteAsset(asset);
    updatePreferences({ quoteAsset: asset });
  };

  return (
    <AuthOverlay variant="page" title="Account Settings" description="Sign in to manage your account">
      <Container>
        <Sidebar>
          <SidebarHeader>
            <SidebarTitle>{t.settings?.title || 'Settings'}</SidebarTitle>
          </SidebarHeader>
          <Nav>
            <NavItem $active={activeSection === 'profile'} onClick={() => setActiveSection('profile')}>
              <Icons name="user" size="sm" />
              <span>{t.settings?.categories?.profile || 'Profile'}</span>
            </NavItem>
            <NavItem $active={activeSection === 'security'} onClick={() => setActiveSection('security')}>
              <Icons name="lock" size="sm" />
              <span>{t.settings?.categories?.security || 'Security'}</span>
            </NavItem>
            <NavItem $active={activeSection === 'preferences'} onClick={() => setActiveSection('preferences')}>
              <Icons name="sliders" size="sm" />
              <span>{locale === 'en-US' ? '偏好设置' : 'Preferences'}</span>
            </NavItem>
          </Nav>
        </Sidebar>

        <Content>
          {/* Profile Section */}
          {activeSection === 'profile' && (
            <Section>
              <SectionHeader>
                <SectionTitle>{t.settings?.profile?.title || 'Profile'}</SectionTitle>
                <SectionDesc>{t.settings?.profile?.subtitle || 'Manage your account information'}</SectionDesc>
              </SectionHeader>

              <Card>
                <AvatarSection>
                  <FieldLabel>{t.settings?.profile?.avatar || 'Avatar'}</FieldLabel>
                  <Avatar
                    currentAvatar={user.avatar}
                    onAvatarChange={updateAvatar}
                    size="lg"
                  />
                </AvatarSection>

                <FormGroup>
                  <FieldLabel>{t.settings?.profile?.username || 'Username'}</FieldLabel>
                  <Input type="text" value={user.username} disabled />
                  <FieldHint>{locale === 'en-US' ? '用户名不可修改' : 'Username cannot be changed'}</FieldHint>
                </FormGroup>

                <FormGroup>
                  <FieldLabel>{locale === 'en-US' ? '显示名称' : 'Display Name'}</FieldLabel>
                  <Input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={locale === 'en-US' ? '输入昵称' : 'Enter display name'}
                  />
                </FormGroup>

                <FormGroup>
                  <FieldLabel>{locale === 'en-US' ? '个人简介' : 'Bio'}</FieldLabel>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder={locale === 'en-US' ? '介绍一下自己...' : 'Tell us about yourself...'}
                    rows={3}
                  />
                </FormGroup>

                <FormGroup>
                  <FieldLabel>{t.settings?.profile?.timezone || 'Timezone'}</FieldLabel>
                  <Select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                    <option value="UTC">UTC</option>
                    <option value="Asia/Shanghai">Asia/Shanghai (CST)</option>
                    <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                  </Select>
                </FormGroup>

                <FormGroup>
                  <FieldLabel>{t.settings?.profile?.email || 'Email'}</FieldLabel>
                  <Input type="text" value={user.email} disabled />
                </FormGroup>

                <FormActions>
                  <PrimaryBtn onClick={handleSaveProfile}>
                    {profileSaved ? (
                      <>
                        <Icons name="check" size="sm" />
                        <span>{t.settings?.common?.saved || 'Saved'}</span>
                      </>
                    ) : (
                      <span>{t.settings?.profile?.saveChanges || 'Save Changes'}</span>
                    )}
                  </PrimaryBtn>
                </FormActions>
              </Card>
            </Section>
          )}

          {/* Security Section */}
          {activeSection === 'security' && (
            <Section>
              <SectionHeader>
                <SectionTitle>{t.settings?.security?.title || 'Security'}</SectionTitle>
                <SectionDesc>{t.settings?.security?.subtitle || 'Protect your account'}</SectionDesc>
              </SectionHeader>

              <Card>
                <CardTitle>{t.settings?.security?.changePassword || 'Change Password'}</CardTitle>

                <FormGroup>
                  <FieldLabel>{locale === 'en-US' ? '当前密码' : 'Current Password'}</FieldLabel>
                  <Input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </FormGroup>

                <FormGroup>
                  <FieldLabel>{locale === 'en-US' ? '新密码' : 'New Password'}</FieldLabel>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </FormGroup>

                <FormGroup>
                  <FieldLabel>{t.auth?.confirmPassword || 'Confirm Password'}</FieldLabel>
                  <Input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </FormGroup>

                {passwordError && (
                  <ErrorMessage>
                    <Icons name="alert-circle" size="sm" />
                    <span>{passwordError}</span>
                  </ErrorMessage>
                )}

                {passwordSuccess && (
                  <SuccessMessage>
                    <Icons name="check-circle" size="sm" />
                    <span>{locale === 'en-US' ? '密码修改成功' : 'Password changed successfully'}</span>
                  </SuccessMessage>
                )}

                <FormActions>
                  <PrimaryBtn onClick={handleChangePassword}>
                    {t.settings?.security?.changePassword || 'Change Password'}
                  </PrimaryBtn>
                </FormActions>
              </Card>

              <Card>
                <CardTitle>{locale === 'en-US' ? '账户信息' : 'Account Information'}</CardTitle>
                <InfoRow>
                  <InfoLabel>{t.settings?.profile?.accountCreated || 'Account Created'}</InfoLabel>
                  <InfoValue>{new Date(user.createdAt).toLocaleDateString()}</InfoValue>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>{t.settings?.profile?.lastLogin || 'Last Login'}</InfoLabel>
                  <InfoValue>{new Date(user.lastLogin).toLocaleString()}</InfoValue>
                </InfoRow>
              </Card>
            </Section>
          )}

          {/* Preferences Section */}
          {activeSection === 'preferences' && (
            <Section>
              <SectionHeader>
                <SectionTitle>{locale === 'en-US' ? '偏好设置' : 'Preferences'}</SectionTitle>
                <SectionDesc>{locale === 'en-US' ? '自定义您的界面和交易体验' : 'Customize your interface and trading experience'}</SectionDesc>
              </SectionHeader>

              <Card>
                <CardTitle>{t.settings?.display?.theme || 'Theme'}</CardTitle>
                <OptionGroup>
                  <OptionBtn $selected={currentTheme === 'light'} onClick={() => handleThemeChange('light')}>
                    <Icons name="sun" size="sm" />
                    <span>{t.settings?.display?.light || 'Light'}</span>
                  </OptionBtn>
                  <OptionBtn $selected={currentTheme === 'dark'} onClick={() => handleThemeChange('dark')}>
                    <Icons name="moon" size="sm" />
                    <span>{t.settings?.display?.dark || 'Dark'}</span>
                  </OptionBtn>
                  <OptionBtn $selected={currentTheme === 'system'} onClick={() => handleThemeChange('system')}>
                    <Icons name="monitor" size="sm" />
                    <span>{t.settings?.display?.system || 'System'}</span>
                  </OptionBtn>
                </OptionGroup>
              </Card>

              <Card>
                <CardTitle>{t.settings?.display?.language || 'Language'}</CardTitle>
                <OptionGroup>
                  <OptionBtn $selected={locale === 'en-US'} onClick={() => handleLanguageChange('en-US')}>
                    <span>{t.language?.zh || '中文'}</span>
                  </OptionBtn>
                  <OptionBtn $selected={locale === 'en-US'} onClick={() => handleLanguageChange('en-US')}>
                    <span>{t.language?.en || 'English'}</span>
                  </OptionBtn>
                </OptionGroup>
              </Card>

              <Card>
                <CardTitle>{locale === 'en-US' ? '默认报价币种' : 'Default Quote Asset'}</CardTitle>
                <OptionGroup>
                  <OptionBtn $selected={quoteAsset === 'USD'} onClick={() => handleQuoteAssetChange('USD')}>
                    <span>USD</span>
                  </OptionBtn>
                  <OptionBtn $selected={quoteAsset === 'BTC'} onClick={() => handleQuoteAssetChange('BTC')}>
                    <span>BTC</span>
                  </OptionBtn>
                </OptionGroup>
              </Card>
            </Section>
          )}
        </Content>
      </Container>
    </AuthOverlay>
  );
}
