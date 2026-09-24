import { serverEnv } from '../config/env.js';
import type { ProductDraft, VisionResult } from './types.js';

export class VisionError extends Error {}

const SYSTEM_PROMPT = `Eres un asistente de inventario para una tienda de barrio. Recibes la FOTO de un producto y devuelves sus datos para darlo de alta en el catálogo.
REGLAS:
1. Describe solo lo que se ve en la imagen. No inventes marcas, precios ni fechas que no aparezcan.
2. Si un dato no es visible, estima con prudencia o usa el valor por defecto indicado.
3. Responde en español.
4. La fecha de caducidad solo si es legible; formato YYYY-MM-DD.
5. Devuelve EXCLUSIVAMENTE JSON válido con esta forma exacta:
{"name":"string","description":"string","category":"string","price":0,"stock":1,"reorderPoint":0,"expirationDate":"YYYY-MM-DD o null","aisle":"string o null","shelf":"string o null","confidence":0.0,"notes":"string"}
Valores por defecto: category "General", price 0, stock 1, reorderPoint 0, confidence 0..1.`;

const asText = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;

function asNumber(value: unknown): number | undefined {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value.replace(/[^0-9.\-]/g, '')) : NaN;
  return Number.isFinite(parsed) ? parsed : undefined;
}

function asInteger(value: unknown): number | undefined {
  const parsed = asNumber(value);
  return parsed === undefined ? undefined : Math.round(parsed);
}

function asDate(value: unknown): string | undefined {
  const text = asText(value);
  if (!text || !/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(Date.parse(`${text}T00:00:00.000Z`))) return undefined;
  return text;
}

/** Normaliza la respuesta del modelo a un borrador seguro para el alta. */
export function validateDraft(value: unknown): VisionResult {
  if (!value || typeof value !== 'object') throw new VisionError('Respuesta vacía.');
  const raw = value as Record<string, unknown>;
  const name = asText(raw.name);
  const category = asText(raw.category);
  if (!name) throw new VisionError('El modelo no reconoció el producto.');
  const price = Math.max(0, asNumber(raw.price) ?? 0);
  const stock = Math.max(0, asInteger(raw.stock) ?? 1);
  const reorderPoint = Math.max(0, asInteger(raw.reorderPoint) ?? 0);
  const confidenceRaw = asNumber(raw.confidence);
  const draft: ProductDraft = {
    name: name.slice(0, 180),
    description: (asText(raw.description) ?? '').slice(0, 500),
    category: (category ?? 'General').slice(0, 120),
    price: Math.round(price * 100) / 100,
    stock,
    reorderPoint,
    ...(asDate(raw.expirationDate) ? { expirationDate: asDate(raw.expirationDate) } : {}),
    ...(asText(raw.aisle) ? { aisle: asText(raw.aisle) } : {}),
    ...(asText(raw.shelf) ? { shelf: asText(raw.shelf) } : {}),
  };
  const confidence = confidenceRaw === undefined ? 0.6 : Math.min(1, Math.max(0, confidenceRaw));
  const notes = (asText(raw.notes) ?? 'Análisis completado.').slice(0, 300);
  return { draft, confidence, notes };
}

/** Llama al modelo de visión de DeepSeek con la imagen en base64. */
export async function askDeepSeekVision(imageDataUrl: string): Promise<VisionResult> {
  if (!serverEnv.deepseekEnabled || !serverEnv.deepseekApiKey) throw new VisionError('DeepSeek no está disponible.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), serverEnv.deepseekVisionTimeoutMs);
  const body = {
    model: serverEnv.deepseekVisionModel,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Analiza la foto y devuelve el JSON del producto.' },
          { type: 'image_url', image_url: { url: imageDataUrl, detail: 'auto' } },
        ],
      },
    ],
    thinking: { type: 'disabled' },
    response_format: { type: 'json_object' },
    max_tokens: serverEnv.deepseekVisionMaxTokens,
    temperature: 0.1,
  };
  try {
    const response = await fetch(`${serverEnv.deepseekBaseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${serverEnv.deepseekApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) throw new VisionError(`DeepSeek HTTP ${response.status}`);
    const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new VisionError('DeepSeek no devolvió contenido.');
    return validateDraft(JSON.parse(content));
  } catch (error) {
    if (error instanceof VisionError) throw error;
    throw new VisionError(error instanceof Error && error.name === 'AbortError' ? 'Tiempo agotado.' : 'Error de DeepSeek.');
  } finally {
    clearTimeout(timeout);
  }
}
