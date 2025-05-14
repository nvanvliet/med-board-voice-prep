
import { useState } from 'react';

export function useAudioVisualization() {
  const [audioLevel, setAudioLevel] = useState(0);
  
  const updateAudioLevel = (isListening: boolean) => {
    if (!isListening) return;
    
    // Simulate audio levels
    const randomValue = Math.random() * 0.5; // Random value between 0 and 0.5
    setAudioLevel(randomValue);
    
    // Continue animation if still listening
    if (isListening) {
      requestAnimationFrame(() => updateAudioLevel(isListening));
    }
  };

  const resetAudioLevel = () => {
    setAudioLevel(0);
  };

  return {
    audioLevel,
    updateAudioLevel,
    resetAudioLevel
  };
}
