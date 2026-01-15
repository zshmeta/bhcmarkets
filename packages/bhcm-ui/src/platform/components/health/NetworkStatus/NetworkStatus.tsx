import { useNetworkStatus } from './useNetworkStatus';
import { NetworkStatusView } from './NetworkStatus.view';
import { NetworkHealth } from '../NetworkHealth/NetworkHealth';

/* ═══════════════════════════════════════════════════════════
 * DATA CONFIDENCE BAR CONTAINER
 * ═══════════════════════════════════════════════════════════
 */

const NetworkStatus = () => {
  const { showDrawer, onCloseDrawer, ...viewProps } = useNetworkStatus();

  return (
    <>
      <NetworkStatusView {...viewProps} />
      <NetworkHealth isOpen={showDrawer} onClose={onCloseDrawer} />
    </>
  );
}

export default NetworkStatus;
