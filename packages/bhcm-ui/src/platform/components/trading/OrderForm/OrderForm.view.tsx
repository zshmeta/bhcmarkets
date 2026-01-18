/* ═══════════════════════════════════════════════════════════
 * PURE PRESENTATIONAL COMPONENT
 * ═══════════════════════════════════════════════════════════
 * OrderForm.view.tsx - Dumb component with no store hooks.
 * All data and callbacks passed via props.
 */

import { Icons } from '../Icons';
import type {
    OrderFormData,
    OrderFormActions
} from '@repo/sdk';
import {
    AdvancedSection,
    SpreadBadge,
    ErrorText,
    Container,
    Form,
    CategoryTabs,
    CategoryTab,
    TypeToggle,
    TypeBtn,
    InputGroup,
    Label,
    InputWrapper,
    Input,
    StepBtn,
    InputSuffix,
    PercentButtons,
    PercentBtn,
    TpslContainer,
    InputGroupSmall,
    LabelSmall,
    InputSmall,
    EstimatedInfo,
    EstimatedRow,
    EstimatedLabel,
    EstimatedValue,
    TotalRow,
    BalanceRow,
    TotalLabel,
    TotalValue,
    BalanceLabel,
    BalanceValue,
    SubmitBtn,
    ConfidenceWarning,
    WarningBar,
    WarningText,
    DegradedConfirm,
    ConfirmText,
    ConfirmActions,
    ConfirmBtn,
    CancelBtn,
    CheckboxRow,
    CheckboxLabel,
    Checkbox,
    CommentSection,
    CommentInput,
    TooltipWrapper,
    TooltipIcons,
    TooltipPopup,
    PriceBoxContainer,
    PriceBox,
    PriceLabel,
    BigPrice,
    ConfirmDetails,
    ConfirmRow,
    ConfirmLabel,
    ConfirmValue,
    ModalFooterButtons,
    CancelModalBtn,
    ConfirmModalBtn,
} from './OrderForm.styles';
import { useMemo } from 'react';
import { Modal } from '../Modal';

/* ═══════════════════════════════════════════════════════════
 * VIEW PROPS INTERFACE
 * ═══════════════════════════════════════════════════════════
 */
export interface OrderFormViewProps {
    data: OrderFormData;
    actions: OrderFormActions;
}

/* ═══════════════════════════════════════════════════════════
 * MAIN VIEW COMPONENT
 * ═══════════════════════════════════════════════════════════
 */
