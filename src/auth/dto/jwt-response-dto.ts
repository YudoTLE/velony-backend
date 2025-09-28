import { Expose, Exclude } from 'class-transformer';

@Exclude()
export class JwtResponseDto {
  @Expose({ name: 'access_token' })
  accessToken: string;

  @Expose({ name: 'refresh_token' })
  refreshToken: string;

  @Expose({ name: 'token_type' })
  tokenType: string = 'Bearer';

  @Expose({ name: 'issued_at' })
  issuedAt: number;

  @Expose({ name: 'expires_at' })
  expiresAt: number;
}
