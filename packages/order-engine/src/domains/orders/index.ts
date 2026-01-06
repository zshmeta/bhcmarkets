/**
 * Orders Domain Exports
 */

export { OrderValidator, getOrderValidator, destroyOrderValidator, type ValidationConfig } from './order-validator.js';
export {
  saveOrder,
  updateOrderStatus,
  cancelOrder,
  getOpenOrders,
  getOrderById,
  getOrdersByAccount,
  saveTrades,
  getTradesByAccount,
  getRecentTrades,
} from './order-repository.js';
export { OrderManager, type OrderManagerConfig } from './order-manager.js';
