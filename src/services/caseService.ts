
import { supabase } from '@/integrations/supabase/client';
import { DatabaseCase, DatabaseCaseMessage } from '@/types/database';
import { Case, Message } from '@/types';

export const caseService = {
  async createCase(title: string, userId: string): Promise<DatabaseCase> {
    const { data, error } = await supabase
      .from('cases')
      .insert({
        title,
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getCases(userId: string): Promise<DatabaseCase[]> {
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getCase(caseId: string): Promise<DatabaseCase | null> {
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  async getCaseMessages(caseId: string): Promise<DatabaseCaseMessage[]> {
    const { data, error } = await supabase
      .from('case_messages')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    // Cast the sender to the correct type
    return (data || []).map(message => ({
      ...message,
      sender: message.sender as 'user' | 'ai' | 'system'
    }));
  },

  async addMessage(caseId: string, text: string, sender: 'user' | 'ai' | 'system'): Promise<DatabaseCaseMessage> {
    const { data, error } = await supabase
      .from('case_messages')
      .insert({
        case_id: caseId,
        message_text: text,
        sender: sender,
        timestamp: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    
    // Cast the sender to the correct type
    return {
      ...data,
      sender: data.sender as 'user' | 'ai' | 'system'
    };
  },

  convertDatabaseCaseToCase(dbCase: DatabaseCase, messages: DatabaseCaseMessage[] = []): Case {
    return {
      id: dbCase.id,
      userId: dbCase.user_id,
      title: dbCase.title,
      date: dbCase.date_created,
      messages: messages.map(msg => ({
        id: msg.id,
        text: msg.message_text,
        sender: msg.sender as 'user' | 'ai' | 'system',
        timestamp: msg.timestamp,
      })),
    };
  },
};
