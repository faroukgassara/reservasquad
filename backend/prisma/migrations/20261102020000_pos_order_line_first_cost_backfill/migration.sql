-- Sales recorded while the product had no cost take the product's first purchase cost,
-- so historical margins stop being unknown. Sales already carrying a snapshot keep it.
UPDATE "PosOrderLine" AS pol
SET "unitCost" = first_cost."unitCost"
FROM (
  SELECT DISTINCT ON ("productId") "productId", "unitCost"
  FROM "PosStockEntry"
  WHERE "unitCost" > 0
  ORDER BY "productId", "createdAt" ASC, "id" ASC
) AS first_cost
WHERE pol."productId" = first_cost."productId"
  AND pol."unitCost" IS NULL;

-- Products without any purchase fall back to their current cost.
UPDATE "PosOrderLine" AS pol
SET "unitCost" = p."cost"
FROM "PosProduct" AS p
WHERE pol."productId" = p."id"
  AND pol."unitCost" IS NULL
  AND p."cost" > 0;