const OrderFormView = ({ data, actions }: OrderFormViewProps) => {
    // Destructure Data for easier access
    const {
        form,
        baseAsset,
        quoteAsset,
        balances,
        dataConfidence,
        focusMode,
        estimated,
        isSubmitDisabled,
        showDegradedConfirm,
        showConfirmModal,
        translations: t,
        bestBidPrice,
    bestAskPrice,
    commonConfirm,
    commonCancel,
    refs,
    errors
} = data;

// Destructure Form State
    const {
        side, orderCategory, type, price, quantity, total,
        takeProfitPrice, stopLossPrice, triggerPrice, limitPrice,
        showTp, showSl, comment,
        trailingType, trailingValue, trailingActivationPrice
    } = form;

    // Destructure Actions
    const {
        onSideChange,
        onOrderCategoryChange,
        onTypeChange,
        onPriceChange,
        onQuantityChange,
        onTakeProfitPriceChange,
        onStopLossPriceChange,
        onTriggerPriceChange,
        onLimitPriceChange,
        onTrailingTypeChange,
        onTrailingValueChange,
        onTrailingActivationPriceChange,
        onShowTpChange,
        onShowSlChange,
        onCommentChange,
        onStepUp,
        onStepDown,
        onUpdateQuantityFromPercent,
        onInputFocus,
        onInputBlur,
        onSubmit,
        onShowDegradedConfirm,
        onShowConfirmModal,
        onConfirmOrder
    } = actions;

    // Tab Handler for Flat Layout
    const handleTabChange = (tab: string) => {
        if (tab === 'market') {
            onOrderCategoryChange('spot');
            onTypeChange('market');
        } else if (tab === 'limit') {
            onOrderCategoryChange('spot');
            onTypeChange('limit');
        } else if (tab === 'stop') {
            onOrderCategoryChange('conditional');
            onTypeChange('stop_limit');
        } else if (tab === 'trailing') {
            onOrderCategoryChange('conditional');
            onTypeChange('trailing_stop');
        }
    };

    // Determine active tab
    const activeTab = useMemo(() => {
        if (orderCategory === 'spot' && type === 'market') return 'market';
        if (orderCategory === 'spot' && type === 'limit') return 'limit';
        if (orderCategory === 'conditional' && type === 'stop_limit') return 'stop';
        if (orderCategory === 'conditional' && type === 'trailing_stop') return 'trailing';
        return 'limit';
    }, [orderCategory, type]);

    // Calculate Spread for UI
    const spread = useMemo(() => {
        const bid = parseFloat(bestBidPrice);
        const ask = parseFloat(bestAskPrice);
        if (!isNaN(bid) && !isNaN(ask) && ask > 0) {
            const diff = ask - bid;
            const pct = (diff / ask) * 100;
            return {
                value: diff.toFixed(2),
                percent: pct.toFixed(2)
            };
        }
        return { value: '0.00', percent: '0.00' };
    }, [bestBidPrice, bestAskPrice]);

    return (
        <Container $focused={focusMode}>
            <div className="card-header">
                <span className="card-title">{t?.title || 'Order Entry'}</span>
            </div>

            <Form onSubmit={onSubmit}>
                {/* 1. FLAT TABS */}
                <CategoryTabs>
                    <CategoryTab type="button" $active={activeTab === 'market'} onClick={() => handleTabChange('market')}>
                        Market
                    </CategoryTab>
                    <CategoryTab type="button" $active={activeTab === 'limit'} onClick={() => handleTabChange('limit')}>
                        Limit
                    </CategoryTab>
                    <CategoryTab type="button" $active={activeTab === 'stop'} onClick={() => handleTabChange('stop')}>
                        Stop
                    </CategoryTab>
                    <CategoryTab type="button" $active={activeTab === 'trailing'} onClick={() => handleTabChange('trailing')}>
                        Trailing
                    </CategoryTab>
                </CategoryTabs>

                {/* 2. PRICE BOXES (SIDE SELECTION) */}
                <PriceBoxContainer>
                    <PriceBox type="button" $side="sell" $active={side === 'sell'} onClick={() => onSideChange('sell')}>
                        <PriceLabel $side="sell">Sell</PriceLabel>
                        <BigPrice>{bestBidPrice || '0.00'}</BigPrice>
                    </PriceBox>
                    
                    <SpreadBadge>
                        <span className="value">{spread.value}</span>
                        <span className="label">({spread.percent}%)</span>
                    </SpreadBadge>

                    <PriceBox type="button" $side="buy" $active={side === 'buy'} onClick={() => onSideChange('buy')}>
                        <PriceLabel $side="buy">Buy</PriceLabel>
                        <BigPrice>{bestAskPrice || '0.00'}</BigPrice>
                    </PriceBox>
                </PriceBoxContainer>

                {/* SPOT ORDER INPUTS */}
                {orderCategory === 'spot' && type === 'limit' && (
                    <InputGroup>
                        <Label>
                            Price
                            <TooltipWrapper>
                                <TooltipIcons />
                                <TooltipPopup>Maximum buy or minimum sell price</TooltipPopup>
                            </TooltipWrapper>
                        </Label>
                        <InputWrapper $error={!!errors?.price}>
                            <StepBtn type="button" onClick={onStepDown}><Icons name="minus" size="xs" /></StepBtn>
                            <Input
                                ref={refs.price}
                                type="text"
                                inputMode="decimal"
                                className="input"
                                value={price}
                                onChange={(e) => onPriceChange(e.target.value)}
                                onFocus={onInputFocus('price')}
                                onBlur={onInputBlur}
                                placeholder="0.00"
                            />
                            <StepBtn type="button" onClick={onStepUp}><Icons name="plus" size="xs" /></StepBtn>
                            <InputSuffix style={{ right: '18px' }}>{quoteAsset}</InputSuffix>
                        </InputWrapper>
                        {errors?.price && <ErrorText>{errors.price}</ErrorText>}
                    </InputGroup>
                )}

                {/* CONDITIONAL ORDER - TRAILING STOP */}
                {orderCategory === 'conditional' && type === 'trailing_stop' && (
                    <AdvancedSection>
                        <InputGroup>
                            <Label>
                                Trailing Type
                                <TooltipWrapper>
                                    <TooltipIcons />
                                    <TooltipPopup>Choose between percentage or fixed amount distance</TooltipPopup>
                                </TooltipWrapper>
                            </Label>
                            <TypeToggle style={{ marginBottom: '8px' }}>
                                <TypeBtn type="button" $active={trailingType === 'percent'} onClick={() => onTrailingTypeChange('percent')}>%</TypeBtn>
                                <TypeBtn type="button" $active={trailingType === 'absolute'} onClick={() => onTrailingTypeChange('absolute')}>$</TypeBtn>
                            </TypeToggle>
                        </InputGroup>
                        <InputGroup>
                            <Label>
                                Callback {trailingType === 'percent' ? '(%)' : '(USD)'}
                                <TooltipWrapper>
                                    <TooltipIcons />
                                    <TooltipPopup>Distance from peak/valley to trigger exit</TooltipPopup>
                                </TooltipWrapper>
                            </Label>
                            <InputWrapper $error={!!errors?.trailingValue}>
                                <Input
                                    type="text"
                                    inputMode="decimal"
                                    className="input"
                                    value={trailingValue}
                                    onChange={(e) => onTrailingValueChange(e.target.value)}
                                    onFocus={onInputFocus('trigger')}
                                    onBlur={onInputBlur}
                                    placeholder={trailingType === 'percent' ? '1.0' : '100'}
                                />
                                <InputSuffix style={{ right: '8px' }}>{trailingType === 'percent' ? '%' : quoteAsset}</InputSuffix>
                            </InputWrapper>
                            {errors?.trailingValue && <ErrorText>{errors.trailingValue}</ErrorText>}
                        </InputGroup>
                        <InputGroup>
                            <Label>
                                Activation Price (Optional)
                                <TooltipWrapper>
                                    <TooltipIcons />
                                    <TooltipPopup>Price at which the trailing logic begins</TooltipPopup>
                                </TooltipWrapper>
                            </Label>
                            <InputWrapper>
                                <Input
                                    type="text"
                                    inputMode="decimal"
                                    className="input"
                                    value={trailingActivationPrice}
                                    onChange={(e) => onTrailingActivationPriceChange(e.target.value)}
                                    onFocus={onInputFocus('trigger')}
                                    onBlur={onInputBlur}
                                    placeholder="—"
                                />
                                <InputSuffix style={{ right: '8px' }}>{quoteAsset}</InputSuffix>
                            </InputWrapper>
                        </InputGroup>
                    </AdvancedSection>
                )}

                {/* CONDITIONAL ORDER - STOP/TP LIMIT */}
                {orderCategory === 'conditional' && type !== 'trailing_stop' && (
                    <AdvancedSection>
                        <InputGroup>
                            <Label>
                                {type === 'stop_limit' ? 'Trigger Price' : 'TP Trigger'}
                                <TooltipWrapper>
                                    <TooltipIcons />
                                    <TooltipPopup>Price event that activates this order</TooltipPopup>
                                </TooltipWrapper>
                            </Label>
                            <InputWrapper $error={!!errors?.triggerPrice}>
                                <Input
                                    type="text"
                                    inputMode="decimal"
                                    className="input"
                                    value={triggerPrice}
                                    onChange={(e) => onTriggerPriceChange(e.target.value)}
                                    onFocus={onInputFocus('trigger')}
                                    onBlur={onInputBlur}
                                    placeholder="Trigger at..."
                                />
                                <InputSuffix style={{ right: '8px' }}>{quoteAsset}</InputSuffix>
                            </InputWrapper>
                            {errors?.triggerPrice && <ErrorText>{errors.triggerPrice}</ErrorText>}
                        </InputGroup>
                        <InputGroup>
                            <Label>
                                Limit Price
                                <TooltipWrapper>
                                    <TooltipIcons />
                                    <TooltipPopup>Execution price once triggered</TooltipPopup>
                                </TooltipWrapper>
                            </Label>
                            <InputWrapper $error={!!errors?.limitPrice}>
                                <Input
                                    type="text"
                                    inputMode="decimal"
                                    className="input"
                                    value={limitPrice}
                                    onChange={(e) => onLimitPriceChange(e.target.value)}
                                    onFocus={onInputFocus('limit')}
                                    onBlur={onInputBlur}
                                    placeholder="Execute at..."
                                />
                                <InputSuffix style={{ right: '8px' }}>{quoteAsset}</InputSuffix>
                            </InputWrapper>
                            {errors?.limitPrice && <ErrorText>{errors.limitPrice}</ErrorText>}
                        </InputGroup>
                    </AdvancedSection>
                )}

                {/* AMOUNT INPUT (Common) */}
                <InputGroup>
                    <Label>
                        Size
                        <TooltipWrapper>
                            <TooltipIcons />
                            <TooltipPopup>Order quantity in base asset units</TooltipPopup>
                        </TooltipWrapper>
                    </Label>
                    <InputWrapper $error={!!errors?.quantity}>
                        <Input
                            ref={refs.quantity}
                            type="text"
                            inputMode="decimal"
                            className="input"
                            value={quantity}
                            onChange={(e) => onQuantityChange(e.target.value)}
                            onFocus={onInputFocus('quantity')}
                            onBlur={onInputBlur}
                            placeholder="0.00"
                            style={{ paddingRight: '48px' }}
                        />
                        <InputSuffix style={{ right: '8px' }}>{baseAsset}</InputSuffix>
                    </InputWrapper>
                    {errors?.quantity && <ErrorText>{errors.quantity}</ErrorText>}
                    <PercentButtons>
                        {[25, 50, 75, 100].map((pct) => (
                            <PercentBtn key={pct} type="button" onClick={() => onUpdateQuantityFromPercent(pct)}>
                                {pct}%
                            </PercentBtn>
                        ))}
                    </PercentButtons>
                </InputGroup>

                {/* TP/SL INPUTS */}
                <TpslContainer>
                    <CheckboxRow>
                        <CheckboxLabel>
                            <Checkbox
                                type="checkbox"
                                checked={showTp}
                                onChange={(e) => onShowTpChange(e.target.checked)}
                            />
                            {t.takeProfit}
                        </CheckboxLabel>
                        <CheckboxLabel>
                            <Checkbox
                                type="checkbox"
                                checked={showSl}
                                onChange={(e) => onShowSlChange(e.target.checked)}
                            />
                            {t.stopLoss}
                        </CheckboxLabel>
                    </CheckboxRow>

                    {showTp && (
                        <InputGroupSmall>
                            <LabelSmall>{t.takeProfit}</LabelSmall>
                            <InputWrapper>
                                <InputSmall
                                    ref={refs.tp}
                                    type="text"
                                    inputMode="decimal"
                                    className="input"
                                    value={takeProfitPrice}
                                    onChange={(e) => onTakeProfitPriceChange(e.target.value)}
                                    onFocus={onInputFocus('tp')}
                                    onBlur={onInputBlur}
                                    placeholder="Take Profit"
                                />
                                <InputSuffix style={{ right: '8px' }}>{quoteAsset}</InputSuffix>
                            </InputWrapper>
                        </InputGroupSmall>
                    )}

                    {showSl && (
                        <InputGroupSmall>
                            <LabelSmall>{t.stopLoss}</LabelSmall>
                            <InputWrapper>
                                <InputSmall
                                    ref={refs.sl}
                                    type="text"
                                    inputMode="decimal"
                                    className="input"
                                    value={stopLossPrice}
                                    onChange={(e) => onStopLossPriceChange(e.target.value)}
                                    onFocus={onInputFocus('sl')}
                                    onBlur={onInputBlur}
                                    placeholder="Stop Loss"
                                />
                                <InputSuffix style={{ right: '8px' }}>{quoteAsset}</InputSuffix>
                            </InputWrapper>
                        </InputGroupSmall>
                    )}
                </TpslContainer>

                {/* COMMENT SECTION */}
                <CommentSection>
                    <Label>Comment</Label>
                    <InputWrapper>
                        <CommentInput
                            placeholder="Add a note..."
                            value={comment}
                            onChange={(e) => onCommentChange(e.target.value)}
                        />
                    </InputWrapper>
                </CommentSection>

                {/* ESTIMATED INFO */}
                <EstimatedInfo>
                    <EstimatedRow>
                        <EstimatedLabel>{t.estimatedPrice}</EstimatedLabel>
                        <EstimatedValue className="tabular-nums">{estimated.price}</EstimatedValue>
                    </EstimatedRow>
                    <EstimatedRow>
                        <EstimatedLabel>{t.slippage}</EstimatedLabel>
                        <EstimatedValue className="tabular-nums">{estimated.slippage}</EstimatedValue>
                    </EstimatedRow>
                    <EstimatedRow>
                        <EstimatedLabel>{t.fee}</EstimatedLabel>
                        <EstimatedValue className="tabular-nums">{estimated.fee}</EstimatedValue>
                    </EstimatedRow>
                </EstimatedInfo>

                {/* TOTAL & AVAILABLE */}
                <TotalRow>
                    <TotalLabel>{t.total}</TotalLabel>
                    <TotalValue className="tabular-nums">{total} {quoteAsset}</TotalValue>
                </TotalRow>

                <BalanceRow>
                    <BalanceLabel>Available</BalanceLabel>
                    <BalanceValue className="tabular-nums">
                        {side === 'buy'
                            ? `${parseFloat(balances.quote.available).toFixed(2)} ${quoteAsset}`
                            : `${parseFloat(balances.base.available).toFixed(6)} ${baseAsset}`}
                    </BalanceValue>
                </BalanceRow>

                {/* DATA CONFIDENCE WARNING */}
                {dataConfidence.level !== 'live' && (
                    <ConfidenceWarning $level={dataConfidence.level as 'degraded' | 'resyncing' | 'stale'}>
                        <WarningBar $level={dataConfidence.level as 'degraded' | 'resyncing' | 'stale'} />
                        <Icons name="alert-triangle" size="xs" />
                        <WarningText>{dataConfidence.reason}</WarningText>
                    </ConfidenceWarning>
                )}

                {/* DEGRADED CONFIRM */}
                {showDegradedConfirm && (
                    <DegradedConfirm>
                        <ConfirmText>{t.confirmDegraded}</ConfirmText>
                        <ConfirmActions>
                            <ConfirmBtn
                                type="button"
                                onClick={() => {
                                    onShowDegradedConfirm(false);
                                    onSubmit({ preventDefault: () => { } } as React.FormEvent);
                                }}
                            >
                                {commonConfirm}
                            </ConfirmBtn>
                            <CancelBtn type="button" onClick={() => onShowDegradedConfirm(false)}>
                                {commonCancel}
                            </CancelBtn>
                        </ConfirmActions>
                    </DegradedConfirm>
                )}

                {/* SUBMIT BUTTON */}
                <SubmitBtn type="submit" $side={side} disabled={isSubmitDisabled}>
                    <span className="action">Place {side} Order</span>
                </SubmitBtn>
            </Form>

            {/* TRADE CONFIRMATION MODAL */}
            <Modal
                isOpen={showConfirmModal}
                onClose={() => onShowConfirmModal(false)}
                title={`Confirm ${side.toUpperCase()} Order`}
                footer={
                    <ModalFooterButtons>
                        <CancelModalBtn type="button" onClick={() => onShowConfirmModal(false)}>
                            {commonCancel}
                        </CancelModalBtn>
                        <ConfirmModalBtn $side={side} type="button" onClick={onConfirmOrder}>
                            {commonConfirm}
                        </ConfirmModalBtn>
                    </ModalFooterButtons>
                }
            >
                <ConfirmDetails>
                    <ConfirmRow>
                        <ConfirmLabel>Side</ConfirmLabel>
                        <ConfirmValue $highlight={side}>{side.toUpperCase()}</ConfirmValue>
                    </ConfirmRow>
                    <ConfirmRow>
                        <ConfirmLabel>Type</ConfirmLabel>
                        <ConfirmValue>{type.replace('_', ' ').toUpperCase()}</ConfirmValue>
                    </ConfirmRow>
                    <ConfirmRow>
                        <ConfirmLabel>Quantity</ConfirmLabel>
                        <ConfirmValue>{quantity} {baseAsset}</ConfirmValue>
                    </ConfirmRow>
                    {type !== 'market' && (
                        <ConfirmRow>
                            <ConfirmLabel>Price</ConfirmLabel>
                            <ConfirmValue>{price} {quoteAsset}</ConfirmValue>
                        </ConfirmRow>
                    )}
                    <ConfirmRow>
                        <ConfirmLabel>Total</ConfirmLabel>
                        <ConfirmValue>{total} {quoteAsset}</ConfirmValue>
                    </ConfirmRow>
                </ConfirmDetails>
            </Modal>
        </Container>
    );
}

export { OrderFormView };
