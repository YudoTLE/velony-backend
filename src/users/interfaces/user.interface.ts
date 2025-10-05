export interface User {
  id: string;
  uuid: string;
  name: string;
  username: string;
  email?: string;
  password_hash?: string;
  phone_number?: string;
  profile_picture_url?: string;
  created_at: Date;
  updated_at: Date;
}
