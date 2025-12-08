export type ConversationTable = {
  id: number;
  uuid: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  version: string;
};
