import fs from 'fs';
import path from 'path';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import handlebars from 'handlebars';
import { Resend } from 'resend';

import { Email } from './interface/email.interface';

@Injectable()
export class MailService {
  private resend: Resend;

  constructor(private readonly configService: ConfigService) {
    this.resend = new Resend(this.configService.get('RESEND_API_KEY'));
  }

  async sendEmail(email: Omit<Email, 'from'>) {
    await this.resend.emails.send({
      ...email,
      from: this.configService.getOrThrow('EMAIL_FROM'),
    });
  }

  loadTemplate(
    filename: string,
    context: Record<string, string | number> = {},
  ): string {
    const templatePath = path.join(
      process.cwd(),
      'src',
      'mail',
      'templates',
      filename,
    );
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const source = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(source);
    return template(context);
  }
}
