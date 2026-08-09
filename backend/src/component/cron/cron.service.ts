import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CronJob } from 'cron';
import { SchedulerRegistry } from '@nestjs/schedule';

@Injectable()
export class CronService implements OnModuleInit {
    private readonly logger = new Logger(CronService.name);

    constructor(
        private readonly schedulerRegistry: SchedulerRegistry,
    ) {
    }

    async onModuleInit() {
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

}
