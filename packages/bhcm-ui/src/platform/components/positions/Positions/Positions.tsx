import { usePositions } from './usePositions';
import { PositionsView } from './Positions.view';

/* ═══════════════════════════════════════════════════════════
 * POSITIONS CONTAINER
 * ═══════════════════════════════════════════════════════════
 * Smart component connecting store via usePositions hook
 * to the pure PositionsView presentational component.
 */

const Positions = () => {
    const {
        positionList,
        currentSymbol,
        currentPrice,
        totalPnL,
        USDBalance,
        translations,
        confirmClose,
        tpslSymbol,
        calculatePnL,
        getPrice,
        setConfirmClose,
        setTPSLSymbol,
        handleClosePosition,
        privacyMode,
        onTogglePrivacy,
    } = usePositions();

    // Placeholder for TPSL save - would need to call trading store
    const handleSaveTPSL = (tp: string, sl: string) => {
        console.log('Save TP/SL:', tp, sl);
    };

    return (
        <PositionsView
            positions={positionList}
            currentSymbol={currentSymbol}
            currentPrice={currentPrice}
            totalPnL={totalPnL}
            USDBalance={USDBalance}
            translations={translations}
            confirmClose={confirmClose}
            tpslSymbol={tpslSymbol}
            calculatePnL={calculatePnL}
            getPrice={getPrice}
            onSetConfirmClose={setConfirmClose}
            onSetTPSLSymbol={setTPSLSymbol}
            onClosePosition={handleClosePosition}
            privacyMode={privacyMode}
            onTogglePrivacy={onTogglePrivacy}
            onSaveTPSL={handleSaveTPSL}
        />
    );
}

export { Positions };

