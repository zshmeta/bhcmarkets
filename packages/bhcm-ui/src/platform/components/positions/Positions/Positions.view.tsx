import {Icons}  from '../Icons';
import { TPSLForm } from './TPSLForm';
import type { Position, PositionPnL, BalanceInfo, PositionsTranslations } from './Positions.types';
import {
    Container,
    Header,
    HeaderLeft,
    HeaderTitle,
    HeaderStats,
    Stat,
    StatLabel,
    StatValue,
    ResetBtn,
    Body,
    TableContainer,
    Table,
    TableHead,
    TableBody,
    SymbolCell,
    Symbol,
    SideBadge,
    NumericCell,
    PnlCell,
    ActionsCell,
    ActionBtn,
    CloseBtn,
    Empty,
    BalanceRow,
    BalanceItem,
    BalanceAsset,
    BalanceValue,
    BalanceLocked,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalTitle,
    ModalBody,
    ModalMessage,
    ModalDetail,
    ModalActions,
    CancelBtn,
    ConfirmBtn,
    TPSLModalOverlay,
    TPSLModalContent,
    BlurMask,
} from './Positions.styles';

/* ═══════════════════════════════════════════════════════════
 * PURE PRESENTATIONAL COMPONENT
 * ═══════════════════════════════════════════════════════════
 * Positions.view.tsx - Dumb component, fully props-driven.
 */

export interface PositionsViewProps {
    /** List of active positions */
    positions: [string, Position][];
    /** Current symbol being viewed */
    currentSymbol: string;
    /** Current market price */
    currentPrice: number;
    /** Total unrealized P&L */
    totalPnL: number;
    /** USDT balance info */
    usdtBalance?: BalanceInfo;
    /** Translations */
    translations: PositionsTranslations;

    // Modal state
    confirmClose: string | null;
    tpslSymbol: string | null;

    // Calculations
    calculatePnL: (pos: Position) => PositionPnL;

    // Actions
    onSetConfirmClose: (symbol: string | null) => void;
    onSetTPSLSymbol: (symbol: string | null) => void;
    onClosePosition: () => void;
    // Privacy
    onTogglePrivacy: () => void;
    privacyMode: boolean;
    onSaveTPSL: (tp: string, sl: string) => void;
}

