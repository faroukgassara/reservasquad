import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as nodemailer from 'nodemailer';
import { SendMailDto } from './sendMail.dto';

export const BIBLIO_SQUAD_LOGO_CID = 'bibliosquad-logo';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor() {}
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST_ADDRESS,
    port: Number(process.env.SMTP_PORT),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  /** Inline logo for HTML emails (works even when FRONT_URL is localhost). */
  getBiblioSquadLogoAttachment(): NonNullable<SendMailDto['attachments']>[number] {
    const logoPath = path.resolve(__dirname, '../../../view/assets/bibliosquad-logo.png');
    return {
      filename: 'bibliosquad-logo.png',
      content: fs.readFileSync(logoPath),
      contentType: 'image/png',
      cid: BIBLIO_SQUAD_LOGO_CID,
    };
  }

  async sendMail(sendMailDto: SendMailDto) {
    try {
      const mail = await this.transporter.sendMail({
        to: sendMailDto.to,
        from: sendMailDto.from,
        subject: sendMailDto.subject,
        html: sendMailDto.template,
        attachments: sendMailDto.attachments ?? [],
      });
      return mail;
    } catch (err: unknown) {
      const detail = err instanceof Error ? err.stack ?? err.message : 'Unknown error';
      this.logger.error(`Failed to send email to ${sendMailDto.to}`, detail);
      return null;
    }
  }
}
