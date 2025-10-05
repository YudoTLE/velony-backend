import { User } from './user.interface';

export type UserSummary = Pick<
  User,
  'uuid' | 'name' | 'username' | 'profile_picture_url'
>;
