
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
        transcript: '', // Initialize with empty transcript
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

  async updateCaseTranscript(caseId: string, transcript: string): Promise<void> {
    console.log('Updating transcript for case:', caseId, 'with content:', transcript.substring(0, 100) + '...');
    
    const { error } = await supabase
      .from('cases')
      .update({ 
        transcript,
        updated_at: new Date().toISOString()
      })
      .eq('id', caseId);

    if (error) {
      console.error('Error updating transcript:', error);
      throw error;
    }
    
    console.log('Transcript updated successfully');
  },

  async getCaseTranscript(caseId: string): Promise<string | null> {
    console.log('Fetching transcript for case:', caseId);
    
    const { data, error } = await supabase
      .from('cases')
      .select('transcript')
      .eq('id', caseId)
      .single();

    if (error) {
      console.error('Error fetching transcript:', error);
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    
    console.log('Fetched transcript:', data?.transcript ? 'Found transcript' : 'No transcript');
    return data?.transcript || null;
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
