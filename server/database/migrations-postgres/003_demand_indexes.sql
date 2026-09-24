CREATE INDEX IF NOT EXISTS idx_product_requests_created_status ON product_requests(created_at, status);
CREATE INDEX IF NOT EXISTS idx_product_requests_created_product ON product_requests(created_at, matched_product_id);
