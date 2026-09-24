import { serverEnv } from '../config/env.js';
import { businessRepository } from '../repositories/businessRepository.js';
import { customerRepository } from '../repositories/customerRepository.js';
import { askCustomerDeepSeek } from './customerDeepSeek.js';
import type { CustomerAnswer, CustomerContext, CustomerSource, ProductRequestStatus } from './types.js';
import { emitOperationalEvent } from '../events/contracts.js';

const id = (prefix: string) => prefix + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const normalize = (value: string) => value.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, ' ');
const productIntent = (question: string) => { const normalizedQuestion = normalize(question); if (/\b(ventas?|vendieron|alertas?|inventario|compras?|resurt|digital|fisic)\b/i.test(normalizedQuestion)) return false; return /\b(hay|tienen|busco|producto|dispon|queda|venden|comprar|precio|cuesta)\b/i.test(normalizedQuestion); };

export class CustomerValidationError extends Error { public readonly statusCode = 400; }
export class CustomerNotFoundError extends Error { public readonly statusCode = 404; }

async function getCustomerContext(): Promise<CustomerContext> {
  const data = await businessRepository.read();
  return { products: data.products.map(({ id, name, category, price, stock, imageUrl, aisle, shelf }) => ({ id, name, category, price, available: stock > 0, ...(imageUrl ? { imageUrl } : {}), ...(aisle ? { aisle } : {}), ...(shelf ? { shelf } : {}) })), promotions: data.promotions.filter((promotion) => promotion.active).map(({ id, title, description }) => ({ id, title, description })) };
}

export async function createCustomerSession(source: CustomerSource = 'tablet') { const session = { id: id('customer-session'), source, startedAt: new Date().toISOString() }; return customerRepository.createSession(session); }
export async function getCustomerProducts() { return (await getCustomerContext()).products; }

function findProduct(question: string, context: CustomerContext) { const normalizedQuestion = normalize(question); const words = new Set(normalizedQuestion.split(/[^a-z0-9áéíóúüñ]+/i).filter((word) => word.length > 2)); return context.products.find((product) => normalizedQuestion.includes(normalize(product.name)) || normalize(product.name).split(' ').some((word) => word.length > 2 && words.has(word))); }
const recommendationIntent = (question: string) => /\b(recomiend|sugier|que comprar|qué comprar|algo para|opcion|opción|mejor|necesito)\b/i.test(normalize(question));
const location = (product: CustomerContext['products'][number]) => product.aisle && product.shelf ? 'Pasillo ' + product.aisle + ', anaquel ' + product.shelf : 'Ubicación pendiente de registrar';
function findRecommendations(question: string, context: CustomerContext, match: CustomerContext['products'][number] | undefined) { const normalizedQuestion = normalize(question); const words = normalizedQuestion.split(/[^a-z0-9áéíóúüñ]+/i).filter((word) => word.length > 3); const scored = context.products.filter((product) => product.available).map((product) => { const haystack = normalize(product.name) + ' ' + normalize(product.category); const categoryHint = (words.includes("limpiar") && haystack.includes("limpieza")) || (words.includes("beber") && haystack.includes("bebidas")) || (words.includes("cabello") && haystack.includes("cabello")); const score = (match?.id === product.id ? 8 : 0) + (categoryHint ? 5 : 0) + words.reduce((total, word) => total + (haystack.includes(word) || (word.length > 5 && haystack.includes(word.slice(0, word.length - 1))) ? 3 : 0), 0); return { product, score }; }).sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name)); const relevant = scored.filter((item) => item.score > 0); return (relevant.length ? relevant : scored).slice(0, 3).map(({ product }) => ({ ...product, reason: product.category })); }

function localAnswer(question: string, context: CustomerContext, match: CustomerContext['products'][number] | undefined, status: ProductRequestStatus | undefined): CustomerAnswer {
  const recommendations = recommendationIntent(question) ? findRecommendations(question, context, match) : [];
  if (recommendations.length) return { message: 'Te recomiendo ' + recommendations.map((product) => product.name).join(', ') + '. Revisa abajo el precio y dónde encontrar cada opción.', source: 'local', recommendations };
  if (match && status === 'available') return { message: 'Sí, tenemos ' + match.name + '. Su precio es $' + match.price.toFixed(2) + ' y está en ' + location(match) + '.', source: 'local', productRequest: { status, productName: match.name } };
  if (match && status === 'unavailable') return { message: 'Sí manejamos ' + match.name + ', pero actualmente aparece sin disponibilidad.', source: 'local', productRequest: { status, productName: match.name } };
  if (status === 'not_found') return { message: 'No encontré ese producto en el catálogo. Puedes preguntar en caja y te ayudamos a localizarlo.', source: 'local', productRequest: { status } };
  if (/promoc|oferta/i.test(question)) return { message: context.promotions[0] ? context.promotions[0].title + ': ' + context.promotions[0].description : 'En este momento no tengo promociones públicas para mostrarte.', source: 'local' };
  return { message: 'Puedo ayudarte a encontrar productos, recomendarte opciones y consultar promociones. ¿Qué estás buscando?', source: 'local' };
}

export async function askCustomer(input: { sessionId?: unknown; question?: unknown }) {
  if (!text(input.sessionId) || !text(input.question) || input.question.length > 400) throw new CustomerValidationError('La sesión y la pregunta son obligatorias.');
  const question = input.question.trim();
  const context = await getCustomerContext();
  const userMessage = await customerRepository.addMessage({ id: id('customer-message'), sessionId: input.sessionId, role: 'user', content: question });
  const match = findProduct(question, context);
  const shouldTrackRequest = Boolean(match) || productIntent(question);
  const status: ProductRequestStatus | undefined = shouldTrackRequest ? (match ? (match.available ? 'available' : 'unavailable') : 'not_found') : undefined;
  const request = status ? await customerRepository.createProductRequest({ id: id('product-request'), sessionId: input.sessionId, messageId: userMessage.id, rawQuery: question, matchedProductId: match?.id, status }) : undefined;
  let answer = localAnswer(question, context, match, status);
  if (!answer.recommendations?.length && !match && serverEnv.copilotMode === 'deepseek' && serverEnv.deepseekEnabled && serverEnv.deepseekApiKey) { try { answer = { ...(await askCustomerDeepSeek(question, context)), productRequest: answer.productRequest }; } catch { /* deterministic fallback */ } }
  const assistantMessage = await customerRepository.addMessage({ id: id('customer-message'), sessionId: input.sessionId, role: 'assistant', content: answer.message });
  if (request) emitOperationalEvent({ type: 'customer.product_query', timestamp: assistantMessage.createdAt, data: { sessionId: String(input.sessionId), question, status: request.status } });
  return { sessionId: input.sessionId, messageId: assistantMessage.id, answer, productRequest: request ? { status: request.status, normalizedQuery: request.normalizedQuery } : undefined };
}
