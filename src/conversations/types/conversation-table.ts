export type ConversationTable = {
  id: number;
  uuid: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  version: string;
};
