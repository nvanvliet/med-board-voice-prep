
import { useEffect, useRef } from 'react';
import { useCase } from '@/contexts/CaseContext';
import { useVoice } from '@/contexts/VoiceContext';
import MessageBubble from './MessageBubble';
import ConversationFooter from './ConversationFooter';

export default function ConversationView() {
  const { messages, endCurrentCase } = useCase();
  const { isListening } = useVoice();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 my-8">
            {isListening ? 'Listening... Speak to the AI assistant' : 'Click the microphone icon to start speaking'}
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <ConversationFooter onEndConversation={endCurrentCase} />
    </div>
  );
}