const PositionsView = ({
    positions,
    currentSymbol,
    currentPrice,
    totalPnL,
    usdtBalance,
    translations: t,
    confirmClose,
    tpslSymbol,
    calculatePnL,
    onSetConfirmClose,
    onSetTPSLSymbol,
    onClosePosition,
    onTogglePrivacy,
    privacyMode,
    onSaveTPSL,
}: PositionsViewProps) => {
    // Helper to mask values
    const renderValue = (val: React.ReactNode) => privacyMode ? <BlurMask>****</BlurMask> : val;

    return (
        <Container className="card">
            <Header>
                <HeaderLeft>
                    <HeaderTitle>{t.title}</HeaderTitle>
                    <HeaderStats>
                        <Stat>
                            <StatLabel>Total P&L</StatLabel>
                            <StatValue className={totalPnL >= 0 ? 'price-up' : 'price-down'}>
                                {renderValue(<>{totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)}</>)}
                            </StatValue>
                        </Stat>
                        <Stat>
                            <StatLabel>Open</StatLabel>
                            <StatValue>{positions.length}</StatValue>
                        </Stat>
                    </HeaderStats>
                </HeaderLeft>
                <ResetBtn onClick={onTogglePrivacy} title={privacyMode ? "Show balances" : "Hide balances"}>
                    <Icons name={privacyMode ? 'eye-off' : 'eye'} size="sm" />
                </ResetBtn>
            </Header>

            <Body>
                {positions.length === 0 ? (
                    <Empty>{t.noPositions}</Empty>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <tr>
                                    <th>{t.symbol}</th>
                                    <th>{t.quantity}</th>
                                    <th>{t.entryPrice}</th>
                                    <th>{t.marketPrice}</th>
                                    <th>{t.pnl}</th>
                                    <th>{t.actions}</th>
                                </tr>
                            </TableHead>
                            <TableBody>
                                {positions.map(([symbol, pos]) => {
                                    const { pnl, pnlPercent, hasPrice } = calculatePnL(pos);
                                    const isCurrentSymbol = symbol === currentSymbol;

                                    return (
                                        <tr key={symbol}>
                                            <td>
                                                <SymbolCell>
                                                    <Symbol>{symbol.replace('USDT', '')}</Symbol>
                                                    <SideBadge $long>LONG</SideBadge>
                                                </SymbolCell>
                                            </td>
                                            <NumericCell>{renderValue(parseFloat(pos.quantity).toFixed(4))}</NumericCell>
                                            <NumericCell>{renderValue(parseFloat(pos.avgEntryPrice).toFixed(2))}</NumericCell>
                                            <NumericCell>
                                                {isCurrentSymbol && currentPrice > 0 ? currentPrice.toFixed(2) : '—'}
                                            </NumericCell>
                                            <PnlCell
                                                $positive={pnl !== null && pnl >= 0}
                                                $negative={pnl !== null && pnl < 0}
                                                $pending={!hasPrice}
                                            >
                                                {hasPrice && pnl !== null ? (
                                                    renderValue(
                                                        <>
                                                            {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
                                                            <span style={{ opacity: 0.7, marginLeft: 4 }}>
                                                                ({pnlPercent?.toFixed(2)}%)
                                                            </span>
                                                        </>
                                                    )
                                                ) : (
                                                    '—'
                                                )}
                                            </PnlCell>
                                            <ActionsCell>
                                                <ActionBtn onClick={() => onSetTPSLSymbol(symbol)}>
                                                    <Icons name="target" size="xs" />
                                                    TP/SL
                                                </ActionBtn>
                                                <CloseBtn onClick={() => onSetConfirmClose(symbol)}>
                                                    <Icons name="x" size="xs" />
                                                    Close
                                                </CloseBtn>
                                            </ActionsCell>
                                        </tr>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Body>

            {usdtBalance && (
                <BalanceRow>
                    <BalanceItem>
                        <BalanceAsset>USDT</BalanceAsset>
                        <BalanceValue className="tabular-nums">{renderValue(parseFloat(usdtBalance.available).toFixed(2))}</BalanceValue>
                        <BalanceLocked>(Locked: {renderValue(parseFloat(usdtBalance.locked).toFixed(2))})</BalanceLocked>
                    </BalanceItem>
                </BalanceRow>
            )}

            {/* Close Confirmation Modal */}
            {confirmClose && (
                <ModalOverlay onClick={() => onSetConfirmClose(null)}>
                    <ModalContent onClick={(e) => e.stopPropagation()}>
                        <ModalHeader>
                            <Icons name="alert-triangle" size="sm" className="text-warning" />
                            <ModalTitle>Close Position</ModalTitle>
                        </ModalHeader>
                        <ModalBody>
                            <ModalMessage>Are you sure you want to close this position?</ModalMessage>
                            <ModalDetail>{confirmClose}</ModalDetail>
                        </ModalBody>
                        <ModalActions>
                            <CancelBtn onClick={() => onSetConfirmClose(null)}>Cancel</CancelBtn>
                            <ConfirmBtn onClick={onClosePosition}>Close Position</ConfirmBtn>
                        </ModalActions>
                    </ModalContent>
                </ModalOverlay>
            )}

            {/* TP/SL Modal */}
            {tpslSymbol && (
                <TPSLModalOverlay onClick={() => onSetTPSLSymbol(null)}>
                    <TPSLModalContent onClick={(e) => e.stopPropagation()}>
                        <TPSLForm
                            symbol={tpslSymbol}
                            currentPrice={currentPrice}
                            avgEntryPrice={0}
                            quantity="0"
                            translations={t.tpsl}
                            onClose={() => onSetTPSLSymbol(null)}
                            onSave={onSaveTPSL}
                        />
                    </TPSLModalContent>
                </TPSLModalOverlay>
            )}
        </Container>
    );
}

export default PositionsView;
