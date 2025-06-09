export class SpeechToTextService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: BlobPart[] = [];
  private isRecording = false;
  private onTranscriptionCallback?: (text: string, isFinal: boolean) => void;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async startRecording(onTranscription?: (text: string, isFinal: boolean) => void) {
    if (this.isRecording) return;

    this.onTranscriptionCallback = onTranscription;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        if (this.audioChunks.length > 0) {
          await this.processAudioChunks();
        }
      };

      this.mediaRecorder.start(1000); // Collect data every 1 second
      this.isRecording = true;

      // Process audio chunks every 3 seconds for real-time transcription
      this.startPeriodicTranscription();

    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  private startPeriodicTranscription() {
    const interval = setInterval(async () => {
      if (!this.isRecording) {
        clearInterval(interval);
        return;
      }

      if (this.audioChunks.length > 0) {
        // Create a copy of current chunks for processing
        const chunksToProcess = [...this.audioChunks];
        
        // Process these chunks
        const audioBlob = new Blob(chunksToProcess, { type: 'audio/webm' });
        await this.transcribeAudio(audioBlob, false);
        
        // Keep only the last few chunks to maintain context
        this.audioChunks = this.audioChunks.slice(-2);
      }
    }, 3000);
  }

  private async processAudioChunks() {
    const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
    await this.transcribeAudio(audioBlob, true);
  }

  private async transcribeAudio(audioBlob: Blob, isFinal: boolean) {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('model_id', 'eleven_multilingual_v2');

      const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      if (result.text && result.text.trim()) {
        this.onTranscriptionCallback?.(result.text.trim(), isFinal);
      }
    } catch (error) {
      console.error('Error transcribing audio:', error);
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      this.isRecording = false;
    }
  }

  getIsRecording() {
    return this.isRecording;
  }
}
