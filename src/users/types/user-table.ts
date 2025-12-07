export type UserTable = {
  id: number;
  uuid: string;
  name: string;
  username: string;
  email: string | null;
  password_hash: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  version: string;
};
