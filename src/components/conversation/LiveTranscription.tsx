
import { useVoice } from '@/contexts/VoiceContext';

export default function LiveTranscription() {
  const { currentTranscription, isListening } = useVoice();

  console.log('🎭 LiveTranscription render:', {
    currentTranscription,
    transcriptionLength: currentTranscription?.length || 0,
    isListening,
    shouldShow: !!(isListening && currentTranscription)
  });

  if (!isListening || !currentTranscription) {
    console.log('🚫 LiveTranscription: Not showing (isListening:', isListening, ', hasTranscription:', !!currentTranscription, ')');
    return null;
  }

  console.log('✅ LiveTranscription: Showing transcription:', currentTranscription);

  return (
    <div className="p-3 mx-4 mb-2 bg-gray-100 border-l-4 border-blue-500 rounded-r-lg">
      <div className="flex items-center gap-2">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
        <span className="text-sm text-gray-600 italic">Speaking...</span>
      </div>
      <p className="text-sm text-gray-800 mt-1">{currentTranscription}</p>
    </div>
  );
}
