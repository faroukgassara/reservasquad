import { EStatus, PrismaClient } from 'src/generated/prisma/client';
import * as bcrypt from 'bcrypt';

export const seedSuperAdmin = async (prisma: PrismaClient) => {
  const {
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
    ADMIN_FIRSTNAME,
    ADMIN_LASTNAME,
    ADMIN_PHONE
  } = process.env;

  if (
    !ADMIN_EMAIL ||
    !ADMIN_PASSWORD ||
    !ADMIN_FIRSTNAME ||
    !ADMIN_LASTNAME ||
    !ADMIN_PHONE
  ) {
    throw new Error('Missing required environment variables for super admin seeding');
  }

  const normalizedPhone = ADMIN_PHONE.replaceAll(/\s+/g, '');
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      password: hashedPassword,
      phone: normalizedPhone,
    },
    create: {
      email: ADMIN_EMAIL,
      password: hashedPassword,
      firstName: ADMIN_FIRSTNAME,
      lastName: ADMIN_LASTNAME,
      phone: normalizedPhone,
      status: EStatus.ACTIVE,
      imageUrl: 'http://example.com/image.jpg',
      role: 'ADMIN',
    },
  });
};
