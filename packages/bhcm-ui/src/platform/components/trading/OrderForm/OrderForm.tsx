import { useOrderForm } from './useOrderForm';
import { OrderFormView } from './OrderForm.view';
import { useI18n } from '../../i18n';
import type { OrderSide } from '@repo/sdk';

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
  // useOrderForm now returns { data, actions }
  const { data, actions } = useOrderForm(priceFromLevel2Book, sideFromLevel2Book);

  return (
    <OrderFormView
      data={data}
      actions={actions}
    />
  );
}

export { OrderForm };
