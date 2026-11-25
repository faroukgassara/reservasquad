import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('--- Seeding Year-over-Year Test Data (2026 & 2027) ---');

    // 1. Fetch reference data
    const rooms = await prisma.room.findMany({ where: { deletedAt: null } });
    if (rooms.length === 0) {
      console.error('No rooms found. Please seed rooms first.');
      return;
    }
    const professors = await prisma.professor.findMany({ where: { deletedAt: null } });
    const user = await prisma.user.findFirst({ where: { deletedAt: null } });
    const posProducts = await prisma.posProduct.findMany({ where: { deletedAt: null }, take: 10 });

    const settings = await prisma.dailyIncomeSettings.findUnique({ where: { id: 'default' } });
    const savingsPct = Number(settings?.savingsPercentage ?? 20) / 100;
    const benefitsPct = Number(settings?.benefitsPercentage ?? 20) / 100;
    const savingsForChargesPct = Number(settings?.savingsForChargesPercentage ?? 10) / 100;

    console.log(`Found ${rooms.length} rooms, ${professors.length} professors, ${posProducts.length} products`);
    console.log(`Settings: Savings ${savingsPct * 100}%, Benefits ${benefitsPct * 100}%, Saving for charges ${savingsForChargesPct * 100}%`);

    const ensureChargeCategory = async (name: string) => {
      const existing = await prisma.chargeCategory.findFirst({
        where: { deletedAt: null, name },
      });
      if (existing) return existing;
      return prisma.chargeCategory.create({ data: { name } });
    };
    const electricityCategory = await ensureChargeCategory('Électricité & eau');
    const suppliesCategory = await ensureChargeCategory('Fournitures & consommables');

    let dailyIncomesCreated = 0;
    let incomeLinesCreated = 0;
    let reservationsCreated = 0;
    let posSessionsCreated = 0;
    let posOrdersCreated = 0;

    // Days in each month for Daily Income entries
    const sampleDays = [3, 7, 11, 15, 19, 23, 27];

    const years = [2026, 2027];

    for (const yr of years) {
      // Growth multiplier: 2027 has ~20% higher revenue than 2026 to show positive YoY growth
      const yearMultiplier = yr === 2027 ? 1.22 : 1.0;

      for (let m = 1; m <= 12; m++) {
        // --- A. Daily Income & Income Lines ---
        for (const day of sampleDays) {
          const dateOnly = new Date(Date.UTC(yr, m - 1, day));
          const existingDi = await prisma.dailyIncome.findFirst({
            where: { date: dateOnly, deletedAt: null },
          });

          if (!existingDi) {
            // Base income: ~150 to ~380 DT * multiplier
            const base = 160 + ((day * 13 + m * 23) % 220);
            const totalIncome = Math.round(base * yearMultiplier * 100) / 100;
            const savings = Math.round(totalIncome * savingsPct * 100) / 100;
            const benefits = Math.round(totalIncome * benefitsPct * 100) / 100;
            const savingsForCharges = Math.round(totalIncome * savingsForChargesPct * 100) / 100;

            await prisma.dailyIncome.create({
              data: {
                date: dateOnly,
                totalIncome: totalIncome.toFixed(2),
                savings: savings.toFixed(2),
                benefits: benefits.toFixed(2),
                savingsForCharges: savingsForCharges.toFixed(2),
                notes: `Recette journalière ${day}/${m}/${yr}`,
              },
            });
            dailyIncomesCreated++;
          }
        }

        // Add 2-3 Income Lines per month (charges, investments, ecofacture)
        const lineDate1 = new Date(Date.UTC(yr, m - 1, 8));
        const lineDate2 = new Date(Date.UTC(yr, m - 1, 20));

        const existingLines = await prisma.incomeLine.findMany({
          where: {
            date: {
              gte: new Date(Date.UTC(yr, m - 1, 1)),
              lt: new Date(Date.UTC(yr, m, 1)),
            },
            deletedAt: null,
          },
        });

        if (existingLines.length < 2) {
          await prisma.incomeLine.createMany({
            data: [
              {
                date: lineDate1,
                type: 'CHARGE',
                categoryId: electricityCategory.id,
                description: `Facture ${m}/${yr}`,
                amount: (65 * yearMultiplier).toFixed(2),
              },
              {
                date: lineDate2,
                type: 'CHARGE',
                categoryId: suppliesCategory.id,
                description: `Achat ${m}/${yr}`,
                amount: (45 * yearMultiplier).toFixed(2),
              },
              {
                date: lineDate2,
                type: 'ECOFACTURE',
                description: `Éco-facture mensuelle ${m}/${yr}`,
                amount: (30 * yearMultiplier).toFixed(2),
              },
            ],
          });
          incomeLinesCreated += 3;

          // Occasional investment every 3 months
          if (m % 3 === 0) {
            await prisma.incomeLine.create({
              data: {
                date: lineDate1,
                type: 'INVESTMENT',
                description: `Amélioration équipement T${Math.ceil(m / 3)} ${yr}`,
                amount: (220 * yearMultiplier).toFixed(2),
              },
            });
            incomeLinesCreated++;
          }
        }

        // --- B. Reservations ---
        const existingMonthRes = await prisma.reservation.count({
          where: {
            deletedAt: null,
            status: 'CONFIRMED',
            startAt: {
              gte: new Date(Date.UTC(yr, m - 1, 1)),
              lt: new Date(Date.UTC(yr, m, 1)),
            },
          },
        });

        // Ensure at least 15 reservations per month
        const neededRes = Math.max(0, (yr === 2027 ? 16 : 14) - existingMonthRes);

        const titles = [
          'Cours de Mathématiques avancées',
          'Atelier Physique-Chimie',
          'Formation Informatique & Algorithmique',
          'Séance de Révision Bac',
          'Cours Particulier Français',
          'Atelier Anglais Conversation',
          'Session Prépa Concours',
          'Soutien Scolaire SVT',
        ];

        for (let i = 0; i < neededRes; i++) {
          const resDay = Math.min(28, (i * 2 + 1));
          const room = rooms[i % rooms.length];
          const prof = professors.length > 0 ? professors[i % professors.length] : null;

          const hourStart = 9 + ((i * 3) % 9); // 9h to 18h
          const durationHours = 1 + (i % 2); // 1 to 2 hours

          const startAt = new Date(Date.UTC(yr, m - 1, resDay, hourStart, 0, 0));
          const endAt = new Date(Date.UTC(yr, m - 1, resDay, hourStart + durationHours, 0, 0));

          const pricePerHour = Number(room.pricePerHour) || 15;
          const basePrice = durationHours * pricePerHour;
          // Apply slight growth for 2027
          const finalPrice = Math.round(basePrice * yearMultiplier * 100) / 100;

          // 85% paid, 15% unpaid
          const isPaid = (i % 7) !== 0;

          await prisma.reservation.create({
            data: {
              title: titles[i % titles.length],
              roomId: room.id,
              professorId: prof ? prof.id : null,
              startAt,
              endAt,
              price: finalPrice.toFixed(2),
              isPaid,
              paidAt: isPaid ? startAt : null,
              status: 'CONFIRMED',
              createdById: user ? user.id : null,
              notes: `Réservation test YoY ${m}/${yr}`,
            },
          });
          reservationsCreated++;
        }

        // --- C. POS Sessions & Orders for 2027 (for POS YoY comparison) ---
        if (yr === 2027 && posProducts.length > 0) {
          const existingSessions = await prisma.posSession.count({
            where: {
              openedAt: {
                gte: new Date(Date.UTC(yr, m - 1, 1)),
                lt: new Date(Date.UTC(yr, m, 1)),
              },
            },
          });

          if (existingSessions === 0) {
            // Create 2 closed sessions per month in 2027
            for (const sDay of [10, 24]) {
              const sessionOpenedAt = new Date(Date.UTC(yr, m - 1, sDay, 8, 30, 0));
              const sessionClosedAt = new Date(Date.UTC(yr, m - 1, sDay, 19, 0, 0));

              const session = await prisma.posSession.create({
                data: {
                  status: 'CLOSED',
                  openedById: user ? user.id : null,
                  closedById: user ? user.id : null,
                  openedAt: sessionOpenedAt,
                  closedAt: sessionClosedAt,
                  openingCash: '100.000',
                  countedCash: '380.000',
                  expectedCash: '380.000',
                  difference: '0.000',
                  closingNote: `Session POS de clôture test ${sDay}/${m}/${yr}`,
                },
              });
              posSessionsCreated++;

              // Create 4 orders for this session
              for (let oIdx = 0; oIdx < 4; oIdx++) {
                const prod = posProducts[oIdx % posProducts.length];
                const unitPrice = Number(prod.price) || 5;
                const qty = 1 + (oIdx % 3);
                const orderTotal = unitPrice * qty;
                const orderCreatedAt = new Date(Date.UTC(yr, m - 1, sDay, 10 + oIdx * 2, 15, 0));

                const order = await prisma.posOrder.create({
                  data: {
                    sessionId: session.id,
                    cashierId: user ? user.id : null,
                    status: 'PAID',
                    total: orderTotal.toFixed(3),
                    amountPaid: orderTotal.toFixed(3),
                    change: '0.000',
                    createdAt: orderCreatedAt,
                    updatedAt: orderCreatedAt,
                    lines: {
                      create: [
                        {
                          productId: prod.id,
                          productName: prod.name,
                          quantity: qty.toFixed(3),
                          unitPrice: unitPrice.toFixed(3),
                          total: orderTotal.toFixed(3),
                          discountPct: '0.00',
                        },
                      ],
                    },
                  },
                });
                posOrdersCreated++;
              }
            }
          }
        }
      }
    }

    console.log('\n--- Seeding Completed Successfully! ---');
    console.log({
      dailyIncomesCreated,
      incomeLinesCreated,
      reservationsCreated,
      posSessionsCreated,
      posOrdersCreated,
    });
  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
