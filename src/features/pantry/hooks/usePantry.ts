import { useEffect, useMemo, useState } from 'react';
import { readStorage, writeStorage } from '@/services/storage/localStorage';
import type { Product } from '@/types/domain';
const STORAGE_KEY = 'copiloto-pantry';
type PantryQuantities = Record<string, number>;
export function usePantry(products: Product[]) {
  const [quantities, setQuantities] = useState<PantryQuantities>(() => readStorage(STORAGE_KEY, {}));
  useEffect(() => writeStorage(STORAGE_KEY, quantities), [quantities]);
  const items = useMemo(() => products.filter((product) => quantities[product.id] > 0), [products, quantities]);
  const totalItems = Object.values(quantities).reduce((total, quantity) => total + quantity, 0);
  const setQuantity = (productId: string, quantity: number) => setQuantities((current) => { const next = { ...current }; if (quantity <= 0) delete next[productId]; else next[productId] = quantity; return next; });
  const add = (productId: string) => setQuantity(productId, (quantities[productId] ?? 0) + 1);
  const decrease = (productId: string) => setQuantity(productId, (quantities[productId] ?? 0) - 1);
  return { quantities, items, totalItems, add, decrease, setQuantity };
}
