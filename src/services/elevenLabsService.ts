export class ElevenLabsService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async convertSpeechToText(audioBlob: Blob, modelId: string = 'eleven_multilingual_v2'): Promise<{ text: string; alignment?: any }> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.webm');
    formData.append('model_id', modelId);

    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': this.apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs Speech-to-Text API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return {
      text: result.text,
      alignment: result.alignment
    };
  }

  async convertSpeechToTextWithAlignment(audioBlob: Blob, modelId: string = 'eleven_multilingual_v2'): Promise<{ text: string; alignment: any }> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.webm');
    formData.append('model_id', modelId);
    formData.append('response_format', 'json');

    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': this.apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs Speech-to-Text API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  async getConversationHistory(conversationId: string): Promise<any> {
    const response = await fetch(`https://api.elevenlabs.io/v1/conversations/${conversationId}/history`, {
      method: 'GET',
      headers: {
        'xi-api-key': this.apiKey,
        'Accept': 'application/json'
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs Conversation History API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  async getConversationStatus(conversationId: string): Promise<any> {
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`, {
      method: 'GET',
      headers: {
        'xi-api-key': this.apiKey,
        'Accept': 'application/json'
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs Conversation Status API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }
}
