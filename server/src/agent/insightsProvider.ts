import { serverEnv } from '../config/env.js';
import type { InventoryInsight } from './types.js';

const SYSTEM_PROMPT = `Eres el agente de inventario de un pequeño comercio. Recibes hechos ya calculados por el sistema y tu trabajo es redactarlos como avisos claros para el dueño.
REGLAS:
1. Usa exclusivamente los hechos del JSON. Nunca inventes cifras ni productos.
2. Conserva EXACTAMENTE el campo id de cada aviso. No agregues ni elimines avisos.
3. No cambies inventarios ni afirmes que ejecutaste acciones.
4. Escribe en español sencillo y directo.
5. El título debe tener 1 o 2 palabras (idealmente el nombre corto del producto). El mensaje debe tener como máximo 10 palabras e incluir la cifra clave.
6. La acción sugerida puede ser más larga y concreta. Cuando aplique, incluye consejos de marketing: crear una promoción o destacar el producto en un punto de alta visibilidad.
7. Devuelve exclusivamente JSON válido con esta forma: {"insights":[{"id":"string","title":"string","message":"string","suggestedAction":"string"}]}.`;

const firstWords = (value: string, count: number) => value.trim().split(/\s+/).slice(0, count).join(' ');

function validate(value: unknown, base: InventoryInsight[]): InventoryInsight[] {
  if (!value || typeof value !== 'object') return base;
  const raw = (value as Record<string, unknown>).insights;
  if (!Array.isArray(raw)) return base;
  const byId = new Map<string, { title: string; message: string; suggestedAction?: string }>();
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const candidate = entry as Record<string, unknown>;
    if (typeof candidate.id !== 'string') continue;
    const title = typeof candidate.title === 'string' ? candidate.title.trim() : '';
    const message = typeof candidate.message === 'string' ? candidate.message.trim() : '';
    if (!title || !message) continue;
    byId.set(candidate.id, {
      title: firstWords(title, 2),
      message: firstWords(message, 10),
      ...(typeof candidate.suggestedAction === 'string' && candidate.suggestedAction.trim() ? { suggestedAction: candidate.suggestedAction.trim().slice(0, 500) } : {}),
    });
  }
  if (byId.size === 0) return base;
  return base.map((insight) => {
    const rewritten = byId.get(insight.id);
    if (!rewritten) return insight;
    return { ...insight, title: rewritten.title, message: rewritten.message, suggestedAction: rewritten.suggestedAction ?? insight.suggestedAction };
  });
}

export async function rewriteInsightsWithDeepSeek(base: InventoryInsight[]): Promise<InventoryInsight[]> {
  if (!serverEnv.deepseekEnabled || !serverEnv.deepseekApiKey) throw new Error('DeepSeek no está disponible.');
  if (base.length === 0) return base;
  const compact = base.map((insight) => ({
    id: insight.id,
    kind: insight.kind,
    severity: insight.severity,
    producto: insight.productName ?? null,
    hechos: insight.facts,
    datos: insight.metadata,
  }));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), serverEnv.deepseekInsightsTimeoutMs);
  try {
    const response = await fetch(`${serverEnv.deepseekBaseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${serverEnv.deepseekApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: serverEnv.deepseekModel,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'system', content: `HECHOS_CALCULADOS (fuente de verdad, no modificable): ${JSON.stringify(compact)}` },
          { role: 'user', content: 'Redacta los avisos de inventario a partir de estos hechos.' },
        ],
        thinking: { type: 'disabled' },
        response_format: { type: 'json_object' },
        max_tokens: serverEnv.deepseekInsightsMaxTokens,
        temperature: 0.2,
      }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`DeepSeek HTTP ${response.status}`);
    const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error('DeepSeek no devolvió contenido.');
    return validate(JSON.parse(content), base);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw new Error('Tiempo agotado al redactar avisos.');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
