import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Repeat, Shuffle, Share2, ShoppingBag, Download, ListMusic } from 'lucide-react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { useStore } from '../context/StoreContext';
import WaveSurfer from 'wavesurfer.js';

const formatTime = (seconds: number) => {
  if (isNaN(seconds) || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export default function AudioPlayer() {
  const { 
    currentTrack, 
    isPlaying, 
    currentTime, 
    duration, 
    volume, 
    togglePlay, 
    seek, 
    setVolume,
    playTrack,
    loading,
    audioElement
  } = useAudioPlayer();
  
  const { state } = useStore();
  
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);
  const [isLooping, setIsLooping] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  // Auto next track logic
  useEffect(() => {
    if (duration > 0 && currentTime >= duration - 0.5) {
      if (isLooping) {
        seek(0);
        togglePlay(); 
      } else {
        handleNext();
      }
    }
  }, [currentTime, duration]);

  // Init WaveSurfer when track changes
  useEffect(() => {
    if (!containerRef.current || !audioElement || !currentTrack) return;

    const playUrl = currentTrack.watermarkedAudioUrl || currentTrack.audioUrl || '';
    const peaks = currentTrack.waveformData && currentTrack.waveformData.length > 0 
      ? [currentTrack.waveformData] 
      : undefined;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#4b5563', 
      progressColor: '#ffffff',
      cursorColor: 'transparent',
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      height: 40,
      media: audioElement, 
      url: peaks ? playUrl : undefined, // Only pass URL if providing peaks to force precomputed data
      peaks: peaks,
      normalize: true,
      interact: true, // click to seek
    });
    
    // We no longer need to call ws.load manually, as create() handles it.
    
    wavesurferRef.current = ws;

    return () => {
      ws.destroy();
      wavesurferRef.current = null;
    };
  }, [currentTrack?.id, audioElement]); // Re-create on track ID change

  // Optional: dynamically extract peaks if missing
  useEffect(() => {
    if (!currentTrack || !currentTrack.audioUrl || !wavesurferRef.current || !audioElement) return;
    
    if (!currentTrack.waveformData || currentTrack.waveformData.length === 0) {
      // Async extract waveform
      import('../lib/waveformUtils').then(({ extractWaveformData }) => {
         extractWaveformData(currentTrack.audioUrl).then(data => {
           if (data && data.length > 0 && wavesurferRef.current) {
             const playUrl = currentTrack.watermarkedAudioUrl || currentTrack.audioUrl || '';
             wavesurferRef.current.load(playUrl, [data]);
             if (isPlaying) {
               audioElement.play().catch(e => console.warn(e));
             }
           }
         });
      });
    }
  }, [currentTrack]);

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

  const handleNext = () => {
    if (!currentTrack || state.beats.length === 0) return;
    let nextIndex;
    if (isShuffling) {
      nextIndex = Math.floor(Math.random() * state.beats.length);
    } else {
      const currentIndex = state.beats.findIndex(b => b.id === currentTrack.id);
      nextIndex = (currentIndex + 1) % state.beats.length;
    }
    playTrack(state.beats[nextIndex]);
  };

  const handlePrev = () => {
    if (!currentTrack || state.beats.length === 0) return;
    if (currentTime > 3) {
      seek(0);
      return;
    }
    const currentIndex = state.beats.findIndex(b => b.id === currentTrack.id);
    const prevIndex = currentIndex <= 0 ? state.beats.length - 1 : currentIndex - 1;
    playTrack(state.beats[prevIndex]);
  };

  const handleDownload = () => {
    if (currentTrack?.audioUrl) {
      const link = document.createElement('a');
      link.href = currentTrack.audioUrl;
      link.download = `${currentTrack.title}.m4a`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!currentTrack) return null;

  const isFree = currentTrack.freeDownload?.enabled;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-[#111111] text-white border-t border-neutral-800 shadow-2xl flex flex-col select-none">
      
      {/* Full width waveform scrubber at top of player */}
      <div 
        className="w-full h-8 sm:h-10 relative cursor-pointer flex items-end group bg-neutral-900/50"
      >
        <div ref={containerRef} className="w-full h-full opacity-70 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="w-full flex items-center justify-between px-4 lg:px-6 h-[72px] sm:h-[80px] gap-2 sm:gap-4">
        
        {/* Left: Artwork, Title, Producer & CTA */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 lg:w-[30%] shrink-1">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-neutral-900 rounded overflow-hidden shrink-0">
            {currentTrack.coverArtUrl ? (
              <img src={currentTrack.coverArtUrl} alt={currentTrack.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-neutral-800">
                <Play className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-500" />
              </div>
            )}
          </div>
          <div className="flex flex-col min-w-0 pr-2">
            <h4 className="font-bold text-[13px] sm:text-[15px] truncate text-white leading-tight">{currentTrack.title}</h4>
            <p className="text-[11px] sm:text-[13px] text-neutral-400 truncate hover:text-white transition-colors cursor-pointer leading-tight mt-0.5">NightRunna</p>
          </div>
          
          <div className="hidden xl:flex items-center gap-3 ml-4">
            <button className="text-neutral-400 hover:text-white transition-colors p-2" title="Share">
              <Share2 className="w-4 h-4" />
            </button>
            {isFree ? (
              <button 
                onClick={handleDownload}
                className="bg-white text-black text-xs font-bold px-4 py-2 rounded flex items-center gap-2 hover:bg-neutral-200 transition-colors whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                DOWNLOAD BEAT
              </button>
            ) : (
              <button className="bg-white text-black text-xs font-bold px-4 py-2 rounded flex items-center gap-2 hover:bg-neutral-200 transition-colors whitespace-nowrap">
                <ShoppingBag className="w-4 h-4" />
                ${currentTrack.price.toFixed(2)}
              </button>
            )}
          </div>
        </div>

        {/* Middle: Controls */}
        <div className="flex flex-col items-center justify-center gap-1 flex-1 shrink-0">
          <div className="flex items-center justify-center gap-4 sm:gap-6 shrink-0">
            <button onClick={() => setIsShuffling(!isShuffling)} className={`hidden sm:block transition-colors ${isShuffling ? 'text-white' : 'text-neutral-500 hover:text-white'}`}>
              <Shuffle className="w-4 h-4" />
            </button>
            <button onClick={handlePrev} className="text-neutral-400 hover:text-white transition-colors">
              <SkipBack className="w-5 h-5 fill-current" />
            </button>
            
            <button 
              onClick={togglePlay} 
              className="w-10 h-10 sm:w-12 sm:h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform shrink-0"
              disabled={loading}
            >
              {loading ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : 
               isPlaying ? <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-current" /> : <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current ml-0.5 sm:ml-1" />}
            </button>
            
            <button onClick={handleNext} className="text-neutral-400 hover:text-white transition-colors">
              <SkipForward className="w-5 h-5 fill-current" />
            </button>
            <button onClick={() => setIsLooping(!isLooping)} className={`hidden sm:block transition-colors ${isLooping ? 'text-white' : 'text-neutral-500 hover:text-white'}`}>
              <Repeat className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-[11px] font-mono text-neutral-400">
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right: Volume & Extra Controls */}
        <div className="flex items-center justify-end gap-3 sm:gap-4 min-w-0 lg:w-[30%] shrink-0">
          
          <div className="xl:hidden flex items-center">
             {isFree ? (
              <button 
                onClick={handleDownload}
                className="bg-white text-black text-[10px] sm:text-xs font-bold px-2.5 py-1.5 sm:px-3 sm:py-2 rounded flex items-center hover:bg-neutral-200 transition-colors whitespace-nowrap"
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            ) : (
              <button className="bg-white text-black text-[10px] sm:text-xs font-bold px-2.5 py-1.5 sm:px-3 sm:py-2 rounded flex items-center hover:bg-neutral-200 transition-colors whitespace-nowrap">
                <ShoppingBag className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                ${currentTrack.price.toFixed(0)}
              </button>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <button onClick={toggleMute} className="text-neutral-400 hover:text-white transition-colors">
              {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={isMuted ? 0 : volume} 
              onChange={handleVolumeChange} 
              className="w-20 h-1 bg-neutral-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white" 
            />
          </div>
          <button className="text-neutral-400 hover:text-white transition-colors p-2 hidden sm:block" title="Queue/Playlist">
            <ListMusic className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
