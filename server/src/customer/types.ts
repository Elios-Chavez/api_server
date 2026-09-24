import type { Product, Promotion } from '../types/domain.js';

export type CustomerSource = 'tablet' | 'kiosk' | 'web';
export type CustomerMessageRole = 'user' | 'assistant';
export type ProductRequestStatus = 'available' | 'unavailable' | 'not_found';

export type CustomerSession = { id: string; source: CustomerSource; startedAt: string };
export type CustomerMessage = { id: string; sessionId: string; role: CustomerMessageRole; content: string; createdAt: string };
export type ProductRequest = { id: string; sessionId: string; messageId: string; rawQuery: string; normalizedQuery: string; matchedProductId?: string; status: ProductRequestStatus; createdAt: string };
export type CustomerData = { sessions: CustomerSession[]; messages: CustomerMessage[]; productRequests: ProductRequest[] };
export type CustomerProduct = Pick<Product, 'id' | 'name' | 'category' | 'price' | 'imageUrl' | 'aisle' | 'shelf'> & { available: boolean };
export type CustomerContext = { products: CustomerProduct[]; promotions: Pick<Promotion, 'id' | 'title' | 'description'>[] };
export type CustomerRecommendation = CustomerProduct & { reason: string };
export type CustomerAnswer = { message: string; source: 'deepseek' | 'local'; productRequest?: { status: ProductRequestStatus; productName?: string }; recommendations?: CustomerRecommendation[] };
