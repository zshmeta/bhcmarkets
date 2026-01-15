import { useSymbolSelector } from './useSymbolSelector';
import { SymbolSelectorView } from './SymbolSelector.view';

/* ═══════════════════════════════════════════════════════════
 * SYMBOL SELECTOR CONTAINER
 * ═══════════════════════════════════════════════════════════
 * Smart component that connects the store via useSymbolSelector hook
 * to the pure SymbolSelectorView presentational component.
 */

const SymbolSelector = () => {
  const selectorProps = useSymbolSelector();

  return <SymbolSelectorView {...selectorProps} />;
}

export default SymbolSelector;
