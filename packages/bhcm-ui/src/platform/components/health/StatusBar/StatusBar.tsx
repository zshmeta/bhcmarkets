import { useStatusBar } from './useStatusBar';
import { StatusBarView } from './StatusBar.view';

/* ═══════════════════════════════════════════════════════════
 * OBSERVABILITY PANEL CONTAINER
 * ═══════════════════════════════════════════════════════════
 */

const StatusBar = () => {
    const props = useStatusBar();
    return <StatusBarView {...props} />;
}

export default StatusBar;
