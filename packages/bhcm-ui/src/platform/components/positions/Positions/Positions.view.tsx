import { Icons } from '../Icons';
import { TPSLForm } from './TPSLForm';
import type { Position, PositionPnL, BalanceInfo, PositionsTranslations } from '@repo/sdk';
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
    /** USD balance info */
    USDBalance?: BalanceInfo;
    /** Translations */
    translations: PositionsTranslations;

    // Modal state
    confirmClose: string | null;
    tpslSymbol: string | null;

    // Calculations
    calculatePnL: (pos: Position) => PositionPnL;
    getPrice: (symbol: string) => number;

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
    USDBalance,
    translations: t,
    confirmClose,
    tpslSymbol,
    calculatePnL,
    getPrice,
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
                                    const price = getPrice(symbol);

                                    return (
                                        <tr key={symbol}>
                                            <td>
                                                <SymbolCell>
                                                    <Symbol>{symbol.replace('USD', '')}</Symbol>
                                                    <SideBadge $long>LONG</SideBadge>
                                                </SymbolCell>
                                            </td>
                                            <NumericCell>{renderValue(parseFloat(pos.quantity).toFixed(4))}</NumericCell>
                                            <NumericCell>{renderValue(parseFloat(pos.avgEntryPrice).toFixed(2))}</NumericCell>
                                            <NumericCell>
                                                {price > 0 ? price.toFixed(2) : '—'}
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

            {USDBalance && (
                <BalanceRow>
                    <BalanceItem>
                        <BalanceAsset>USD</BalanceAsset>
                        <BalanceValue className="tabular-nums">{renderValue(parseFloat(USDBalance.available).toFixed(2))}</BalanceValue>
                        <BalanceLocked>(Locked: {renderValue(parseFloat(USDBalance.locked).toFixed(2))})</BalanceLocked>
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
                        {(() => {
                            const activePosition = positions.find(([s]) => s === tpslSymbol)?.[1];
                            return (
                                <TPSLForm
                                    symbol={tpslSymbol}
                                    currentPrice={getPrice(tpslSymbol)}
                                    avgEntryPrice={activePosition ? parseFloat(activePosition.avgEntryPrice) : 0}
                                    quantity={activePosition ? activePosition.quantity : "0"}
                                    translations={t.tpsl}
                                    onClose={() => onSetTPSLSymbol(null)}
                                    onSave={onSaveTPSL}
                                />
                            );
                        })()}
                    </TPSLModalContent>
                </TPSLModalOverlay>
            )}
        </Container>
    );
}

export { PositionsView };
