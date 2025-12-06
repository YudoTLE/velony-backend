import crypto from 'crypto';

import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserNotFoundException } from 'src/common/exceptions/user-not-found.excpetion';
import { VerificationCodeInvalidException } from 'src/common/exceptions/verification-code-invalid.exception';
import { VerificationExpiredException } from 'src/common/exceptions/verification-expired.exception';
import { VerificationNotFoundException } from 'src/common/exceptions/verification-not-found.exception';
import { MailService } from 'src/mail/mail.service';
import { UsersRepository } from 'src/users/users.repository';
import { convertTime } from 'src/utlis/time';

import { VerificationRepository } from './verification.repository';

@Injectable()
export class VerificationService {
  constructor(
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly verificationRepository: VerificationRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async issueEmailChange(userUuid: string, newEmail: string): Promise<void> {
    const user = await this.usersRepository.findOneBy('uuid', userUuid, {
      fields: ['id', 'name'],
    });
    if (!user) throw new UserNotFoundException();

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

    await this.verificationRepository.createOne({
      user_id: user.id,
      type: 'email',
      value: newEmail,
      code: otp,
      expires_at: new Date(Date.now() + expiration.milliseconds).toISOString(),
    });

    await this.mailService.sendEmail(email);
  }

  async validateEmailChange(userUuid: string, otp: string): Promise<string> {
    const userId = await this.usersRepository
      .findOneBy('uuid', userUuid, { fields: ['id'] })
      .then((u) => u?.id);
    if (!userId) throw new NotFoundException();

    const verification = await this.verificationRepository.findOneBy(
      'user_id',
      userId,
      {
        type: 'email',
        verified: false,
        fields: ['id', 'value', 'code', 'expires_at'],
      },
    );

    if (!verification) {
      throw new VerificationNotFoundException();
    }

    if (new Date() > new Date(verification.expires_at)) {
      throw new VerificationExpiredException();
    }

    if (verification.code !== otp) {
      throw new VerificationCodeInvalidException();
    }

    await this.verificationRepository.updateOneBy('id', verification.id, {
      verified_at: new Date().toISOString(),
    });

    return verification.value;
  }
}
