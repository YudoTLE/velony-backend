export type UserTable = {
  id: number;
  uuid: string;
  name: string;
  username: string;
  email: string | null;
  password_hash: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  version: string;
};
