export type VerificationTable = {
  id: number;
  user_id: number;
  type: string;
  value: string;
  code: string;
  verified_at: string | null;
  initiated_at: string;
  expires_at: string;
};
