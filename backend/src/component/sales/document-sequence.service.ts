import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DocumentSequenceService {
  constructor(private readonly prisma: PrismaService) {}

  async nextNumber(prefix: 'DEV' | 'FAC' | 'CMD'): Promise<string> {
    const year = new Date().getFullYear();

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.documentSequence.findUnique({
        where: { prefix_year: { prefix, year } },
      });

      const next = (existing?.lastNumber ?? 0) + 1;

      await tx.documentSequence.upsert({
        where: { prefix_year: { prefix, year } },
        create: { prefix, year, lastNumber: next },
        update: { lastNumber: next },
      });

      return `${prefix}-${year}-${String(next).padStart(4, '0')}`;
    });
  }
}
