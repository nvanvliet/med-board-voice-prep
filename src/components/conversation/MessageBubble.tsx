
import { Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.sender === 'user';
  const time = new Date(message.timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  return (
    <div className={`${isUser ? 'ml-auto' : 'mr-auto'} max-w-[80%]`}>
      <div className={`rounded-lg p-4 ${
        isUser 
          ? 'bg-[#1A1F2C] text-white rounded-br-none' 
          : 'bg-[#9b87f5] text-white rounded-bl-none'
      }`}>
        {message.text}
      </div>
      <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
        {time}
      </div>
    </div>
  );
}
