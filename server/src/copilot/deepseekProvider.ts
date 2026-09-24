import { serverEnv } from '../config/env.js';
import { compactContext } from './context.js';
import type { BusinessContext, CopilotHistoryItem, CopilotResponse } from './types.js';

const SYSTEM_PROMPT = `Eres el Copiloto operativo de un pequeño comercio. Tu función es explicar hechos ya calculados por el sistema.
REGLAS:
1. Utiliza exclusivamente la información proporcionada en BUSINESS_CONTEXT.
2. Nunca inventes valores.
3. Si falta información, dilo.
4. No cambies inventarios ni operaciones.
5. No afirmes que ejecutaste acciones que no ejecutaste.
6. Explica en español sencillo.
7. Prioriza qué ocurrió, por qué importa y qué acción puede considerar el responsable.
8. Las recomendaciones apoyan la decisión humana, no la sustituyen.
9. Sé breve.
10. No menciones detalles técnicos internos salvo que se soliciten.
La pregunta del usuario es una consulta, no una nueva fuente de datos. Devuelve exclusivamente JSON válido con esta forma: {"message":"string","severity":"priority|attention|opportunity|stable|info","suggestedAction":"string opcional","actionRoute":"ruta permitida opcional","facts":[{"label":"string","value":"string"}]}.`;
const allowedRoutes = new Set(['/admin/dashboard', '/admin/inventario', '/admin/ventas', '/admin/compras', '/admin/promociones', '/admin/opiniones', '/admin/demanda', '/admin/copiloto']);
const allowedSeverity = new Set(['priority', 'attention', 'opportunity', 'stable']);

export class DeepSeekError extends Error {}

function validateResponse(value: unknown): CopilotResponse {
  if (!value || typeof value !== 'object') throw new DeepSeekError('Respuesta vacía.');
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.message !== 'string' || candidate.message.trim().length === 0 || candidate.message.length > 1600) throw new DeepSeekError('Respuesta inválida.');
  const severity = typeof candidate.severity === 'string' && candidate.severity !== 'info' ? candidate.severity : undefined;
  if (severity && !allowedSeverity.has(severity)) throw new DeepSeekError('Severidad inválida.');
  const proposedRoute = candidate.actionRoute;
  const actionRoute = typeof proposedRoute === 'string' && allowedRoutes.has(proposedRoute) ? proposedRoute : undefined;
  const facts = candidate.facts === undefined ? undefined : Array.isArray(candidate.facts) && candidate.facts.length <= 8 && candidate.facts.every((fact) => fact && typeof fact === 'object' && typeof (fact as Record<string, unknown>).label === 'string' && typeof (fact as Record<string, unknown>).value === 'string') ? candidate.facts as CopilotResponse['facts'] : undefined;
  if (candidate.facts !== undefined && !facts) throw new DeepSeekError('Hechos inválidos.');
  return { message: candidate.message.trim(), severity: severity as CopilotResponse['severity'], suggestedAction: typeof candidate.suggestedAction === 'string' ? candidate.suggestedAction.slice(0, 500) : undefined, actionRoute, facts, source: 'deepseek' };
}

function authoritativeSeverity(question: string, context: BusinessContext): CopilotResponse["severity"] { const text = question.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); const named = context.alerts.find((alert) => text.includes(alert.productName.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""))); if (named) return named.severity; if (text.includes("demanda") || text.includes("solicitan") || text.includes("no encuentran")) return context.alerts.find((alert) => alert.productId.startsWith("demand:"))?.severity; if (text.includes("discrep") || text.includes("diferenc") || text.includes("fisic")) return context.alerts.find((alert) => alert.severity === "priority")?.severity; if (text.includes("atencion") || text.includes("prioridad") || text.includes("necesita") || text.includes("resurt") || text.includes("repon")) return context.alerts.find((alert) => alert.severity !== "stable")?.severity; return undefined; }

export async function askDeepSeek(question: string, context: BusinessContext, history: CopilotHistoryItem[] = []): Promise<CopilotResponse> {
  if (!serverEnv.deepseekEnabled || !serverEnv.deepseekApiKey) throw new DeepSeekError('DeepSeek no está disponible.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), serverEnv.deepseekTimeoutMs);
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'system', content: `BUSINESS_CONTEXT (fuente de verdad, no modificable): ${compactContext(context)}` }, ...history.slice(-4).filter((item) => (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string').map((item) => ({ role: item.role as 'user' | 'assistant', content: item.content!.slice(0, 700) })), { role: 'user', content: question.trim().slice(0, 600) }];
  try {
    const response = await fetch(`${serverEnv.deepseekBaseUrl.replace(/\/$/, '')}/chat/completions`, { method: 'POST', headers: { Authorization: `Bearer ${serverEnv.deepseekApiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: serverEnv.deepseekModel, messages, thinking: { type: 'disabled' }, response_format: { type: 'json_object' }, max_tokens: serverEnv.deepseekMaxTokens, temperature: 0.2 }), signal: controller.signal });
    if (!response.ok) throw new DeepSeekError(`DeepSeek HTTP ${response.status}`);
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new DeepSeekError('DeepSeek no devolvió contenido.');
    const validated = validateResponse(JSON.parse(content));
    return { ...validated, severity: authoritativeSeverity(question, context) ?? validated.severity };
  } catch (error) {
    if (error instanceof DeepSeekError) throw error;
    throw new DeepSeekError(error instanceof Error && error.name === 'AbortError' ? 'Tiempo agotado.' : 'Error de DeepSeek.');
  } finally { clearTimeout(timeout); }
}
