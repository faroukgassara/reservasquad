import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PosSubscriptionService } from './pos-subscription.service';

@Injectable()
export class SubscriptionReminderCronService {
  private readonly logger = new Logger(SubscriptionReminderCronService.name);

  constructor(private readonly subscriptionService: PosSubscriptionService) {}

  /**
   * Scheduled cron job running daily at 09:00 AM.
   * Checks for active subscriptions expiring tomorrow (J-1 / 1 day before expiration)
   * and automatically sends a reminder email to clients who haven't already received one.
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM, {
    name: 'subscription-expiration-reminder',
  })
  async handleSubscriptionReminderCron(): Promise<void> {
    this.logger.log('Starting daily scheduled check for subscriptions expiring tomorrow (J-1)...');
    try {
      const summary = await this.subscriptionService.processAutomaticExpirationReminders();
      this.logger.log(
        `Daily subscription reminder job finished: ${summary.sentCount} sent, ${summary.skippedCount} skipped, ${summary.failedCount} failed (${summary.totalFound} total checked).`,
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error during daily subscription reminder cron execution: ${message}`, error);
    }
  }
}
