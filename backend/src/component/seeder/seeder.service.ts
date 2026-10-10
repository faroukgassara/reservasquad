import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { seedSuperAdmin } from './data/superAdmin.seeder';
import { seedPosCatalog } from './data/posCatalog.seeder';
import { seedClients } from './data/clients.seeder';
import { seedPosHistory } from './data/posHistory.seeder';
import { seedSubscriptions } from './data/subscriptions.seeder';
import { seedInvoices } from './data/invoices.seeder';

@Injectable()
export class SeederService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger = new Logger(SeederService.name),
  ) { }

  private readonly seeders = [
    { name: 'superAdmin', fn: seedSuperAdmin },
    { name: 'posCatalog', fn: seedPosCatalog },
    { name: 'clients', fn: seedClients },
    { name: 'posHistory', fn: seedPosHistory },
    { name: 'subscriptions', fn: seedSubscriptions },
    { name: 'invoices', fn: seedInvoices },
  ];

  async seedAll() {
    for (const s of this.seeders) {
      const exists = await this.prisma.seeder.findUnique({ where: { name: s.name } });
      if (!exists) {
        await s.fn(this.prisma);
        await this.prisma.seeder.create({ data: { name: s.name } });
        this.logger.log(`Seeder "${s.name}" executed successfully`);
      }
    }
    return { status: 'done' };
  }

  async seedOne(name: string) {
    const found = this.seeders.find((s) => s.name === name);
    if (!found) throw new Error(`Seeder "${name}" not found`);
    const exists = await this.prisma.seeder.findUnique({ where: { name } });
    if (!exists) {
      await found.fn(this.prisma);
      await this.prisma.seeder.create({ data: { name } });
    }
    return { status: 'done', seeder: name };
  }

  async list() {
    return this.prisma.seeder.findMany();
  }
}
