export type UserConversationTable = {
  id: number;
  uuid: string;
  user_id: number;
  conversation_id: number;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};
