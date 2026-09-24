-- Código QR asignado a cada producto del catálogo.
-- Se genera al dar de alta un producto y se usa como identificador escaneable.
ALTER TABLE products ADD COLUMN IF NOT EXISTS qr_code VARCHAR(180);

-- Rellena los productos existentes con un código derivado de su id.
UPDATE products
SET qr_code = 'CPF-' || upper(replace(id, '-', ''))
WHERE qr_code IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_qr_code ON products (qr_code);
