import React, { useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Trash, Download, Music } from 'lucide-react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { useStore } from '../context/StoreContext';
import Waveform from './Waveform';

export default function AudioPlayer() {
  const { 
    currentTrack, 
    isPlaying, 
    currentTime, 
    duration, 
    volume, 
    togglePlay: togglePlayContext, 
    seek, 
    setVolume,
    clearTrack,
    loading,
    error,
    resetError
  } = useAudioPlayer();
  const { incrementAnalytics } = useStore();

  const handleTogglePlay = () => {
    if (!isPlaying) {
      incrementAnalytics('totalPlays');
    }
    togglePlayContext();
  };

  const activeTrack = currentTrack;
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    setIsMuted(newVol === 0);
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      setVolume(prevVolume || 0.85);
    } else {
      setPrevVolume(volume);
      setIsMuted(true);
      setVolume(0);
    }
  };

  const handleDownload = () => {
    if (activeTrack?.audioUrl) {
      const link = document.createElement('a');
      link.href = activeTrack.audioUrl;
      link.download = `${activeTrack.title}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds <= 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!activeTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-neutral-950/90 backdrop-blur-xl border-t border-indigo-500/30 text-white h-24 shadow-[0_-4px_30px_rgba(79,70,229,0.2)]">
      <div className="max-w-7xl mx-auto flex items-center h-full px-6 gap-6">
        {/* Artwork & Info */}
        <div className="flex items-center gap-4 w-72 shrink-0">
          <div className="w-16 h-16 bg-neutral-900 rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-indigo-500/30 shadow-inner">
            {activeTrack.coverArtUrl ? (
              <img src={activeTrack.coverArtUrl} alt={activeTrack.title} className="w-full h-full object-cover" />
            ) : (
              <Music className="w-8 h-8 text-indigo-500" />
            )}
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-base truncate text-white">{activeTrack.title}</h4>
            <p className="text-sm text-neutral-400 truncate hover:text-indigo-400 cursor-pointer">{activeTrack.producer}</p>
          </div>
        </div>

        {/* Playback Controls & Waveform */}
        <div className="flex items-center gap-6 flex-1 max-w-3xl">
          <button 
            onClick={handleTogglePlay} 
            className="w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-500 transition-all hover:scale-105 shrink-0 shadow-lg shadow-indigo-900/50"
            disabled={loading}
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 
             isPlaying ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white ml-1" />}
          </button>
          
          <div className="flex-1 flex flex-col gap-1.5 pt-1">
            <div 
              className="cursor-pointer group h-10 flex items-center relative"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                seek((x / rect.width) * duration);
              }}
            >
              <Waveform duration={duration} currentTime={currentTime} width={600} height={40} color={error ? '#ef4444' : "#4f46e5"} />
            </div>
            <div className="flex justify-between text-[11px] text-neutral-400 font-mono tracking-wider">
              <span>{error ? <span className="text-red-500">{error}</span> : formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4 shrink-0 justify-end w-72">
          <button onClick={handleDownload} title="Free Download" className="p-2.5 text-neutral-400 hover:text-indigo-400 transition-colors">
            <Download className="w-5 h-5" />
          </button>
          <button onClick={clearTrack} title="Close Player" className="p-2.5 text-neutral-400 hover:text-red-500 transition-colors">
            <Trash className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <button onClick={toggleMute} className="text-neutral-400 hover:text-white transition-colors">
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={volume} 
              onChange={handleVolumeChange} 
              className="w-24 accent-indigo-500 h-1 bg-neutral-800 rounded-full appearance-none cursor-pointer" 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
