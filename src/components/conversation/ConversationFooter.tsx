
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Circle, Mic, MicOff, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useVoice } from '@/contexts/VoiceContext';
import { useCase } from '@/contexts/CaseContext';
import AudioVisualizer from './AudioVisualizer';

interface ConversationFooterProps {
  onEndConversation: () => void;
}

export default function ConversationFooter({ onEndConversation }: ConversationFooterProps) {
  const [inputText, setInputText] = useState('');
  const { 
    isListening, 
    isSpeaking, 
    audioLevel, 
    connectToAgent, 
    disconnectFromAgent,
    toggleMicrophone
  } = useVoice();
  const { addMessage } = useCase();
  
  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    
    // Add the user message
    addMessage(inputText, 'user');
    setInputText('');
  };
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };
  
  const handleEndConversation = () => {
    // Disconnect from agent before ending the conversation
    disconnectFromAgent();
    onEndConversation();
  };
  
  const handleMicToggle = () => {
    console.log("Mic toggle clicked, current isListening state:", isListening);
    toggleMicrophone();
  };
  
  return (
    <div className="border-t p-4">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="icon"
          variant="outline"
          className={isListening ? "bg-medical-red text-white hover:bg-medical-red-dark" : ""}
          onClick={handleMicToggle}
        >
          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
        </Button>
        
        <div className="relative flex-1">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isListening || isSpeaking}
            className="pr-10"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <AudioVisualizer audioLevel={audioLevel} isActive={isListening} />
          </div>
        </div>
        
        <Button
          type="button"
          size="icon"
          onClick={handleSendMessage}
          disabled={!inputText.trim() || isListening || isSpeaking}
        >
          <Send size={18} />
        </Button>
      </div>
      
      <div className="mt-4">
        <Button
          variant="destructive"
          className="w-full"
          onClick={handleEndConversation}
        >
          End Conversation
        </Button>
      </div>
    </div>
  );
}
