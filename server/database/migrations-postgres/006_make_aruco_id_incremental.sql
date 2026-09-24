CREATE SEQUENCE IF NOT EXISTS inventory_aruco_id_seq;

ALTER TABLE inventory
ALTER COLUMN aruco_id SET DEFAULT nextval('inventory_aruco_id_seq');

WITH numbered_inventory AS (
  SELECT product_id, ROW_NUMBER() OVER (ORDER BY product_id) AS next_aruco_id
  FROM inventory
  WHERE aruco_id IS NULL
)
UPDATE inventory AS i
SET aruco_id = n.next_aruco_id
FROM numbered_inventory AS n
WHERE i.product_id = n.product_id;

SELECT setval(
  'inventory_aruco_id_seq',
  COALESCE((SELECT MAX(aruco_id) FROM inventory), 0) + 1,
  false
);

ALTER SEQUENCE inventory_aruco_id_seq OWNED BY inventory.aruco_id;

ALTER TABLE inventory
ALTER COLUMN aruco_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_aruco_id
ON inventory (aruco_id);
