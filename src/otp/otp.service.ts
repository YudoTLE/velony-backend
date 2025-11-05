import crypto from 'crypto';

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from 'src/database/database.service';
import { MailService } from 'src/mail/mail.service';
import { convertTime } from 'src/utlis/time';

@Injectable()
export class OtpService {
  constructor(
    private databaseService: DatabaseService,
    private mailService: MailService,
    private configService: ConfigService,
  ) {}

  async sendEmail(userUuid: string, newEmail: string): Promise<void> {
    const user = await (async () => {
      const query = `
          SELECT id, name
          FROM users
          WHERE uuid = $1
        `;
      const result = await this.databaseService.query(query, [userUuid]);
      return result.rows[0];
    })();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const expiration = convertTime(
      this.configService.getOrThrow('EMAIL_TOKEN_EXPIRATION'),
    );
    const otp = Array.from({ length: 6 }, () => crypto.randomInt(0, 10)).join(
      '',
    );
    const email = {
      to: newEmail,
      subject: 'Verify your email for VelonY',
      html: this.mailService.loadTemplate('verify-email.html', {
        name: user.name,
        otp: otp,
        expires: `${expiration.minutes} minutes`,
      }),
    };

    await (async () => {
      const query = `
          INSERT INTO verifications (user_id, type, value, code, expires_at)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (user_id, type)
          WHERE verified_at IS NULL
          DO UPDATE
            SET value = EXCLUDED.value,
                code = EXCLUDED.code,
                expires_at = EXCLUDED.expires_at,
                initiated_at = now();
        `;
      await this.databaseService.query(query, [
        user.id,
        'email',
        newEmail,
        otp,
        new Date(Date.now() + expiration.milliseconds),
      ]);
    })();

    await this.mailService.sendEmail(email);
  }

  async verifyEmail(userUuid: string, otp: string): Promise<string> {
    const user = await (async () => {
      const query = `
        SELECT id
        FROM users
        WHERE uuid = $1
      `;
      const result = await this.databaseService.query(query, [userUuid]);
      return result.rows[0];
    })();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const verification = await (async () => {
      const query = `
          SELECT id, value, code, expires_at
          FROM verifications
          WHERE user_id = $1
            AND type = $2
            AND verified_at IS NULL
        `;
      const result = await this.databaseService.query(query, [
        user.id,
        'email',
      ]);
      return result.rows[0];
    })();
    if (!verification) {
      throw new NotFoundException('No pending email verification found');
    }

    if (new Date() > new Date(verification.expires_at)) {
      throw new BadRequestException('Verification code has expired');
    }

    if (verification.code !== otp) {
      throw new BadRequestException('Invalid verification code');
    }

    await (async () => {
      const query = `
          UPDATE users
          SET email = $1
          WHERE id = $2
        `;
      await this.databaseService.query(query, [verification.value, user.id]);
    })();

    await (async () => {
      const query = `
          UPDATE verifications
          SET verified_at = now()
          WHERE id = $1
        `;
      await this.databaseService.query(query, [verification.id]);
    })();

    return verification.value;
  }
}
