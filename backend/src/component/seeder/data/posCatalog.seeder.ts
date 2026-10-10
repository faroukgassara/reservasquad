import * as fs from 'fs';
import * as path from 'path';
import { EPosProductType, ESubscriptionUnit, PrismaClient } from 'src/generated/prisma/client';

const CATEGORIES_TO_CREATE = [
  { name: 'Bibliotheque', sortOrder: 1 },
  { name: 'Buvette', sortOrder: 2 },
  { name: 'Impression', sortOrder: 3 },
  { name: 'Fourniture', sortOrder: 4 },
  { name: 'Services & Divers', sortOrder: 5 },
];

const SUBSCRIPTION_METADATA: Record<string, { duration: number; unit: ESubscriptionUnit }> = {
  'Abonnement 10 Mois journée complet': { duration: 10, unit: ESubscriptionUnit.MONTH },
  'Abonnement 14 J journée complet': { duration: 14, unit: ESubscriptionUnit.DAY },
  'Abonnement 2 Mois Journée Complet': { duration: 2, unit: ESubscriptionUnit.MONTH },
  'Abonnement 30 J journée complet': { duration: 30, unit: ESubscriptionUnit.DAY },
  'Abonnement 6 Mois journée complet': { duration: 6, unit: ESubscriptionUnit.MONTH },
  'Abonnement 7 J Demi-journée': { duration: 7, unit: ESubscriptionUnit.DAY },
  'Abonnement 7 J journée complet': { duration: 7, unit: ESubscriptionUnit.DAY },
  'Abonnement 90 J journée complet': { duration: 90, unit: ESubscriptionUnit.DAY },
  'Abonnement Demi-Journée (JOUR)': { duration: 1, unit: ESubscriptionUnit.DAY },
  'Abonnement Demi-Journée (Nuit)': { duration: 1, unit: ESubscriptionUnit.DAY },
  'Abonnement Journée Complet': { duration: 1, unit: ESubscriptionUnit.DAY },
  'Abonnement Journée Complet été': { duration: 1, unit: ESubscriptionUnit.DAY },
  'Pack Bronze': { duration: 1, unit: ESubscriptionUnit.YEAR },
  'Pack Silver': { duration: 1, unit: ESubscriptionUnit.YEAR },
  'Pack Gold': { duration: 1, unit: ESubscriptionUnit.YEAR },
};

function parseCsv(text: string) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(',').map((h) => h.replace(/^"|"$/g, '').trim());
  const rows: any[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols: string[] = [];
    let cur = '';
    let inQ = false;
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch === '"') {
        inQ = !inQ;
      } else if (ch === ',' && !inQ) {
        cols.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    cols.push(cur);
    const obj: any = {};
    headers.forEach((h, idx) => {
      let val = cols[idx];
      if (val !== undefined) {
        val = val.trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      }
      obj[h] = val;
    });
    rows.push(obj);
  }
  return rows;
}

export const seedPosCatalog = async (prisma: PrismaClient) => {
  console.log('--- Upserting Categories ---');
  const categoryMap = new Map<string, string>();

  for (const cat of CATEGORIES_TO_CREATE) {
    const existing = await prisma.posCategory.findFirst({
      where: { name: cat.name },
    });
    if (existing) {
      categoryMap.set(cat.name, existing.id);
    } else {
      const created = await prisma.posCategory.create({
        data: {
          name: cat.name,
          sortOrder: cat.sortOrder,
        },
      });
      categoryMap.set(cat.name, created.id);
      console.log(`Created category: ${cat.name} (${created.id})`);
    }
  }

  console.log('--- Loading and Upserting Products from products.csv ---');
  const csvPath = path.join(__dirname, 'products.csv');
  if (!fs.existsSync(csvPath)) {
    throw new Error(`Products CSV file not found at ${csvPath}`);
  }

  const csvText = fs.readFileSync(csvPath, 'utf8');
  const csvRows = parseCsv(csvText);

  const dbProducts = await prisma.posProduct.findMany();
  const dbByName = new Map<string, typeof dbProducts[0]>();
  for (const p of dbProducts) {
    dbByName.set(p.name, p);
  }

  let updatedCount = 0;
  let createdCount = 0;

  for (const row of csvRows) {
    const name = row.nom_produit.trim();
    const price = parseFloat(row.prix_vente) || 0;
    const type =
      row.type_article === 'product'
        ? EPosProductType.STOCKABLE
        : EPosProductType.CONSUMABLE;
    const availableInPos = row.disponible_en_caisse.toLowerCase() === 'true';
    const catName =
      row.categorie_pos && row.categorie_pos !== 'NULL'
        ? row.categorie_pos.trim()
        : null;
    const categoryId = catName ? categoryMap.get(catName) ?? null : null;
    const createdAt = row.date_creation
      ? new Date(row.date_creation)
      : new Date();

    const subMeta = SUBSCRIPTION_METADATA[name] ?? null;

    let existing = dbByName.get(name);
    if (!existing) {
      existing = dbProducts.find(
        (p) => p.name.toLowerCase() === name.toLowerCase(),
      );
    }

    if (existing) {
      await prisma.posProduct.update({
        where: { id: existing.id },
        data: {
          name,
          price,
          type,
          availableInPos,
          categoryId,
          createdAt,
          subscriptionDuration: subMeta
            ? subMeta.duration
            : existing.subscriptionDuration ?? null,
          subscriptionUnit: subMeta
            ? subMeta.unit
            : existing.subscriptionUnit ?? null,
        },
      });
      updatedCount++;
    } else {
      const created = await prisma.posProduct.create({
        data: {
          name,
          price,
          type,
          availableInPos,
          categoryId,
          createdAt,
          subscriptionDuration: subMeta?.duration ?? null,
          subscriptionUnit: subMeta?.unit ?? null,
        },
      });
      dbByName.set(name, created);
      createdCount++;
    }
  }

  console.log(
    `Successfully synced catalog: ${updatedCount} products updated, ${createdCount} created. Total products: ${await prisma.posProduct.count()}`,
  );
};
