export type MessageTable = {
  id: number;
  uuid: string;
  previous_id: number | null;
  user_id: number;
  conversation_id: number;
  content: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  previous_uuid: string | null;
  user_uuid: string;
  conversation_uuid: string;
  version: string;
};
