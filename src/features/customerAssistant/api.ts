import { apiClient } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';

export type CustomerSession = { id: string; source: 'tablet' | 'kiosk' | 'web'; startedAt: string };
export type CustomerRecommendation = { id: string; name: string; category: string; price: number; available: boolean; imageUrl?: string; aisle?: string; shelf?: string; reason: string };
export type CustomerReply = { sessionId: string; messageId: string; answer: { message: string; source: 'deepseek' | 'local'; productRequest?: { status: 'available' | 'unavailable' | 'not_found'; productName?: string }; recommendations?: CustomerRecommendation[] } };

export function createCustomerSession() { return apiClient<CustomerSession>(endpoints.customerSessions, { method: 'POST', body: JSON.stringify({ source: 'tablet' }) }); }
export function askCustomer(sessionId: string, question: string) { return apiClient<CustomerReply>(endpoints.customerAssistantAsk, { method: 'POST', body: JSON.stringify({ sessionId, question }) }); }
