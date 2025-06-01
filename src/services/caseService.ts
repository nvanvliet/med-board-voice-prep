
import { supabase } from '@/integrations/supabase/client';
import { DatabaseCase, DatabaseCaseMessage } from '@/types/database';
import { Case, Message } from '@/types';

export class CaseService {
  // Convert database case to app case format
  private static convertDatabaseCaseToCase(dbCase: DatabaseCase, messages: DatabaseCaseMessage[] = []): Case {
    return {
      id: dbCase.id,
      userId: dbCase.user_id,
      title: dbCase.title,
      date: dbCase.date_created,
      messages: messages.map(msg => ({
        id: msg.id,
        text: msg.message_text,
        sender: msg.sender,
        timestamp: msg.timestamp
      })),
      favorite: false // We'll add this to the database later if needed
    };
  }

  // Get all cases for the current user
  static async getCases(): Promise<Case[]> {
    const { data: cases, error: casesError } = await supabase
      .from('cases')
      .select('*')
      .order('date_created', { ascending: false });

    if (casesError) {
      console.error('Error fetching cases:', casesError);
      return [];
    }

    if (!cases || cases.length === 0) {
      return [];
    }

    // Get all messages for these cases
    const caseIds = cases.map(c => c.id);
    const { data: messages, error: messagesError } = await supabase
      .from('case_messages')
      .select('*')
      .in('case_id', caseIds)
      .order('timestamp', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return cases.map(c => this.convertDatabaseCaseToCase(c, []));
    }

    // Group messages by case
    const messagesByCase = (messages || []).reduce((acc, msg) => {
      if (!acc[msg.case_id]) acc[msg.case_id] = [];
      acc[msg.case_id].push(msg);
      return acc;
    }, {} as Record<string, DatabaseCaseMessage[]>);

    return cases.map(c => this.convertDatabaseCaseToCase(c, messagesByCase[c.id] || []));
  }

  // Create a new case
  static async createCase(title: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('cases')
      .insert({
        title,
        user_id: (await supabase.auth.getUser()).data.user?.id
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating case:', error);
      return null;
    }

    return data.id;
  }

  // Update a case
  static async updateCase(caseId: string, updates: Partial<DatabaseCase>): Promise<boolean> {
    const { error } = await supabase
      .from('cases')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', caseId);

    if (error) {
      console.error('Error updating case:', error);
      return false;
    }

    return true;
  }

  // Add a message to a case
  static async addMessage(caseId: string, text: string, sender: 'user' | 'ai' | 'system'): Promise<boolean> {
    const { error } = await supabase
      .from('case_messages')
      .insert({
        case_id: caseId,
        message_text: text,
        sender
      });

    if (error) {
      console.error('Error adding message:', error);
      return false;
    }

    return true;
  }

  // Delete a case and all its messages
  static async deleteCase(caseId: string): Promise<boolean> {
    const { error } = await supabase
      .from('cases')
      .delete()
      .eq('id', caseId);

    if (error) {
      console.error('Error deleting case:', error);
      return false;
    }

    return true;
  }

  // Upload audio file for a case
  static async uploadAudioFile(caseId: string, audioBlob: Blob, fileName: string): Promise<string | null> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return null;

    const filePath = `${user.id}/${caseId}/${fileName}`;
    
    const { data, error } = await supabase.storage
      .from('case-audio')
      .upload(filePath, audioBlob);

    if (error) {
      console.error('Error uploading audio:', error);
      return null;
    }

    // Update the case with the audio file info
    await this.updateCase(caseId, {
      audio_file_url: data.path,
      audio_file_name: fileName
    });

    return data.path;
  }

  // Get signed URL for audio file
  static async getAudioFileUrl(filePath: string): Promise<string | null> {
    const { data, error } = await supabase.storage
      .from('case-audio')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) {
      console.error('Error getting signed URL:', error);
      return null;
    }

    return data.signedUrl;
  }
}
