-- Stock is now tracked for every product type; rebuild it from purchases minus sales.
UPDATE "PosProduct" p
SET "stockQty" =
    COALESCE((SELECT SUM(e."quantity") FROM "PosStockEntry" e WHERE e."productId" = p."id"), 0)
  - COALESCE((SELECT SUM(l."quantity") FROM "PosOrderLine" l WHERE l."productId" = p."id"), 0)
  - COALESCE((
      SELECT SUM(sl."quantity")
      FROM "SaleOrderLine" sl
      JOIN "SaleOrder" so ON so."id" = sl."saleOrderId"
      WHERE sl."productId" = p."id" AND so."status" = 'CONFIRMED'
    ), 0);
