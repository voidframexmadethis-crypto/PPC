import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { Beat } from '../types';
import { TrackRow } from '../components/packs/TrackRow';
import { filterHumanBeats, downloadAudioFile } from '../lib/beatUtils';
import { Sparkles, Trophy } from 'lucide-react';

export default function TopTracks() {
  const { state, updateBeat, incrementAnalytics, recordAnalyticsEvent } = useStore();
  const { currentTrack, isPlaying: isGlobalPlaying, playTrack, togglePlay: toggleGlobalPlay } = useAudioPlayer();

  const handleTogglePlay = (beat: Beat) => {
    const isCurrentTrack = currentTrack?.id === beat.id;
    if (isCurrentTrack) {
      toggleGlobalPlay();
    } else {
      playTrack(beat);
      updateBeat(beat.id, { plays: (beat.plays || 0) + 1 });
      incrementAnalytics('totalPlays');
    }
  };

  const handlePurchase = (beat: Beat) => {
    // Existing purchase logic placeholder
    alert(`Checkout for ${beat.title}`);
  };

  const handleFreeDownload = (beat: Beat) => {
    handleTogglePlay(beat);
    window.location.href = `/api/free-download/${beat.id}`;
  };

  const handleLike = (beat: Beat) => {
    updateBeat(beat.id, { likes: (beat.likes || 0) + 1 });
  };

  const topBeats = filterHumanBeats([...state.beats])
    .sort((a, b) => (b.plays || 0) - (a.plays || 0))
    .slice(0, 10);

  const isPlaying = (beatId: string) => isGlobalPlaying && currentTrack?.id === beatId;

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <div className="flex items-center gap-3 text-indigo-400 mb-4 font-bold tracking-widest uppercase text-sm">
            <Trophy size={20} /> NIGHTRUNNA CHARTS
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter uppercase">Top Tracks</h1>
          <p className="text-xl text-neutral-400 mt-6 max-w-2xl font-medium">The definitive sounds making noise across the NightRunna storefront.</p>
        </div>

        <div className="space-y-4">
          {topBeats.map((beat, index) => (
            <TrackRow 
              key={beat.id}
              rank={index + 1}
              beat={beat}
              isPlaying={isPlaying(beat.id)}
              onTogglePlay={handleTogglePlay}
              onPurchase={handlePurchase}
              onFreeDownload={handleFreeDownload}
              onLike={handleLike}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
