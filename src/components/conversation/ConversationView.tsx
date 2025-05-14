
import { useEffect, useRef } from 'react';
import { useCase } from '@/contexts/CaseContext';
import { useVoice } from '@/contexts/VoiceContext';
import MessageBubble from './MessageBubble';
import ConversationFooter from './ConversationFooter';

export default function ConversationView() {
  const { messages, endCurrentCase } = useCase();
  const { speak, startListening, isListening } = useVoice();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Text-to-speech for AI messages
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.sender === 'ai') {
      speak(lastMessage.text);
    }
  }, [messages, speak]);

  // Auto-start listening when the conversation view is mounted, if not already listening
  useEffect(() => {
    if (!isListening) {
      const timer = setTimeout(() => {
        startListening();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [startListening, isListening]);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 my-8">
            The conversation will appear here
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
