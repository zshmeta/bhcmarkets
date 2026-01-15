import {useOrderForm} from './useOrderForm';
import {OrderFormView} from './OrderForm.view';
import { useI18n } from '../../i18n';
import type { OrderSide } from '../../types/trading';

/* ═══════════════════════════════════════════════════════════
 * ORDER ENTRY CONTAINER
 * ═══════════════════════════════════════════════════════════
 * Smart component connecting store via useOrderForm hook
 * to the pure OrderFormView presentational component.
 */

interface OrderFormProps {
  priceFromLevel2Book?: string;
  sideFromLevel2Book?: OrderSide;
}

const OrderForm = ({
  priceFromLevel2Book,
  sideFromLevel2Book,
}: OrderFormProps) => {
  const { t } = useI18n();
  const hookData = useOrderForm(priceFromLevel2Book, sideFromLevel2Book);

  return (
    <OrderFormView
      form={hookData.form}
      baseAsset={hookData.baseAsset}
      quoteAsset={hookData.quoteAsset}
      balances={hookData.balances}
      dataConfidence={hookData.dataConfidence}
      focusMode={hookData.focusMode}
      estimated={hookData.estimated}
      isSubmitDisabled={hookData.isSubmitDisabled}
      showDegradedConfirm={hookData.showDegradedConfirm}
      showConfirmModal={hookData.showConfirmModal}
      translations={hookData.translations}
      priceInputRef={hookData.priceInputRef}
      quantityInputRef={hookData.quantityInputRef}
      tpInputRef={hookData.tpInputRef}
      slInputRef={hookData.slInputRef}
      onSideChange={hookData.setSide}
      onOrderCategoryChange={hookData.setOrderCategory}
      onTypeChange={hookData.setType}
      onPriceChange={hookData.setPrice}
      onQuantityChange={hookData.setQuantity}
      onTakeProfitPriceChange={hookData.setTakeProfitPrice}
      onStopLossPriceChange={hookData.setStopLossPrice}
      onTriggerPriceChange={hookData.setTriggerPrice}
      onLimitPriceChange={hookData.setLimitPrice}
      onTrailingTypeChange={hookData.setTrailingType}
      onTrailingValueChange={hookData.setTrailingValue}
      onTrailingActivationPriceChange={hookData.setTrailingActivationPrice}
      onQuantityPercentChange={hookData.setQuantityPercent}
      onShowTpChange={hookData.setShowTp}
      onShowSlChange={hookData.setShowSl}
      onCommentChange={hookData.setComment}
      onSetFromBestBid={hookData.setFromBestBid}
      onSetFromBestAsk={hookData.setFromBestAsk}
      onSetFromMid={hookData.setFromMid}
      onStepUp={hookData.handleStepUp}
      onStepDown={hookData.handleStepDown}
      onUpdateQuantityFromPercent={hookData.updateQuantityFromPercent}
      onInputFocus={hookData.handleInputFocus}
      onInputBlur={hookData.handleInputBlur}
      onSubmit={hookData.handleSubmit}
      onShowDegradedConfirm={hookData.setShowDegradedConfirm}
      onShowConfirmModal={hookData.setShowConfirmModal}
      onConfirmOrder={hookData.handleConfirmOrder}
      bestBidPrice={hookData.bestBidPrice}
      bestAskPrice={hookData.bestAskPrice}
      commonConfirm={t.common.confirm}
      commonCancel={t.common.cancel}
    />
  );
}

export { OrderForm };
