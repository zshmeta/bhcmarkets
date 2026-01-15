import { useNetworkHealth } from './useNetworkHealth';
import { NetworkHealthView } from './NetworkHealth.view';

/* ═══════════════════════════════════════════════════════════
 * DIAGNOSTICS DRAWER CONTAINER
 * ═══════════════════════════════════════════════════════════
 */

interface NetworkHealthProps {
  isOpen: boolean;
  onClose: () => void;
}

const NetworkHealth = ({ isOpen, onClose }: NetworkHealthProps) => {
  const hookData = useNetworkHealth(onClose);

  return (
    <NetworkHealthView
      isOpen={isOpen}
      onClose={onClose}
      {...hookData}
    />
  );
}

export default NetworkHealth;
