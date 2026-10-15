import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NewsletterService } from './newsletter.service';

@Injectable()
export class NewsletterResumeCronService {
  private readonly logger = new Logger(NewsletterResumeCronService.name);

  constructor(private readonly newsletterService: NewsletterService) {}

  /**
   * Runs every 5 minutes to resume any interrupted newsletter in SENDING status
   * that still has PENDING recipients (e.g. after server restart).
   */
  @Cron(CronExpression.EVERY_5_MINUTES, {
    name: 'newsletter-resume-sending',
  })
  async handleNewsletterResume(): Promise<void> {
    try {
      await this.newsletterService.resumePendingNewsletters();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error during newsletter resume cron job: ${message}`, error);
    }
  }
}
