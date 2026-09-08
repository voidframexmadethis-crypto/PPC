import React, { useRef, useEffect } from 'react';

interface WaveformProps {
  duration: number;
  currentTime: number;
  width?: number;
  height?: number;
  color?: string;
}

export default function Waveform({ 
  duration, 
  currentTime, 
  width = 500, 
  height = 50, 
  color = '#6366f1' // Indigo-500
}: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Number of bars
    const numBars = 60;
    const barWidth = width / numBars;
    const gap = 3;

    const progress = currentTime / (duration || 1);

    // Deterministic bars based on width/numBars to avoid random jitter
    for (let i = 0; i < numBars; i++) {
      const x = i * (width / numBars);
      // Simulate waveform height using sine wave for consistency
      const barHeight = Math.abs(Math.sin(i / 5)) * (height - 10) + 10;
      const isPlayed = (i / numBars) < progress;

      ctx.fillStyle = isPlayed ? color : '#374151'; // Indigo or Gray-700
      ctx.fillRect(x, height / 2 - barHeight / 2, barWidth - gap, barHeight);
      
      // Rounded corners
      ctx.fill();
    }
  }, [duration, currentTime, width, height, color]);

  return <canvas ref={canvasRef} width={width} height={height} className="cursor-pointer" />;
}
