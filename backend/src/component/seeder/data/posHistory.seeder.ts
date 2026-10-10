import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  EPosOrderStatus,
  EPosPaymentMethod,
  EPosSessionStatus,
  PrismaClient,
} from 'src/generated/prisma/client';

function parseCsvLine(text: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}

function cleanStr(val?: string): string | null {
  if (!val) return null;
  const t = val.trim();
  if (!t || t.toUpperCase() === 'NULL') return null;
  return t;
}

function parseNum(val?: string, def = 0): number {
  if (!val) return def;
  const n = parseFloat(val.replace(',', '.'));
  return Number.isFinite(n) ? n : def;
}

function parseDate(val?: string | null): Date {
  if (!val) return new Date();
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

async function chunkInsert<T>(
  items: T[],
  chunkSize: number,
  insertFn: (chunk: T[]) => Promise<unknown>,
) {
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    await insertFn(chunk);
  }
}

export const seedPosHistory = async (prisma: PrismaClient) => {
  console.log('--- Seeding Historical POS Sessions & Orders ---');

  // 1. Locate Admin user
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true },
  });
  const adminId = admin?.id ?? null;

  // 2. Load products and clients into lookup maps
  const products = await prisma.posProduct.findMany({
    select: { id: true, name: true },
  });
  const productMap = new Map<string, string>();
  for (const p of products) {
    productMap.set(p.name.trim().toLowerCase(), p.id);
  }

  const clients = await prisma.creditClient.findMany({
    where: { deletedAt: null },
    select: { id: true, firstName: true, lastName: true, phone: true },
  });
  const clientMapByPhone = new Map<string, string>();
  const clientMapByName = new Map<string, string>();
  for (const c of clients) {
    if (c.phone) {
      clientMapByPhone.set(c.phone.replaceAll(/\s+/g, ''), c.id);
    }
    const fullName = `${c.firstName} ${c.lastName}`.trim().toLowerCase();
    clientMapByName.set(fullName, c.id);
  }

  // 3. Locate CSV file
  const localCsv = path.join(__dirname, 'pos_orders_history.csv');
  const desktopCsv = 'C:\\Users\\MSI\\Desktop\\data-1791592355882.csv';
  const csvPath = fs.existsSync(localCsv) ? localCsv : desktopCsv;

  if (!fs.existsSync(csvPath)) {
    throw new Error(`POS orders history CSV file not found at ${localCsv} or ${desktopCsv}`);
  }

  console.log(`Reading CSV from ${csvPath}...`);
  const content = fs.readFileSync(csvPath, 'utf8');
  const rawLines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (rawLines.length <= 1) {
    console.log('CSV is empty or header only.');
    return;
  }

  const dataRows = rawLines.slice(1);
  console.log(`Processing ${dataRows.length} CSV rows...`);

  // 4. Data structures for grouping
  interface OrderLineRaw {
    lineId: string;
    productName: string;
    productId: string | null;
    quantity: number;
    unitPrice: number;
    discountPct: number;
    total: number;
  }

  interface OrderRaw {
    orderId: string;
    orderNumber: number;
    sessionId: string;
    sessionNumber: number;
    date: Date;
    clientName: string | null;
    clientPhone: string | null;
    creditClientId: string | null;
    total: number;
    ticketNum: string | null;
    refCaisse: string | null;
    isRefund: boolean;
    lines: OrderLineRaw[];
  }

  interface SessionRaw {
    sessionId: string;
    sessionNumber: number;
    status: EPosSessionStatus;
    startAt: Date;
    endAt: Date | null;
    ref: string | null;
    orders: Map<number, OrderRaw>;
  }

  const sessionsMap = new Map<number, SessionRaw>();

  for (const rowStr of dataRows) {
    const cols = parseCsvLine(rowStr);
    if (cols.length < 22) continue;

    const sId = parseInt(cols[0], 10);
    if (!Number.isFinite(sId)) continue;

    const sRef = cleanStr(cols[1]);
    const sStatus = cleanStr(cols[3]) === 'opened' ? EPosSessionStatus.OPEN : EPosSessionStatus.CLOSED;
    const sStart = parseDate(cleanStr(cols[4]));
    const sEnd = cleanStr(cols[5]) ? parseDate(cleanStr(cols[5])) : null;

    if (!sessionsMap.has(sId)) {
      sessionsMap.set(sId, {
        sessionId: uuidv4(),
        sessionNumber: sId,
        status: sStatus,
        startAt: sStart,
        endAt: sEnd,
        ref: sRef,
        orders: new Map(),
      });
    }

    const session = sessionsMap.get(sId)!;
    const cmdId = parseInt(cols[6], 10);
    if (!Number.isFinite(cmdId)) continue;

    const ticket = cleanStr(cols[7]);
    const refCaisse = cleanStr(cmdId ? cols[8] : '');
    const dateCmd = parseDate(cleanStr(cols[9]));
    const clientNom = cleanStr(cols[10]);
    const clientTel = cleanStr(cols[11]);
    const totalCmd = parseNum(cols[12]);

    if (!session.orders.has(cmdId)) {
      // Find credit client
      let matchedClientId: string | null = null;
      if (clientTel) {
        matchedClientId = clientMapByPhone.get(clientTel.replaceAll(/\s+/g, '')) ?? null;
      }
      if (!matchedClientId && clientNom && clientNom.toLowerCase() !== 'client de passage') {
        matchedClientId = clientMapByName.get(clientNom.trim().toLowerCase()) ?? null;
      }

      const isRefund = totalCmd < 0 || (ticket?.toUpperCase().includes('REMBOURSEMENT') ?? false);

      session.orders.set(cmdId, {
        orderId: uuidv4(),
        orderNumber: cmdId,
        sessionId: session.sessionId,
        sessionNumber: sId,
        date: dateCmd,
        clientName: clientNom,
        clientPhone: clientTel,
        creditClientId: matchedClientId,
        total: totalCmd,
        ticketNum: ticket,
        refCaisse,
        isRefund,
        lines: [],
      });
    }

    const order = session.orders.get(cmdId)!;

    const articleNom = cleanStr(cols[14]) || 'Article divers';
    const matchedProductId = productMap.get(articleNom.toLowerCase()) ?? null;
    const qty = parseNum(cols[17], 1);
    const unitPrice = parseNum(cols[18], 0);
    const remisePct = parseNum(cols[19], 0);
    const totalLine = parseNum(cols[21], qty * unitPrice);

    order.lines.push({
      lineId: uuidv4(),
      productName: articleNom,
      productId: matchedProductId,
      quantity: qty,
      unitPrice,
      discountPct: remisePct,
      total: totalLine,
    });
  }

  console.log(`Parsed ${sessionsMap.size} distinct sessions.`);

  // 5. Prepare batch records
  const sessionsToInsert: any[] = [];
  const ordersToInsert: any[] = [];
  const linesToInsert: any[] = [];
  const paymentsToInsert: any[] = [];

  for (const session of sessionsMap.values()) {
    let sessionTotal = 0;
    for (const order of session.orders.values()) {
      sessionTotal += order.total;

      const note = [order.ticketNum, order.refCaisse].filter(Boolean).join(' - ') || null;

      ordersToInsert.push({
        id: order.orderId,
        number: order.orderNumber,
        sessionId: session.sessionId,
        cashierId: adminId,
        creditClientId: order.creditClientId,
        status: order.isRefund ? EPosOrderStatus.REFUND : EPosOrderStatus.PAID,
        refundOfId: null,
        note,
        total: order.total,
        amountPaid: order.total,
        change: 0,
        createdAt: order.date,
        updatedAt: order.date,
      });

      paymentsToInsert.push({
        id: uuidv4(),
        orderId: order.orderId,
        method: EPosPaymentMethod.CASH,
        amount: order.total,
        creditId: null,
        createdAt: order.date,
      });

      for (const line of order.lines) {
        linesToInsert.push({
          id: line.lineId,
          orderId: order.orderId,
          productId: line.productId,
          productName: line.productName,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          discountPct: line.discountPct,
          total: line.total,
          refundOfLineId: null,
          saleOrderId: null,
          subscriptionId: null,
          creditId: null,
          invoiceId: null,
        });
      }
    }

    sessionsToInsert.push({
      id: session.sessionId,
      number: session.sessionNumber,
      status: session.status,
      openedById: adminId,
      openedAt: session.startAt,
      openingCash: 0,
      closedById: session.endAt ? adminId : null,
      closedAt: session.endAt,
      countedCash: sessionTotal,
      expectedCash: sessionTotal,
      difference: 0,
      closingNote: session.ref,
      createdAt: session.startAt,
      updatedAt: session.endAt ?? session.startAt,
    });
  }

  console.log(`Inserting ${sessionsToInsert.length} sessions...`);
  await chunkInsert(sessionsToInsert, 500, (chunk) => prisma.posSession.createMany({ data: chunk }));

  console.log(`Inserting ${ordersToInsert.length} orders...`);
  await chunkInsert(ordersToInsert, 1000, (chunk) => prisma.posOrder.createMany({ data: chunk }));

  console.log(`Inserting ${linesToInsert.length} order lines...`);
  await chunkInsert(linesToInsert, 1000, (chunk) => prisma.posOrderLine.createMany({ data: chunk }));

  console.log(`Inserting ${paymentsToInsert.length} payments...`);
  await chunkInsert(paymentsToInsert, 1000, (chunk) => prisma.posPayment.createMany({ data: chunk }));

  // 6. Synchronize Postgres autoincrement sequences to avoid collision with future orders
  console.log('Synchronizing PostgreSQL serial sequences...');
  try {
    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"PosSession"', 'number'), COALESCE(MAX(number), 1)) FROM "PosSession";`,
    );
    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"PosOrder"', 'number'), COALESCE(MAX(number), 1)) FROM "PosOrder";`,
    );
    console.log('Sequences synchronized successfully.');
  } catch (err) {
    console.warn('Could not sync sequences (may not be PostgreSQL native sequence):', err);
  }

  console.log(
    `Successfully seeded historical POS: ${sessionsToInsert.length} sessions, ${ordersToInsert.length} orders, ${linesToInsert.length} lines.`,
  );
};
