import styled from 'styled-components';

/**
 * Mobile Account Page Styles (Binance-Style)
 * Token Reference (from tokens.css):
 * --bg-primary/secondary/tertiary → #0D1117 / #161B22 / #1C2128
 * --border-subtle → #262C36
 * --text-primary/secondary/tertiary → #E6EDF3 / #9AA5B1 / #6E7681
 * --accent → #3B82F6
 * --color-success/error → #3FB950 / #F85149
 */

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-primary, #0D1117);
`;

const HeaderBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  border: none;
  color: var(--text-secondary, #9AA5B1);
  cursor: pointer;
`;

const ScrollContent = styled.div`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 1.5rem;
`;

/* ═══════════════════════════════════════════════════════════
 * USER SECTION
 * ═══════════════════════════════════════════════════════════
 */
const UserSection = styled.div`
  padding: 1rem;
  background: linear-gradient(to bottom, var(--bg-secondary, #161B22) 0%, var(--bg-primary, #0D1117) 100%);
`;

const UserCard = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-secondary, #161B22);
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--border-subtle, #262C36);
`;

const AvatarWrapper = styled.div`
  position: relative;
`;

const Avatar = styled.img`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--bg-tertiary, #1C2128);
  object-fit: cover;
  border: 2px solid var(--bg-secondary, #161B22);
`;

const AvatarPlaceholder = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--bg-tertiary, #1C2128);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3B82F6;
  border: 2px solid var(--bg-secondary, #161B22);
`;

const VipBadge = styled.span`
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  background: #f3ba2f; /* Binance Gold */
  color: #000;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 50px;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const UserInfo = styled.div`
  flex: 1;
`;

const UserNameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2px;
`;

const UserName = styled.h2`
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary, #E6EDF3);
`;

const VerifyBadge = styled.span`
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 1px 6px;
  background: rgba(63, 185, 80, 0.15);
  color: var(--color-success, #3FB950);
  border-radius: 0.25rem;
  font-size: 10px;
  font-weight: 500;
`;

const Uid = styled.p`
  margin: 0;
  font-size: 0.75rem;
  color: var(--text-tertiary, #6E7681);
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
`;

const Arrow = styled.div`
  color: var(--text-muted, #484F58);
`;

/* ═══════════════════════════════════════════════════════════
 * SECTIONS
 * ═══════════════════════════════════════════════════════════
 */
const Section = styled.div`
  padding: 0 1rem 1rem;
`;

const SectionTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary, #9AA5B1);
  margin-bottom: 0.75rem;
  padding-left: 0.25rem;
`;

/* ═══════════════════════════════════════════════════════════
 * TOOLS GRID
 * ═══════════════════════════════════════════════════════════
 */
const ToolsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  background: var(--bg-secondary, #161B22);
  padding: 1rem;
  border-radius: 0.75rem;
  border: 1px solid var(--border-subtle, #262C36);
`;

const ToolBtn = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.5rem 0;
`;

const ToolIcons = styled.div`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary, #E6EDF3);
  background: var(--bg-tertiary, #1C2128);
  border-radius: 0.5rem;
  transition: all 0.15s ease-out;

  ${ToolBtn}:active & {
    transform: scale(0.9);
    background: var(--surface-hover, #262C36);
  }
`;

const ToolLabel = styled.span`
  font-size: 11px;
  color: var(--text-secondary, #9AA5B1);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
`;

/* ═══════════════════════════════════════════════════════════
 * LIST GROUPS
 * ═══════════════════════════════════════════════════════════
 */
const ListGroup = styled.div`
  background: var(--bg-secondary, #161B22);
  border-radius: 0.75rem;
  border: 1px solid var(--border-subtle, #262C36);
  overflow: hidden;
  margin-bottom: 1rem;
`;

const ListItem = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 1rem;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--border-subtle, #262C36);
  cursor: pointer;
  transition: background 0.15s ease-out;

  &:last-child {
    border-bottom: none;
  }

  &:active {
    background: var(--surface-hover, #262C36);
  }
`;

const ItemLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1rem;
  color: var(--text-primary, #E6EDF3);
  font-weight: 500;
`;

const ItemIcons = styled.div`
  color: var(--text-secondary, #9AA5B1);
`;

const ItemRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-tertiary, #6E7681);
`;

const ItemValue = styled.span`
  font-size: 0.875rem;
`;

/* ═══════════════════════════════════════════════════════════
 * LOGOUT BUTTON
 * ═══════════════════════════════════════════════════════════
 */
const LogoutBtn = styled.button`
  width: 100%;
  padding: 1rem;
  background: var(--bg-secondary, #161B22);
  border: 1px solid var(--border-subtle, #262C36);
  border-radius: 0.75rem;
  color: var(--color-error, #F85149);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 0.5rem;

  &:active {
    background: rgba(248, 81, 73, 0.15);
  }
`;

/* ═══════════════════════════════════════════════════════════
 * DRAWER
 * ═══════════════════════════════════════════════════════════
 */
const DrawerContent = styled.div`
  padding: 1rem;
  background: var(--bg-primary, #0D1117);
`;

const DrawerHint = styled.p`
  font-size: 0.75rem;
  color: var(--text-tertiary, #6E7681);
  text-align: center;
  margin-top: 1rem;
  padding: 0 1rem;
`;

export {
  Container,
  HeaderBtn,
  ScrollContent,
  UserSection,
  UserCard,
  AvatarWrapper,
  Avatar,
  AvatarPlaceholder,
  VipBadge,
  UserInfo,
  UserNameRow,
  UserName,
  VerifyBadge,
  Uid,
  Arrow,
  Section,
  SectionTitle,
  ToolsGrid,
  ToolBtn,
  ToolIcons,
  ToolLabel,
  ListGroup,
  ListItem,
  ItemLeft,
  ItemIcons,
  ItemRight,
  ItemValue,
  LogoutBtn,
  DrawerContent,
  DrawerHint,
};
