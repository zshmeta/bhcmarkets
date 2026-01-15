import {
    Container,
    InputGroup,
    SymbolInput,
    ConnectButton,
    QuickSelectRow,
    QuickButton,
} from './SymbolSelector.styles';

/* ═══════════════════════════════════════════════════════════
 * PURE PRESENTATIONAL COMPONENT
 * ═══════════════════════════════════════════════════════════
 * SymbolSelector.view.tsx - Dumb component with no store hooks.
 * All data and callbacks passed via props.
 */

/* ═══════════════════════════════════════════════════════════
 * VIEW PROPS INTERFACE
 * ═══════════════════════════════════════════════════════════
 */
export interface SymbolSelectorViewProps {
    /** Current input value */
    inputValue: string;
    /** Currently connected symbol */
    symbol: string;
    /** Whether connected */
    isConnected: boolean;
    /** Whether connecting */
    isConnecting: boolean;
    /** Handler for input change */
    onInputChange: (value: string) => void;
    /** Handler for connect action */
    onConnect: () => void;
    /** Handler for disconnect action */
    onDisconnect: () => void;
    /** Handler for quick select */
    onQuickSelect: (sym: string) => void;
    /** Handler for keydown */
    onKeyDown: (e: React.KeyboardEvent) => void;
    /** List of popular symbols */
    popularSymbols: string[];
    /** Translations */
    translations: SymbolSelectorTranslations;
}

import { SymbolSelectorTranslations } from './SymbolSelector.types';

/* ═══════════════════════════════════════════════════════════
 * MAIN VIEW COMPONENT
 * ═══════════════════════════════════════════════════════════
 */
const SymbolSelectorView = ({
    inputValue,
    symbol,
    isConnected,
    isConnecting,
    onInputChange,
    onConnect,
    onDisconnect,
    onQuickSelect,
    onKeyDown,
    popularSymbols,
    translations: t,
}: SymbolSelectorViewProps) => {
    return (
        <Container>
            {/* Input + Connect Button */}
            <InputGroup>
                <SymbolInput
                    type="text"
                    value={inputValue}
                    onChange={(e) => onInputChange(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder={t.placeholder}
                    disabled={isConnecting}
                />

                {!isConnected ? (
                    <ConnectButton
                        className="btn btn-primary"
                        onClick={onConnect}
                        disabled={isConnecting || !inputValue.trim()}
                    >
                        {isConnecting ? t.connecting : t.connect}
                    </ConnectButton>
                ) : (
                    <ConnectButton
                        className="btn btn-secondary"
                        onClick={onDisconnect}
                    >
                        {t.disconnect}
                    </ConnectButton>
                )}
            </InputGroup>

            {/* Quick Select Buttons */}
            <QuickSelectRow>
                {popularSymbols.map((sym) => (
                    <QuickButton
                        key={sym}
                        $active={sym === symbol && isConnected}
                        onClick={() => onQuickSelect(sym)}
                        disabled={isConnecting}
                    >
                        {sym.replace('USDT', '')}
                    </QuickButton>
                ))}
            </QuickSelectRow>
        </Container>
    );
}

export default SymbolSelectorView;
