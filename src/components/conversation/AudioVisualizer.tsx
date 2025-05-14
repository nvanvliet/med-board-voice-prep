
interface AudioVisualizerProps {
  audioLevel: number;
  isActive: boolean;
}

export default function AudioVisualizer({ audioLevel, isActive }: AudioVisualizerProps) {
  if (!isActive) return null;
  
  // Generate 5 bars with heights based on audio level
  const bars = Array.from({ length: 5 }, (_, i) => {
    // Create some variation in the bars
    const variation = Math.sin(Date.now() / 200 + i) * 0.3 + 0.7;
    const height = Math.max(3, Math.round(audioLevel * 20 * variation));
    return height;
  });
  
  return (
    <div className="audio-visualizer">
      {bars.map((height, i) => (
        <div 
          key={i} 
          className="audio-bar animate-pulse-recording" 
          style={{ height: `${height}px` }} 
        />
      ))}
    </div>
  );
}
