import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { SendMailDto } from './sendMail.dto';


@Injectable()
export class EmailService {
  constructor() { }
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST_ADDRESS,
    port: Number(process.env.SMTP_PORT),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  async sendMail(sendMailDto: SendMailDto) {
    try {
      const mail = await this.transporter.sendMail({
        to: sendMailDto.to,
        from: sendMailDto.from,
        subject: sendMailDto.subject,
        html: sendMailDto.template,
        attachments: sendMailDto.attachments ?? []
      });
      return mail;
    } catch (err) {
      return null;
    }
  }
}
