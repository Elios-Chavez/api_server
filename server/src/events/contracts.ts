export type OperationalEvent =
  | { type: 'sale.completed'; timestamp: string; data: { saleId: string; productId: string; quantity: number; unitPrice: number; total: number } }
  | { type: 'stock.physical_observed'; timestamp: string; data: { zoneId: string; sourceId: string; productId: string; quantity: number; observedAt: string } }
  | { type: 'customer.product_query'; timestamp: string; data: { sessionId: string; question: string; status?: 'available' | 'unavailable' | 'not_found' } }
  | { type: 'feedback.submitted'; timestamp: string; data: { feedbackId: string; mood: 'sad' | 'neutral' | 'happy' } }
  | { type: 'product.created'; timestamp: string; data: { productId: string; name: string; category: string } }
  | { type: 'owner.budget_available'; timestamp: string; data: { budget: number } };

export function emitOperationalEvent(event: OperationalEvent): void { console.log(JSON.stringify({ event: event.type, timestamp: event.timestamp, data: event.data })); }
