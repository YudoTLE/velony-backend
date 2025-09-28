import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UserDetailResponseDto {
  @Expose()
  uuid: string;

  @Expose()
  name: string;

  @Expose()
  username: string;

  @Expose()
  email?: string;

  @Expose({ name: 'phone_number' })
  phoneNumber?: string;

  @Expose({ name: 'profile_picture_url' })
  profilePictureUrl?: string;

  @Expose()
  @Expose({ name: 'created_at' })
  createdAt: Date;

  @Expose()
  @Expose({ name: 'updated_at' })
  updatedAt: Date;
}
