import { PrismaClient, Role } from 'src/generated/prisma/client';
import * as bcrypt from 'bcrypt';

export const seedSuperAdmin = async (prisma: PrismaClient) => {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_NAME) {
    throw new Error('ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_NAME are required for admin seed');
  }

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      password: hashedPassword,
      name: ADMIN_NAME,
      role: Role.ADMIN,
    },
    create: {
      email: ADMIN_EMAIL,
      password: hashedPassword,
      name: ADMIN_NAME,
      role: Role.ADMIN,
    },
  });
};

export const seedDefaultRooms = async (prisma: PrismaClient) => {
  const defaults = [
    {
      name: 'Salle A',
      capacity: 8,
      color: '#22c55e',
      description: 'Small group study',
      equipment: ['projector', 'whiteboard'],
      pricePerHour: 45,
    },
    {
      name: 'Salle B',
      capacity: 12,
      color: '#3b82f6',
      description: 'Medium room',
      equipment: ['whiteboard', 'power outlets'],
      pricePerHour: 60,
    },
    {
      name: 'Salle C',
      capacity: 6,
      color: '#f59e0b',
      description: 'Quiet room',
      equipment: ['screen'],
      pricePerHour: 35,
    },
    {
      name: 'Salle D',
      capacity: 20,
      color: '#a855f7',
      description: 'Large workshop space',
      equipment: ['projector', 'whiteboard', 'video conference'],
      pricePerHour: 95,
    },
  ];

  for (const r of defaults) {
    await prisma.room.upsert({
      where: { name: r.name },
      update: {
        capacity: r.capacity,
        color: r.color,
        description: r.description,
        equipment: r.equipment,
        pricePerHour: r.pricePerHour,
      },
      create: {
        name: r.name,
        capacity: r.capacity,
        color: r.color,
        description: r.description,
        equipment: r.equipment,
        pricePerHour: r.pricePerHour,
      },
    });
  }
};
