export interface User {
  id: string;
  uuid: string;
  name: string;
  username: string;
  email?: string;
  password_hash?: string;
  phone_number?: string;
  avatar_url?: string;
  created_at: Date;
  updated_at: Date;
}
