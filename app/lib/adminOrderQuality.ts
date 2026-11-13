/** Shared data-quality rules for displayed admin order values. No records are rewritten. */
export const validOrderAmount = (value: number) => Number.isFinite(value) && value >= 0 && Number.isSafeInteger(Math.round(value * 100));
export const validOrderItem = (item: { price: number; qty: number }) => validOrderAmount(item.price) && Number.isSafeInteger(item.qty) && item.qty > 0 && Number.isSafeInteger(Math.round(item.price * 100) * item.qty);
export function uniqueAdminOrders<T extends { id?: string }>(orders: readonly T[]): T[] {
  const named = new Map<string, T>();
  const unnamed: T[] = [];
  for (const order of orders) { if (order.id) named.set(order.id, order); else unnamed.push(order); }
  return [...named.values(), ...unnamed];
}
export function auditAdminOrders(orders: readonly { id?: string; createdAt: number; total: number; items?: readonly { price: number; qty: number }[] }[]) {
  const unique = uniqueAdminOrders(orders);
  return { duplicates: orders.length - unique.length,
    invalidDates: unique.filter(order => !Number.isFinite(order.createdAt) || order.createdAt <= 0).length,
    invalidAmounts: unique.filter(order => !validOrderAmount(order.total)).length,
    invalidItems: unique.reduce((sum, order) => sum + (order.items?.filter(item => !validOrderItem(item)).length || 0), 0) };
}
