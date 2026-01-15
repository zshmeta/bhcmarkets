import useCurrentOrders from './useCurrentOrders';
import CurrentOrdersView from './CurrentOrders.view';
import { toast } from '../Toast';

/* ═══════════════════════════════════════════════════════════
 * OPEN ORDERS CONTAINER
 * ═══════════════════════════════════════════════════════════
 * Smart component that connects the store via useCurrentOrders hook
 * to the pure CurrentOrdersView presentational component.
 * 
 * This thin layer enables:
 * - CurrentOrdersView to be reused anywhere without store dependencies
 * - Testing CurrentOrdersView in isolation with mock data
 * - Using CurrentOrdersView in Storybook without complex setup
 */

const CurrentOrders = () => {
  // All business logic extracted to hook
  const { orders, hasOrders, cancelOrder, translations } = useCurrentOrders();

  // Wrap cancelOrder to show toast
  const handleCancel = (clientOrderId: string) => {
    cancelOrder(clientOrderId);
    toast.info(translations.orderCancelled);
  };

  // Render pure view with all data as props
  return (
    <CurrentOrdersView
      orders={orders}
      hasOrders={hasOrders}
      translations={translations}
      onCancel={handleCancel}
    />
  );
}

export default CurrentOrders;
