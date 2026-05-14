import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'src/generated/prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly softDeletableModels: {
    model: string;
    uniqueFields?: string[];
  }[] = [{ model: 'user', uniqueFields: [] }];

  constructor(private readonly config: ConfigService) {
    const connectionString = config.get<string>('DATABASE_URL');
    if (!connectionString) {
      throw new Error('DATABASE_URL is not configured');
    }
    const adapter = new PrismaPg({ connectionString });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  private getModelConfig(modelName: string) {
    return this.softDeletableModels.find(
      (m) => m.model.toLowerCase() === modelName,
    );
  }

  private handleSoftDelete(
    params: any,
    modelConfig: { model: string; uniqueFields?: string[] },
  ) {
    if (params.action === 'delete') {
      params.action = 'update';

      const updateData: any = { deletedAt: new Date() };

      if (modelConfig.uniqueFields) {
        modelConfig.uniqueFields.forEach((field) => {
          updateData[field] = uuidv4();
        });
      }

      params.args = {
        ...params.args,
        data: {
          ...params.args.data,
          ...updateData,
        },
      };
    }
  }

  private filterDeletedRecords(params: any) {
    if (['findFirst', 'findMany', 'findUnique'].includes(params.action)) {
      params.args.where = {
        ...params.args.where,
        deletedAt:
          params.args.where?.deletedAt === undefined
            ? null
            : params.args.where.deletedAt,
      };
    }
  }
}
