import React, { useState } from 'react';
import { Play, Pause, Volume2, VolumeX, X, Music } from 'lucide-react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { useStore } from '../context/StoreContext';

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
    pauseTrack
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

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    seek(parseFloat(e.target.value));
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds <= 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Add safe checks so if 'activeTrack' is null, the screen doesn't turn white
  if (!activeTrack) return null;

  return (
    <div className="global-audio-player-anchor fixed bottom-0 left-0 right-0 z-50 bg-neutral-950/95 border-t border-neutral-800/80 backdrop-blur-md px-4 py-3 text-white shadow-2xl transition-all animate-in slide-in-from-bottom-5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Track Info */}
        <div className="flex items-center gap-3 min-w-0 w-1/4">
          <div className="w-12 h-12 bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
            {currentTrack.coverArtUrl ? (
              <img src={currentTrack.coverArtUrl} alt={currentTrack.title} className="w-full h-full object-cover" />
            ) : (
              <Music className="w-6 h-6 text-indigo-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-sm text-white truncate">{currentTrack.title || 'Untitled Beat'}</h4>
            <div className="flex items-center gap-2 text-xs text-neutral-400 truncate">
              <span>{currentTrack.producer || 'KRYPSIDE'}</span>
              {currentTrack.bpm ? (
                <span className="bg-neutral-800 px-1.5 py-0.5 rounded text-[10px] text-neutral-300 font-bold">
                  {currentTrack.bpm} BPM
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Player Controls & Seekbar */}
        <div className="flex flex-col items-center gap-1.5 flex-1 max-w-xl">
          <div className="flex items-center gap-4">
            <button
              onClick={handleTogglePlay}
              className="w-10 h-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>
          </div>

          {/* Time & Timeline */}
          <div className="w-full flex items-center gap-2 text-xs text-neutral-400">
            <span className="w-10 text-right font-mono text-[11px]">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 180}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
            />
            <span className="w-10 font-mono text-[11px]">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume & Close */}
        <div className="flex items-center gap-4 w-1/4 justify-end">
          <div className="hidden sm:flex items-center gap-2">
            <button onClick={toggleMute} className="text-neutral-400 hover:text-white transition-colors">
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          <button
            onClick={pauseTrack}
            className="p-1.5 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
            title="Stop Playback"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
