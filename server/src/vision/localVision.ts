import type { VisionResult } from './types.js';

/**
 * Respaldo determinista cuando la IA no está disponible. No ve la imagen:
 * devuelve un borrador vacío y explicable para que la persona complete los
 * campos en la pantalla de revisión.
 */
export function analyzeLocal(): VisionResult {
  return {
    draft: {
      name: '',
      description: '',
      category: 'General',
      price: 0,
      stock: 1,
      reorderPoint: 0,
    },
    confidence: 0,
    notes: 'La IA no está disponible ahora. Completa los datos del producto manualmente antes de registrar.',
  };
}
