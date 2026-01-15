import { useUserOverview } from './useUserOverview';
import {UserOverviewView} from './UserOverview.view';

/* ═══════════════════════════════════════════════════════════
 * ACCOUNT OVERVIEW PANEL CONTAINER
 * ═══════════════════════════════════════════════════════════
 * Smart component that connects the stores via useUserOverview hook
 * to the pure UserOverviewView presentational component.
 *
 * This thin layer enables:
 * - UserOverviewView to be reused anywhere without store dependencies
 * - Testing UserOverviewView in isolation with mock data
 * - Using UserOverviewView in Storybook without complex setup
 */

const UserOverview = () => {
  // All business logic extracted to hook
  const { isAuthenticated, user, account, equity, translations, navigation } = useUserOverview();

  // Render pure view with all data as props
  return (
    <UserOverviewView
      isAuthenticated={isAuthenticated}
      user={user}
      account={account}
      equity={equity}
      translations={translations}
      navigation={navigation}
    />
  );
}

export { UserOverview };

