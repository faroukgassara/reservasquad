import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { EDiscountType, ESubscriptionStatus, ESubscriptionUnit, PrismaClient } from 'src/generated/prisma/client';
import { resolveCsvPath } from './resolveCsvPath';

interface CsvRow {
  reference_vente: string;
  client_nom: string;
  nom_du_produit: string;
  texte_ou_description_article: string | null;
  note: string | null;
  amount_total: string;
  email: string | null;
}

function parseCsv(text: string): CsvRow[] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField);
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && text[i + 1] === '\n') {
        i++;
      }
      currentRow.push(currentField);
      currentField = '';
      if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0] !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentField += char;
    }
  }

  if (currentField !== '' || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  if (rows.length === 0) return [];

  const headers = rows[0].map((h) => h.trim().replace(/^"|"$/g, ''));
  const records: CsvRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const obj: any = {};
    headers.forEach((h, idx) => {
      let val = r[idx] !== undefined ? r[idx].trim() : null;
      if (val === 'NULL' || val === undefined || val === '') val = null;
      obj[h] = val;
    });
    records.push(obj);
  }
  return records;
}

function parseDates(desc: string | null): { startDate: string; endDate: string } | null {
  if (!desc) return null;
  const clean = desc.replace(/\/\//g, '/').replace(/\s+/g, ' ').trim();
  const match = clean.match(/DU\s+(\d{1,2})\/(\d{1,3})\/(\d{2,4})\s+AU\s+(\d{1,2})\/(\d{1,3})\/(\d{2,4})/i);
  if (!match) return null;

  function toDate(d: string, m: string, y: string): string {
    let day = parseInt(d, 10);
    let month = parseInt(m, 10);
    let year = parseInt(y, 10);
    if (year < 100) year += 2000;
    if (year === 203) year = 2026; // Fix legacy typo "DU 08/03/203 AU 14/03/2026"
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  return {
    startDate: toDate(match[1], match[2], match[3]),
    endDate: toDate(match[4], match[5], match[6]),
  };
}

export const seedSubscriptions = async (prisma: PrismaClient) => {
  console.log('--- Seeding Historical Subscriptions (Abonnements) ---');

  // 1. Locate Admin user
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true },
  });
  const adminId = admin?.id ?? null;

  // 2. Ensure Pack Silver & Pack Gold are configured as subscription products
  await prisma.posProduct.updateMany({
    where: { name: 'Pack Silver', subscriptionDuration: null },
    data: {
      subscriptionDuration: 1,
      subscriptionUnit: ESubscriptionUnit.YEAR,
      availableInPos: false,
    },
  });
  await prisma.posProduct.updateMany({
    where: { name: 'Pack Gold', subscriptionDuration: null },
    data: {
      subscriptionDuration: 1,
      subscriptionUnit: ESubscriptionUnit.YEAR,
      availableInPos: false,
    },
  });

  // 3. Load clients and products
  const clients = await prisma.creditClient.findMany({
    select: { id: true, firstName: true, lastName: true, email: true },
  });
  const clientMap = new Map<string, { id: string; email: string | null }>();
  for (const c of clients) {
    const fullName = `${c.firstName} ${c.lastName}`.trim().toLowerCase();
    clientMap.set(fullName, { id: c.id, email: c.email });
    if (c.email) clientMap.set(c.email.trim().toLowerCase(), { id: c.id, email: c.email });
  }

  const products = await prisma.posProduct.findMany({
    select: { id: true, name: true, price: true, subscriptionDuration: true, subscriptionUnit: true },
  });
  const productMap = new Map<string, typeof products[0]>();
  for (const p of products) {
    productMap.set(p.name.trim().toLowerCase(), p);
  }

  // 4. Load CSV file
  const csvPath = resolveCsvPath('subscriptions_history.csv');
  if (!fs.existsSync(csvPath)) {
    console.warn(`[seedSubscriptions] File not found: ${csvPath}`);
    return;
  }
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const rows = parseCsv(csvContent);

  // 5. Prepare subscription records (skip duplicates and parse dates)
  const seenNumbers = new Set<number>();
  const subscriptionsToCreate: any[] = [];
  const clientEmailUpdates: { id: string; email: string }[] = [];

  for (const r of rows) {
    // Handle specific legacy line duplicates
    if (r.reference_vente === 'S00057' && r.texte_ou_description_article === 'Pack Silver') continue;
    if (r.reference_vente === 'S00015' && r.texte_ou_description_article?.includes('21/12/2025')) continue;

    const numStr = r.reference_vente.replace(/\D/g, '');
    const number = parseInt(numStr, 10);
    if (isNaN(number) || seenNumbers.has(number)) continue;
    seenNumbers.add(number);

    // Match client
    const clientNameNorm = (r.client_nom || '').trim().toLowerCase();
    const clientEmailNorm = (r.email || '').trim().toLowerCase();
    let client = clientMap.get(clientNameNorm);
    if (!client && clientEmailNorm) client = clientMap.get(clientEmailNorm);
    if (!client) {
      console.warn(`[seedSubscriptions] Client not found for: ${r.client_nom}`);
      continue;
    }

    // Enrich client email if missing
    if (!client.email && r.email) {
      clientEmailUpdates.push({ id: client.id, email: r.email.trim() });
      client.email = r.email.trim();
    }

    // Match product
    const prodNameNorm = (r.nom_du_produit || '').trim().toLowerCase();
    const product = productMap.get(prodNameNorm);
    if (!product) {
      console.warn(`[seedSubscriptions] Product not found for: ${r.nom_du_produit}`);
      continue;
    }

    // Parse dates
    const dates = parseDates(r.texte_ou_description_article);
    if (!dates) {
      console.warn(`[seedSubscriptions] Date parsing failed for row ${r.reference_vente}: ${r.texte_ou_description_article}`);
      continue;
    }

    const startDate = new Date(`${dates.startDate}T00:00:00.000Z`);
    const endDate = new Date(`${dates.endDate}T00:00:00.000Z`);
    const totalAmount = parseFloat(r.amount_total) || Number(product.price);

    subscriptionsToCreate.push({
      number,
      cardToken: randomUUID(),
      status: ESubscriptionStatus.ACTIVE,
      clientId: client.id,
      productId: product.id,
      productName: product.name,
      duration: product.subscriptionDuration ?? 30,
      unit: product.subscriptionUnit ?? ESubscriptionUnit.DAY,
      startDate,
      endDate,
      unitPrice: totalAmount,
      discountType: EDiscountType.PERCENT,
      discountPct: 0,
      discountAmount: 0,
      taxRate: 0,
      subtotal: totalAmount,
      taxAmount: 0,
      total: totalAmount,
      amountPaid: totalAmount,
      note: r.note?.trim() || null,
      createdById: adminId,
      activatedAt: startDate,
      createdAt: startDate,
      updatedAt: startDate,
    });
  }

  // 6. Update client emails if enriched
  for (const update of clientEmailUpdates) {
    try {
      await prisma.creditClient.update({
        where: { id: update.id },
        data: { email: update.email },
      });
    } catch {
      // Ignore if duplicate email
    }
  }

  // 7. Clear old subscription records and insert new ones
  await prisma.subscription.deleteMany({});
  console.log(`[seedSubscriptions] Inserting ${subscriptionsToCreate.length} subscriptions...`);

  const CHUNK_SIZE = 50;
  for (let i = 0; i < subscriptionsToCreate.length; i += CHUNK_SIZE) {
    const chunk = subscriptionsToCreate.slice(i, i + CHUNK_SIZE);
    await prisma.subscription.createMany({ data: chunk });
  }

  // 8. Synchronize PostgreSQL sequence for Subscription.number
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"Subscription"', 'number'), (SELECT COALESCE(MAX(number), 1) FROM "Subscription"))`,
  );

  console.log(`✓ Seeded ${subscriptionsToCreate.length} historical subscriptions successfully.`);
};
