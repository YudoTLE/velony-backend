import { User } from './user.interface';

export type UserDetail = Omit<User, 'id' | 'password_hash'>;
