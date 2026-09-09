import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { Beat } from '../types';
import CheckoutModal from '../components/CheckoutModal';
import CheckoutErrorBoundary from '../components/CheckoutErrorBoundary';
import SubscribeDownloadModal from '../components/SubscribeDownloadModal';
import { filterHumanBeats, isAIPlaceholderBeat, downloadAudioFile } from '../lib/beatUtils';
import { Hero } from '../components/storefront/Hero';
import { BeatCard } from '../components/storefront/BeatCard';
import { Sparkles } from 'lucide-react';

export default function Storefront() {
  const navigate = useNavigate();
  const { state, updateBeat, incrementAnalytics, recordAnalyticsEvent } = useStore();
  const { currentTrack, isPlaying: isGlobalPlaying, playTrack, togglePlay: toggleGlobalPlay } = useAudioPlayer();
  const [checkoutBeat, setCheckoutBeat] = useState<Beat | null>(null);
  const [downloadUnlockBeat, setDownloadUnlockBeat] = useState<Beat | null>(null);

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
    setCheckoutBeat(beat);
  };

  const handlePurchaseSuccess = (beat: Beat) => {
    updateBeat(beat.id, { purchases: (beat.purchases || 0) + 1, earnings: (beat.earnings || 0) + beat.price });
    incrementAnalytics('totalEarnings', beat.price);
    recordAnalyticsEvent('PURCHASE', beat.id, { price: beat.price });
    if (beat.audioUrl) {
      downloadAudioFile(beat.audioUrl, beat.title);
    }
  };

  const handleFreeDownload = (beat: Beat) => {
    handleTogglePlay(beat);
    const isSubscribed = localStorage.getItem('NIGHTRUNNA_SUBSCRIBED') === 'true';
    const isYTSubbed = localStorage.getItem('NIGHTRUNNA_YOUTUBE_SUBSCRIBED') === 'true';
    const isTikTokFollowed = localStorage.getItem('NIGHTRUNNA_TIKTOK_FOLLOWED') === 'true';

    if (isSubscribed || isYTSubbed || isTikTokFollowed) {
      triggerDownload(beat);
    } else {
      setDownloadUnlockBeat(beat);
    }
  };

  const triggerDownload = (beat: Beat) => {
    if (isAIPlaceholderBeat(beat)) return;
    updateBeat(beat.id, { downloads: (beat.downloads || 0) + 1 });
    recordAnalyticsEvent('DOWNLOAD', beat.id);
    window.location.href = `/api/free-download/${beat.id}`;
  };

  const handleLike = (beat: Beat) => {
    updateBeat(beat.id, { likes: (beat.likes || 0) + 1 });
    recordAnalyticsEvent('LIKE', beat.id);
  };

  const displayBeats = filterHumanBeats([...state.beats]).sort((a, b) => (b.plays || 0) - (a.plays || 0));
  const latestBeats = [...displayBeats].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const isPlaying = (beatId: string) => isGlobalPlaying && currentTrack?.id === beatId;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <Hero />
      
      <div className="max-w-7xl mx-auto px-8 py-12 space-y-16">
        
        {/* Featured Beats */}
        <section id="featured">
          <h2 className="text-3xl font-bold mb-8 flex items-center gap-2">
            <Sparkles className="text-indigo-500" /> Featured Beats
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {displayBeats.slice(0, 4).map(beat => (
              <BeatCard key={beat.id} beat={beat} isPlaying={isPlaying(beat.id)} onTogglePlay={handleTogglePlay} onPurchase={handlePurchase} onFreeDownload={handleFreeDownload} onLike={handleLike} />
            ))}
          </div>
        </section>

        {/* Latest Drops */}
        <section id="latest">
          <h2 className="text-3xl font-bold mb-8">Latest Drops</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {latestBeats.slice(0, 8).map(beat => (
              <BeatCard key={beat.id} beat={beat} isPlaying={isPlaying(beat.id)} onTogglePlay={handleTogglePlay} onPurchase={handlePurchase} onFreeDownload={handleFreeDownload} onLike={handleLike} />
            ))}
          </div>
        </section>

      </div>

      <CheckoutErrorBoundary>
        <CheckoutModal onClose={() => setCheckoutBeat(null)} beat={checkoutBeat} onSuccess={handlePurchaseSuccess} />
      </CheckoutErrorBoundary>
      <SubscribeDownloadModal isOpen={!!downloadUnlockBeat} onClose={() => setDownloadUnlockBeat(null)} beat={downloadUnlockBeat} onSuccess={triggerDownload} />
    </div>
  );
}

