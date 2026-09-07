import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { ShoppingCart, Download, ThumbsUp, Share2, Music, ChevronLeft, ChevronRight, Disc, Sparkles, Play, Pause } from 'lucide-react';
import { Beat } from '../types';
import CheckoutModal from '../components/CheckoutModal';
import CheckoutErrorBoundary from '../components/CheckoutErrorBoundary';
import SubscribeDownloadModal from '../components/SubscribeDownloadModal';
import { filterHumanBeats, isAIPlaceholderBeat, downloadAudioFile } from '../lib/beatUtils';

export default function Storefront() {
  const navigate = useNavigate();
  const { state, updateBeat, incrementAnalytics, recordAnalyticsEvent } = useStore();
  const { currentTrack, isPlaying: isGlobalPlaying, playTrack, togglePlay: toggleGlobalPlay } = useAudioPlayer();
  const [checkoutBeat, setCheckoutBeat] = useState<Beat | null>(null);
  const [downloadUnlockBeat, setDownloadUnlockBeat] = useState<Beat | null>(null);

  const collectionScrollRef = useRef<HTMLDivElement | null>(null);

  const scrollCollection = (direction: 'left' | 'right') => {
    if (collectionScrollRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      collectionScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

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
    
    // 📊 GLOBAL ANALYTICS UPDATE (Real-time distribution)
    incrementAnalytics('totalEarnings', beat.price);
    incrementAnalytics('platformFees', beat.price * 0.25); // 25% Platform fee
    
    if (beat.audioUrl) {
      downloadAudioFile(beat.audioUrl, beat.title);
    }
  };

  const handleFreeDownload = (beat: Beat) => {
    handleTogglePlay(beat);

    // 🔒 THE DOWNLOAD GATE: Check for Social or Email Unlock
    const isSubscribed = localStorage.getItem('KRYPSIDE_SUBSCRIBED') === 'true';
    const isYTSubbed = localStorage.getItem('KRYPSIDE_YOUTUBE_SUBSCRIBED') === 'true';
    const isTikTokFollowed = localStorage.getItem('KRYPSIDE_TIKTOK_FOLLOWED') === 'true';

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
    
    // Redirect to the ZIP download endpoint
    window.location.href = `/api/free-download/${beat.id}`;
  };

  const handleLike = (beat: Beat) => {
    updateBeat(beat.id, { likes: (beat.likes || 0) + 1 });
    recordAnalyticsEvent('LIKE', beat.id);
  };

  const handleShare = (beat: Beat) => {
    recordAnalyticsEvent('SHARE', beat.id);
    // Add existing share logic if any, or just copy to clipboard
    navigator.clipboard.writeText(`${window.location.origin}/beat/${beat.id}`);
    alert('Link copied to clipboard!');
  };

  const displayBeats = filterHumanBeats([...state.beats]).sort((a, b) => {
    const scoreA = (a.likes || 0) + (a.plays || 0);
    const scoreB = (b.likes || 0) + (b.plays || 0);
    return scoreB - scoreA;
  });

  const isPlaying = (beatId: string) => isGlobalPlaying && currentTrack?.id === beatId;

  // 🏆 MILESTONES CELEBRATION LOGIC
  const totalPlays = state.analytics.totalPlays || 0;
  const isCelebrationMode = totalPlays >= 100; // Trigger celebration at 100 plays (Bronze)
  
  const getMilestoneInfo = () => {
    if (totalPlays >= 10000) return { name: 'Diamond', color: '#b9f2ff', icon: '💎' };
    if (totalPlays >= 5000) return { name: 'Platinum', color: '#e5e4e2', icon: '💿' };
    if (totalPlays >= 1000) return { name: 'Gold', color: '#FFD700', icon: '🥇' };
    if (totalPlays >= 500) return { name: 'Silver', color: '#c0c0c0', icon: '🥈' };
    if (totalPlays >= 100) return { name: 'Bronze', color: '#cd7f32', icon: '🥉' };
    return null;
  };

  const milestone = getMilestoneInfo();

  return (
    <div className="p-8 space-y-12">
      {/* 🏆 MILESTONE CELEBRATION BANNER */}
      {isCelebrationMode && milestone && (
        <div className="bg-gradient-to-r from-indigo-900 via-neutral-900 to-indigo-900 border-2 border-indigo-500/50 rounded-2xl p-6 shadow-[0_0_30px_rgba(79,70,229,0.3)] animate-in slide-in-from-top duration-700 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -ml-32 -mb-32"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-neutral-950 rounded-full border-4 border-indigo-500 flex items-center justify-center text-4xl shadow-lg transform hover:scale-110 transition-transform cursor-pointer">
                {milestone.icon}
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase italic">
                  {milestone.name} Milestone Unlocked!
                </h2>
                <p className="text-indigo-300 font-bold flex items-center gap-2 justify-center md:justify-start">
                  <Sparkles size={16} /> ALL BEATS ARE COMPLETELY FREE TO CELEBRATE <Sparkles size={16} />
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center md:items-end">
              <div className="text-[10px] uppercase font-black tracking-[0.2em] text-neutral-400 mb-1">Total Lifetime Streams</div>
              <div className="text-4xl font-mono font-black text-white">{totalPlays.toLocaleString()}</div>
              <div className="mt-2 text-[11px] font-bold bg-indigo-500 text-white px-3 py-1 rounded-full animate-bounce shadow-lg">
                MUSIC AWARDS GROUP FULFILLMENT ACTIVE
              </div>
            </div>
          </div>
        </div>
      )}
      {/* 🟢 CIRCULAR COLLECTION SHOWCASE SECTION */}
      {displayBeats.length > 0 && (
        <section className="bg-neutral-950/80 rounded-2xl p-6 border border-neutral-800/80 shadow-2xl relative">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles size={20} className="text-indigo-400" />
                <h2 className="text-2xl font-extrabold text-white tracking-tight">Featured Beat Collections</h2>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Circular beat showcase — click the centered play controls to listen
              </p>
            </div>

            {/* Scroll Navigation Arrows */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => scrollCollection('left')}
                className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 flex items-center justify-center transition-all active:scale-95"
                title="Scroll Left"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => scrollCollection('right')}
                className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 flex items-center justify-center transition-all active:scale-95"
                title="Scroll Right"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Horizontal Scrolling Circular Cards */}
          <div 
            ref={collectionScrollRef}
            className="flex overflow-x-auto gap-6 pb-4 pt-2 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent scroll-smooth snap-x"
          >
            {displayBeats.map((beat, idx) => (
              <div 
                key={`circ-${beat.id || idx}`}
                className="flex-shrink-0 snap-start flex flex-col items-center group relative"
              >
                {/* CIRCULAR ARTWORK CONTAINER */}
                <div className="relative w-52 h-52 sm:w-56 sm:h-56 rounded-full overflow-hidden shadow-2xl border-2 border-neutral-800 group-hover:border-indigo-500 transition-all duration-300 transform group-hover:scale-105">
                  {beat.coverArtUrl ? (
                    <img 
                      src={beat.coverArtUrl} 
                      alt={beat.title} 
                      className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-neutral-900 to-black flex items-center justify-center text-neutral-600 rounded-full">
                      <Music size={44} />
                    </div>
                  )}

                  {/* CENTER OVERLAY: PLAY BUTTON + BEAT TITLE + BPM */}
                  <div className="absolute inset-0 bg-black/60 group-hover:bg-black/75 transition-colors duration-300 rounded-full flex flex-col items-center justify-center p-4 text-center select-none backdrop-blur-[2px]">
                    {/* Play Button in the middle */}
                    <button
                      onClick={() => handleTogglePlay(beat)}
                      className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg transition-transform active:scale-90 mb-2 group-hover:scale-110"
                      title={isPlaying(beat.id) ? "Pause" : "Play"}
                    >
                      {isPlaying(beat.id) ? (
                        <Pause size={22} className="fill-current text-white" />
                      ) : (
                        <Play size={22} className="fill-current text-white ml-0.5" />
                      )}
                    </button>

                    {/* Name of the beat in the middle */}
                    <h3 className="font-extrabold text-white text-sm sm:text-base leading-snug truncate max-w-[85%] drop-shadow">
                      {beat.title}
                    </h3>

                    {/* BPM in the middle */}
                    <span className="text-[11px] font-bold text-indigo-300 mt-1 bg-black/80 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                      {beat.bpm || 120} BPM
                    </span>
                  </div>
                </div>

                {/* Producer & Purchase Actions underneath the circle */}
                <div className="mt-3 text-center flex flex-col items-center">
                  <p className="text-xs text-neutral-400 font-medium truncate max-w-[180px]">{beat.producer}</p>
                  <button 
                    onClick={() => isCelebrationMode ? handleFreeDownload(beat) : handlePurchase(beat)} 
                    className={`mt-2 ${isCelebrationMode ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500' : 'bg-neutral-900 hover:bg-indigo-600 border-neutral-700 hover:border-indigo-500'} text-white border px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow`}
                  >
                    {isCelebrationMode ? <Download size={12} /> : <ShoppingCart size={12} />}
                    {isCelebrationMode ? 'FREE CELEBRATION' : `$${Number(beat.price).toFixed(2)}`}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TRENDING TRACKS GRID SECTION */}
      <div>
        <h1 className="text-3xl font-bold mb-8">Trending tracks</h1>
        {displayBeats.length === 0 ? (
          <div className="bg-neutral-950/80 border border-neutral-800 rounded-2xl p-12 text-center my-4 shadow-xl">
            <div className="w-16 h-16 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Music className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Storefront is Empty</h3>
            <p className="text-neutral-400 text-sm max-w-md mx-auto">
              No beats are currently listed in the store. Check back soon for new releases.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {displayBeats.map((beat, idx) => (
              <div key={beat.id ? `${beat.id}-${idx}` : idx} className="bg-neutral-900 rounded-lg overflow-hidden border border-neutral-800 group">
                <div className="relative aspect-square">
                  {beat.coverArtUrl ? (
                    <img src={beat.coverArtUrl} alt={beat.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-neutral-500"><Music size={32} /></div>
                  )}
                  <button 
                    onClick={() => handleTogglePlay(beat)}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {isPlaying(beat.id) ? <Pause size={48} className="text-white" /> : <Play size={48} className="text-white" />}
                  </button>
                  
                  {/* Overlay stats */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-3 text-[10px] font-bold text-white/80">
                      <span className="flex items-center gap-1"><Play size={10} /> {beat.plays || 0}</span>
                      <span className="flex items-center gap-1"><ThumbsUp size={10} /> {beat.likes || 0}</span>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold truncate flex-1">{beat.title}</h3>
                    <button 
                      onClick={() => handleLike(beat)}
                      className="text-neutral-500 hover:text-indigo-400 transition-colors ml-2"
                    >
                      <ThumbsUp size={16} />
                    </button>
                  </div>
                  <p className="text-sm text-neutral-400 mb-4 truncate">{beat.producer}</p>
                  
                  <div className="flex justify-between items-center">
                    <button 
                      onClick={() => isCelebrationMode ? handleFreeDownload(beat) : handlePurchase(beat)} 
                      className={`${isCelebrationMode ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-indigo-600 hover:bg-indigo-700'} text-white px-3 py-1.5 rounded text-sm font-bold flex items-center gap-1 transition-all active:scale-95`}
                    >
                      {isCelebrationMode ? <Download size={14} /> : <ShoppingCart size={14} />}
                      {isCelebrationMode ? 'FREE' : `$${Number(beat.price).toFixed(2)}`}
                    </button>
                    <div className="flex items-center gap-3">
                      {(beat.freeDownload?.enabled || isCelebrationMode) && (
                        <button onClick={() => handleFreeDownload(beat)} className="text-neutral-400 hover:text-white transition-colors">
                          <Download size={18} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleShare(beat)}
                        className="text-neutral-400 hover:text-white transition-colors"
                      >
                        <Share2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CheckoutErrorBoundary>
        <CheckoutModal 
          onClose={() => setCheckoutBeat(null)} 
          beat={checkoutBeat} 
          onSuccess={handlePurchaseSuccess} 
        />
      </CheckoutErrorBoundary>

      <SubscribeDownloadModal 
        isOpen={!!downloadUnlockBeat}
        onClose={() => setDownloadUnlockBeat(null)}
        beat={downloadUnlockBeat}
        onSuccess={triggerDownload}
      />
    </div>
  );
}

