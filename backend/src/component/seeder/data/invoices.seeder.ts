import {
  EInvoicePaymentMethod,
  EInvoiceStatus,
  EInvoiceType,
  PrismaClient,
} from 'src/generated/prisma/client';

export const seedInvoices = async (prisma: PrismaClient) => {
  console.log('--- Seeding Historical Invoices (Factures) ---');

  // 1. Locate Admin user
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true },
  });
  const adminId = admin?.id ?? null;

  // 2. Load clients
  const clients = await prisma.creditClient.findMany({
    select: { id: true, firstName: true, lastName: true },
  });
  const clientMap = new Map<string, string>();
  for (const c of clients) {
    const fullName = `${c.firstName} ${c.lastName}`.trim().toLowerCase();
    clientMap.set(fullName, c.id);
  }

  // 3. Load products
  const products = await prisma.posProduct.findMany({
    select: { id: true, name: true, price: true },
  });
  const productMap = new Map<string, typeof products[0]>();
  for (const p of products) {
    productMap.set(p.name.trim().toLowerCase(), p);
  }

  // 4. Load subscriptions to link
  const subscriptions = await prisma.subscription.findMany({
    select: { id: true, number: true },
  });
  const subByNumber = new Map<number, string>();
  for (const s of subscriptions) {
    subByNumber.set(s.number, s.id);
  }

  // 5. Clean up old dummy invoices
  await prisma.invoicePayment.deleteMany({});
  await prisma.invoiceLine.deleteMany({});
  await prisma.invoice.deleteMany({});

  // Client references
  const cdsId = clientMap.get('cds');
  const steId = clientMap.get('ste mobile station sales');
  const aminaId = clientMap.get('amina derbel');
  const emnaId = clientMap.get('emna zouch');
  const nourId = clientMap.get('nour houda masmoudi');
  const associaId = clientMap.get('associa med');

  // Product references
  const photocopie = productMap.get('photocopie');
  const photocopieA3 = productMap.get('photocopie a3') ?? photocopie;
  const tirageCouleur = productMap.get('tirage couleur');
  const spirale = productMap.get('spirale');
  const packSilver = productMap.get('pack silver');
  const abonnement7j = productMap.get('abonnement 7 j journée complet');
  const abonnement30j = productMap.get('abonnement 30 j journée complet');
  const domiciliation = productMap.get('domiciliation') ?? packSilver;
  const salleRevision = productMap.get('location salle pour révision');

  // All 9 Invoices matching Odoo export
  const invoicesData = [
    // 1. FAC/2026/00004 (facture_id 1737) - CDS - Non payée
    {
      type: EInvoiceType.INVOICE,
      status: EInvoiceStatus.POSTED,
      year: 2026,
      sequence: 4,
      clientId: cdsId!,
      subscriptionId: null,
      invoiceDate: new Date('2026-08-29T00:00:00.000Z'),
      dueDate: new Date('2026-08-29T00:00:00.000Z'),
      note: null,
      untaxed: 58.050,
      taxTotal: 9.840,
      stampDuty: 1.000,
      total: 68.890,
      amountPaid: 0.0,
      postedAt: new Date('2026-08-29T00:00:00.000Z'),
      lines: [
        {
          productId: photocopie?.id ?? null,
          productName: photocopie?.name ?? 'Photocopie',
          description: 'Photocopie N&B',
          quantity: 150,
          unitPrice: 0.150,
          discountPct: 0,
          taxRate: 19.0,
          subtotal: 22.500,
          taxAmount: 4.275,
          total: 26.775,
          sortOrder: 0,
        },
        {
          productId: photocopieA3?.id ?? null,
          productName: photocopieA3?.name ?? 'Photocopie A3',
          description: 'Photocopie A3',
          quantity: 50,
          unitPrice: 0.350,
          discountPct: 0,
          taxRate: 19.0,
          subtotal: 17.500,
          taxAmount: 3.325,
          total: 20.825,
          sortOrder: 1,
        },
        {
          productId: tirageCouleur?.id ?? null,
          productName: tirageCouleur?.name ?? 'Tirage Couleur',
          description: 'Tirage Couleur',
          quantity: 51,
          unitPrice: 0.354,
          discountPct: 0,
          taxRate: 12.4,
          subtotal: 18.050,
          taxAmount: 2.240,
          total: 20.290,
          sortOrder: 2,
        },
      ],
      payment: null,
    },

    // 2. FAC/2026/00003 (facture_id 1533) - CDS - Payée
    {
      type: EInvoiceType.INVOICE,
      status: EInvoiceStatus.POSTED,
      year: 2026,
      sequence: 3,
      clientId: cdsId!,
      subscriptionId: null,
      invoiceDate: new Date('2026-04-22T00:00:00.000Z'),
      dueDate: new Date('2026-04-22T00:00:00.000Z'),
      note: null,
      untaxed: 29.900,
      taxTotal: 4.491,
      stampDuty: 1.000,
      total: 35.391,
      amountPaid: 35.391,
      postedAt: new Date('2026-04-22T00:00:00.000Z'),
      lines: [
        {
          productId: photocopie?.id ?? null,
          productName: photocopie?.name ?? 'Photocopie',
          description: 'Photocopie',
          quantity: 100,
          unitPrice: 0.150,
          discountPct: 0,
          taxRate: 19.0,
          subtotal: 15.000,
          taxAmount: 2.850,
          total: 17.850,
          sortOrder: 0,
        },
        {
          productId: photocopieA3?.id ?? null,
          productName: photocopieA3?.name ?? 'Photocopie A3',
          description: 'Photocopie A3',
          quantity: 20,
          unitPrice: 0.350,
          discountPct: 0,
          taxRate: 19.0,
          subtotal: 7.000,
          taxAmount: 1.330,
          total: 8.330,
          sortOrder: 1,
        },
        {
          productId: spirale?.id ?? null,
          productName: spirale?.name ?? 'SPIRALE',
          description: 'Reliure Spirale',
          quantity: 3,
          unitPrice: 2.633,
          discountPct: 0,
          taxRate: 4.0,
          subtotal: 7.900,
          taxAmount: 0.311,
          total: 8.211,
          sortOrder: 2,
        },
      ],
      payment: {
        date: new Date('2026-04-22T00:00:00.000Z'),
        method: EInvoicePaymentMethod.BANK,
        amount: 35.391,
      },
    },

    // 3. FAC/2026/00002 (facture_id 1214) - CDS - Non payée
    {
      type: EInvoiceType.INVOICE,
      status: EInvoiceStatus.POSTED,
      year: 2026,
      sequence: 2,
      clientId: cdsId!,
      subscriptionId: null,
      invoiceDate: new Date('2026-02-05T00:00:00.000Z'),
      dueDate: new Date('2026-02-05T00:00:00.000Z'),
      note: null,
      untaxed: 85.200,
      taxTotal: 14.998,
      stampDuty: 1.000,
      total: 101.198,
      amountPaid: 0.0,
      postedAt: new Date('2026-02-05T00:00:00.000Z'),
      lines: [
        {
          productId: photocopie?.id ?? null,
          productName: photocopie?.name ?? 'Photocopie',
          description: 'Photocopie',
          quantity: 568,
          unitPrice: 0.150,
          discountPct: 0,
          taxRate: 17.6,
          subtotal: 85.200,
          taxAmount: 14.998,
          total: 100.198,
          sortOrder: 0,
        },
      ],
      payment: null,
    },

    // 4. FAC/2026/00001 (facture_id 1112) - STE MOBILE STATION SALES - Payée
    {
      type: EInvoiceType.INVOICE,
      status: EInvoiceStatus.POSTED,
      year: 2026,
      sequence: 1,
      clientId: steId!,
      subscriptionId: subByNumber.get(57) ?? null,
      invoiceDate: new Date('2026-01-04T00:00:00.000Z'),
      dueDate: new Date('2026-01-04T00:00:00.000Z'),
      note: '<p style="margin-bottom: 0px;">Contrat Domiciliation Du 01/09/2025 Au 31/08/2026</p>',
      untaxed: 900.0,
      taxTotal: 172.0,
      stampDuty: 1.0,
      total: 1073.0,
      amountPaid: 1073.0,
      postedAt: new Date('2026-01-04T00:00:00.000Z'),
      lines: [
        {
          productId: packSilver?.id ?? null,
          productName: packSilver?.name ?? 'Pack Silver',
          description: 'Contrat Domiciliation Du 01/09/2025 Au 31/08/2026',
          quantity: 1,
          unitPrice: 900.0,
          discountPct: 0,
          taxRate: 19.0,
          subtotal: 900.0,
          taxAmount: 172.0,
          total: 1072.0,
          sortOrder: 0,
        },
      ],
      payment: {
        date: new Date('2026-01-04T00:00:00.000Z'),
        method: EInvoicePaymentMethod.BANK,
        amount: 1073.0,
      },
    },

    // 5. FAC/2025/00005 (facture_id 978) - Amina Derbel - Payée
    {
      type: EInvoiceType.INVOICE,
      status: EInvoiceStatus.POSTED,
      year: 2025,
      sequence: 5,
      clientId: aminaId!,
      subscriptionId: subByNumber.get(26) ?? null,
      invoiceDate: new Date('2025-12-15T00:00:00.000Z'),
      dueDate: new Date('2025-12-15T00:00:00.000Z'),
      note: null,
      untaxed: 28.0,
      taxTotal: 0.0,
      stampDuty: 0.0,
      total: 28.0,
      amountPaid: 28.0,
      postedAt: new Date('2025-12-15T00:00:00.000Z'),
      lines: [
        {
          productId: abonnement7j?.id ?? null,
          productName: abonnement7j?.name ?? 'Abonnement 7 J journée complet',
          description: 'DU 15/12/2025 AU 21/12/2025',
          quantity: 1,
          unitPrice: 28.0,
          discountPct: 0,
          taxRate: 0.0,
          subtotal: 28.0,
          taxAmount: 0.0,
          total: 28.0,
          sortOrder: 0,
        },
      ],
      payment: {
        date: new Date('2025-12-15T00:00:00.000Z'),
        method: EInvoicePaymentMethod.CASH,
        amount: 28.0,
      },
    },

    // 6. FAC/2025/00004 (facture_id 827) - Emna Zouch - Payée
    {
      type: EInvoiceType.INVOICE,
      status: EInvoiceStatus.POSTED,
      year: 2025,
      sequence: 4,
      clientId: emnaId!,
      subscriptionId: subByNumber.get(9) ?? null,
      invoiceDate: new Date('2025-11-04T00:00:00.000Z'),
      dueDate: new Date('2025-11-04T00:00:00.000Z'),
      note: null,
      untaxed: 80.0,
      taxTotal: 0.0,
      stampDuty: 0.0,
      total: 80.0,
      amountPaid: 80.0,
      postedAt: new Date('2025-11-04T00:00:00.000Z'),
      lines: [
        {
          productId: abonnement30j?.id ?? null,
          productName: abonnement30j?.name ?? 'Abonnement 30 J journée complet',
          description: 'DU 04/11/2025 AU 03/12/2025',
          quantity: 1,
          unitPrice: 80.0,
          discountPct: 0,
          taxRate: 0.0,
          subtotal: 80.0,
          taxAmount: 0.0,
          total: 80.0,
          sortOrder: 0,
        },
      ],
      payment: {
        date: new Date('2025-11-04T00:00:00.000Z'),
        method: EInvoicePaymentMethod.CASH,
        amount: 80.0,
      },
    },

    // 7. FAC/2025/00003 (facture_id 818) - Nour Houda Masmoudi - Payée
    {
      type: EInvoiceType.INVOICE,
      status: EInvoiceStatus.POSTED,
      year: 2025,
      sequence: 3,
      clientId: nourId!,
      subscriptionId: subByNumber.get(8) ?? null,
      invoiceDate: new Date('2025-11-02T00:00:00.000Z'),
      dueDate: new Date('2025-11-02T00:00:00.000Z'),
      note: null,
      untaxed: 28.0,
      taxTotal: 0.0,
      stampDuty: 0.0,
      total: 28.0,
      amountPaid: 28.0,
      postedAt: new Date('2025-11-02T00:00:00.000Z'),
      lines: [
        {
          productId: abonnement7j?.id ?? null,
          productName: abonnement7j?.name ?? 'Abonnement 7 J journée complet',
          description: 'DU 02/11/2025 AU 08/11/2025',
          quantity: 1,
          unitPrice: 28.0,
          discountPct: 0,
          taxRate: 0.0,
          subtotal: 28.0,
          taxAmount: 0.0,
          total: 28.0,
          sortOrder: 0,
        },
      ],
      payment: {
        date: new Date('2025-11-02T00:00:00.000Z'),
        method: EInvoicePaymentMethod.CASH,
        amount: 28.0,
      },
    },

    // 8. Brouillon / (facture_id 690) - STE MOBILE STATION SALES - Non payée
    {
      type: EInvoiceType.INVOICE,
      status: EInvoiceStatus.DRAFT,
      year: null,
      sequence: null,
      clientId: steId!,
      subscriptionId: subByNumber.get(57) ?? null,
      invoiceDate: new Date('2025-09-28T00:00:00.000Z'),
      dueDate: new Date('2025-09-28T00:00:00.000Z'),
      note: null,
      untaxed: 901.0,
      taxTotal: 172.0,
      stampDuty: 0.0,
      total: 1073.0,
      amountPaid: 0.0,
      postedAt: null,
      lines: [
        {
          productId: domiciliation?.id ?? packSilver?.id ?? null,
          productName: 'Domiciliation',
          description: 'Periode : Du 01/09/2025 AU 31/08/2026',
          quantity: 1,
          unitPrice: 901.0,
          discountPct: 0,
          taxRate: 19.0,
          subtotal: 901.0,
          taxAmount: 172.0,
          total: 1073.0,
          sortOrder: 0,
        },
      ],
      payment: null,
    },

    // 9. FAC/2025/00002 (facture_id 553) - ASSOCIA MED - Payée
    {
      type: EInvoiceType.INVOICE,
      status: EInvoiceStatus.POSTED,
      year: 2025,
      sequence: 2,
      clientId: associaId!,
      subscriptionId: null,
      invoiceDate: new Date('2025-07-21T00:00:00.000Z'),
      dueDate: null,
      note: null,
      untaxed: 33.000,
      taxTotal: 6.270,
      stampDuty: 1.000,
      total: 40.270,
      amountPaid: 40.270,
      postedAt: new Date('2025-07-21T00:00:00.000Z'),
      lines: [
        {
          productId: salleRevision?.id ?? null,
          productName: salleRevision?.name ?? 'Location salle pour révision',
          description: 'Location salle pour révision',
          quantity: 1,
          unitPrice: 33.000,
          discountPct: 0,
          taxRate: 19.0,
          subtotal: 33.000,
          taxAmount: 6.270,
          total: 39.270,
          sortOrder: 0,
        },
      ],
      payment: {
        date: new Date('2025-07-21T00:00:00.000Z'),
        method: EInvoicePaymentMethod.BANK,
        amount: 40.270,
      },
    },
  ];

  for (const inv of invoicesData) {
    if (!inv.clientId) continue;
    const { lines, payment, ...invoiceFields } = inv;

    const created = await prisma.invoice.create({
      data: {
        ...invoiceFields,
        lines: {
          create: lines,
        },
        ...(payment
          ? {
              payments: {
                create: {
                  date: payment.date,
                  method: payment.method,
                  amount: payment.amount,
                  createdById: adminId,
                },
              },
            }
          : {}),
      },
    });

    console.log(
      `✓ Seeded invoice ${created.year && created.sequence ? `FAC/${created.year}/${String(created.sequence).padStart(5, '0')}` : '/'} for ${inv.total} DT`,
    );
  }

  console.log(`✓ Seeded all ${invoicesData.length} invoices successfully.`);
};
