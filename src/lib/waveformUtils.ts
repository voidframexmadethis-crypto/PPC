export async function extractWaveformData(file: File | string): Promise<number[]> {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContext();
    
    let arrayBuffer: ArrayBuffer;
    
    if (typeof file === 'string') {
      const response = await fetch(file);
      arrayBuffer = await response.arrayBuffer();
    } else {
      arrayBuffer = await file.arrayBuffer();
    }
    
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    const channelData = audioBuffer.getChannelData(0);
    
    const samples = 100;
    const blockSize = Math.floor(channelData.length / samples);
    const waveform: number[] = [];
    
    for (let i = 0; i < samples; i++) {
      let blockStart = blockSize * i;
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(channelData[blockStart + j]);
      }
      waveform.push(sum / blockSize);
    }
    
    // Normalize
    const multiplier = Math.pow(Math.max(...waveform), -1);
    return waveform.map(n => n * multiplier);
  } catch (err) {
    console.error("Waveform extraction failed:", err);
    return [];
  }
}
