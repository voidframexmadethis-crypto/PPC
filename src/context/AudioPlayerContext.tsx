import React, { createContext, useState, useRef, ReactNode, useContext, useEffect } from 'react';
import { Beat } from '../types';
import { db } from '../lib/firebase';
import { doc, increment, updateDoc, getDoc } from 'firebase/firestore';
import { processTrackStreamMetric } from '../lib/milestoneTracker';

interface AudioPlayerContextType {
  currentTrack: Beat | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playTrack: (track: Beat) => void;
  pauseTrack: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
}

export const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const AudioPlayerProvider = ({ children }: { children: ReactNode }) => {
  const [currentTrack, setCurrentTrack] = useState<Beat | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.85);
  const audioRef = useRef(new Audio());

  const playTrack = (track: Beat) => {
    const playUrl = track.watermarkedAudioUrl || track.audioUrl || '';
    
    if (currentTrack?.id !== track.id || audioRef.current.src !== playUrl) {
      audioRef.current.src = playUrl;
      audioRef.current.load();
      setCurrentTrack(track);

      // Trigger tracking and milestone pipeline asynchronously
      (async () => {
        try {
          if (track.id && !track.id.startsWith('local_') && !track.id.startsWith('default_')) {
            // Fire a background ping to your database to increment the stream count
            fetch('/api/streams/increment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: track.id })
            })
            .catch(err => console.log("Analytics logging packet dropped."));

            const beatRef = doc(db, 'beats', track.id);
            await updateDoc(beatRef, { plays: increment(1) });
            const snap = await getDoc(beatRef);
            if (snap.exists()) {
              const currentPlays = snap.data().plays || 0;
              await processTrackStreamMetric(track.id, currentPlays);
            }
          }
        } catch (error) {
          console.warn("Milestone tracking error:", error);
        }
      })();
    }
    
    if (audioRef.current.src) {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => {
          // Gracefully catch NotSupportedError or autoplay restrictions without crashing
          console.warn("Audio playback safely handled:", err?.message || err);
        });
    }
  };

  const pauseTrack = () => {
    audioRef.current.pause();
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (isPlaying) {
      pauseTrack();
    } else if (currentTrack) {
      if (!audioRef.current.src) {
        const playUrl = currentTrack.watermarkedAudioUrl || currentTrack.audioUrl || '';
        audioRef.current.src = playUrl;
        audioRef.current.load();
      }
      if (audioRef.current.src) {
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(err => {
            console.warn("Toggle play safely handled:", err?.message || err);
          });
      }
    }
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const setVolume = (vol: number) => {
    setVolumeState(vol);
    audioRef.current.volume = vol;
  };

  useEffect(() => {
    const audio = audioRef.current;
    
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  return (
    <AudioPlayerContext.Provider value={{ 
      currentTrack, 
      isPlaying, 
      currentTime, 
      duration, 
      volume,
      playTrack, 
      pauseTrack, 
      togglePlay,
      seek,
      setVolume
    }}>
      {children}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (context === undefined) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
};
