
export interface DatabaseCase {
  id: string;
  user_id: string;
  title: string;
  date_created: string;
  audio_file_url?: string;
  audio_file_name?: string;
  duration_seconds?: number;
  transcript?: string;
  case_notes?: string;
  conversation_id?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseCaseMessage {
  id: string;
  case_id: string;
  message_text: string;
  sender: 'user' | 'ai' | 'system';
  timestamp: string;
  created_at: string;
}
