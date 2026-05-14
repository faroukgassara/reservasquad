import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { IEnv } from 'src/common/env/env';
import { ConfigService } from '@nestjs/config';
import { CronJob } from 'cron';
import { SchedulerRegistry } from '@nestjs/schedule';

@Injectable()
export class CronService implements OnModuleInit {
    private readonly logger = new Logger(CronService.name);
    private readonly config: IEnv;

    constructor(
        private readonly prismaService: PrismaService,
        private readonly configService: ConfigService,
        private readonly schedulerRegistry: SchedulerRegistry,

    ) {
        this.config = this.configService.get<IEnv>('env');
    }

    async onModuleInit() {
        this.addCronJob('archiveInactiveUsers', '0 2 * * *', this.archiveInactiveUsers.bind(this));
    }

    private addCronJob(name: string, cronTime: string, jobCallback: () => Promise<void>) {
        const job = new CronJob(cronTime, async () => {
            try {
                await jobCallback();
            } catch (error) {
                this.logger.error(`Error in cron job: ${name}`, error);
            }
        });
        this.schedulerRegistry.addCronJob(name, job);
        job.start();
        this.logger.log(`Cron job "${name}" added with schedule: "${cronTime}"`);
    }

    private async archiveInactiveUsers(): Promise<void> {
        const inactivityDaysLimit = parseInt(this.config.INACTIVITY_DAYS_BEFORE_ARCHIVE);
        const lastAllowedConnectionDate = new Date();
        lastAllowedConnectionDate.setDate(lastAllowedConnectionDate.getDate() - inactivityDaysLimit);
        const usersToArchive = await this.prismaService.user.findMany({
            where: {
                deletedAt: null
            },
            select: {
                id: true,
                email: true
            }
        });
        if (usersToArchive.length === 0) {
            this.logger.log('No inactive users found for archiving.');
            return;
        }
        const ids = usersToArchive.map(user => user.id);
        await this.prismaService.user.updateMany({
            where: { id: { in: ids } },
            data: { deletedAt: new Date() }
        });
        this.logger.log(`${usersToArchive.length} user(s) archived due to inactivity.`);
    }

}
