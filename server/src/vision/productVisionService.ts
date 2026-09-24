import { serverEnv } from '../config/env.js';
import { askDeepSeekVision } from './deepseekVision.js';
import { analyzeLocal } from './localVision.js';
import type { ProductAnalysis } from './types.js';

const MAX_IMAGE_CHARS = 8_000_000; // ~6 MB de imagen codificada en base64.

function validateImage(image: unknown): string {
  if (typeof image !== 'string' || image.length === 0) throw Object.assign(new Error('La foto del producto es obligatoria.'), { statusCode: 400 });
  if (!/^data:image\/(jpeg|png|webp|gif);base64,/i.test(image)) throw Object.assign(new Error('La foto debe ser una imagen JPEG, PNG, WebP o GIF.'), { statusCode: 400 });
  if (image.length > MAX_IMAGE_CHARS) throw Object.assign(new Error('La foto es demasiado grande. Vuelve a intentarlo.'), { statusCode: 413 });
  return image;
}

/**
 * Analiza la foto de un producto con IA (DeepSeek visión) y, si falla,
 * cae al respaldo local. Nunca lanza por un fallo de la IA: siempre devuelve
 * un borrador para que la persona lo revise.
 */
export async function analyzeProductImage(image: unknown): Promise<ProductAnalysis> {
  const imageDataUrl = validateImage(image);
  const startedAt = Date.now();
  if (serverEnv.copilotMode === 'deepseek' && serverEnv.deepseekEnabled && serverEnv.deepseekApiKey) {
    try {
      const result = await askDeepSeekVision(imageDataUrl);
      console.log(JSON.stringify({ event: 'product-vision', provider: 'deepseek', fallbackUsed: false, durationMs: Date.now() - startedAt }));
      return { ...result, provider: 'deepseek', fallbackUsed: false, durationMs: Date.now() - startedAt };
    } catch (error) {
      console.warn(JSON.stringify({ event: 'product-vision', provider: 'deepseek', fallbackUsed: true, durationMs: Date.now() - startedAt, error: error instanceof Error ? error.message : 'unknown' }));
    }
  }
  const result = analyzeLocal();
  console.log(JSON.stringify({ event: 'product-vision', provider: 'local', fallbackUsed: serverEnv.copilotMode === 'deepseek', durationMs: Date.now() - startedAt }));
  return { ...result, provider: 'local', fallbackUsed: serverEnv.copilotMode === 'deepseek', durationMs: Date.now() - startedAt };
}
