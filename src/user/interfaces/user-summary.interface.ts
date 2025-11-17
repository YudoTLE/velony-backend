import { User } from './user.interface';

export type UserSummary = Pick<
  User,
  'uuid' | 'name' | 'username' | 'avatar_url'
>;
