// Contrato del análisis de imagen de producto (alta guiada por foto).
export type ProductDraft = {
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  reorderPoint: number;
  expirationDate?: string;
  aisle?: string;
  shelf?: string;
};

export type ProductAnalysis = {
  provider: 'deepseek' | 'local';
  fallbackUsed: boolean;
  durationMs: number;
  draft: ProductDraft;
  confidence: number;
  notes: string;
};

export type VisionResult = {
  draft: ProductDraft;
  confidence: number;
  notes: string;
};
