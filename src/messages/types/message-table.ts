export type MessageTable = {
  id: number;
  uuid: string;
  previous_id: number | null;
  user_id: number;
  conversation_id: number;
  content: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  previous_uuid: string | null;
  user_uuid: string;
  conversation_uuid: string;
};
