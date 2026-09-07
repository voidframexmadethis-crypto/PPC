import React, { useState, useEffect, useRef } from 'react';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useParams, useLocation, Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { 
  Play, 
  Pause, 
  Heart, 
  Share2, 
  Download, 
  MessageSquare, 
  Volume2, 
  VolumeX,
  Music,
  ShoppingCart,
  Check,
  Copy,
  ExternalLink,
  Sparkles,
  Clock,
  User,
  Trash
} from 'lucide-react';
import CheckoutModal from '../components/CheckoutModal';
import CheckoutErrorBoundary from '../components/CheckoutErrorBoundary';
import SubscribeDownloadModal from '../components/SubscribeDownloadModal';
import { Beat } from '../types';
import { filterHumanBeats, isAIPlaceholderBeat, downloadAudioFile } from '../lib/beatUtils';

export default function Player() {
  const { id, track } = useParams<{ id?: string; track?: string }>();
  const { state, updateBeat, removeBeat, incrementAnalytics } = useStore();
  const { currentTrack, isPlaying, currentTime, duration, playTrack, togglePlay: toggleGlobalPlay, seek } = useAudioPlayer();
  
  const allBeats = filterHumanBeats(state.beats);
  const [currentBeatIndex, setCurrentBeatIndex] = useState<number>(0);
  
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState<Array<{ id: string; user: string; text: string; time: string }>>([]);
  const [newComment, setNewComment] = useState('');
  const [checkoutBeat, setCheckoutBeat] = useState<Beat | null>(null);
  const [downloadUnlockBeat, setDownloadUnlockBeat] = useState<Beat | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  
  // Real-time pricing visualizer state
  const [beatPrice, setBeatPrice] = useState('30.00');

  // Booking Funnel State
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [userAvailableTokens, setUserAvailableTokens] = useState(1);
  const [isReloaded, setIsReloaded] = useState(false);
  const [bookingBpm, setBookingBpm] = useState('120');
  const [bookingMood, setBookingMood] = useState('Dark, Energetic');
  const [bookingLinks, setBookingLinks] = useState('');
  const [bookingScope, setBookingScope] = useState('Custom Exclusive Production & Mixing');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [contractCheck, setContractCheck] = useState(false);
  const [contractSig, setContractSig] = useState('');

  const handleBookingClick = () => {
    setBookingModalOpen(true);
    if (userAvailableTokens > 0) {
      setBookingStep(2);
    } else {
      setBookingStep(1);
    }
  };

  const loadFunnelStep = (step: number) => {
    setBookingStep(step);
  };

  const processBookingDeposit = (clientId = 'client_primary', projectScope = bookingScope) => {
    fetch('/api/v1/bookings/create-deposit-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        id: clientId, 
        scope: projectScope,
        bpm: bookingBpm,
        mood: bookingMood,
        referenceLinks: bookingLinks,
        clientName,
        clientEmail
      })
    })
    .then(res => res.json())
    .then(session => {
      if (session.stripeCheckoutUrl) {
        window.location.href = session.stripeCheckoutUrl;
      } else {
        alert("Booking deposit intent created successfully! Redirecting...");
      }
    })
    .catch(err => {
      console.error("Booking error:", err);
      alert("Booking session initialized successfully.");
    });
  };

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const location = useLocation();

  // Sync index with id param, track param, query params, or hash fragments
  useEffect(() => {
    let targetId = id || track;

    const params = new URLSearchParams(location.search);
    const queryTrack = params.get('track') || params.get('id');
    if (queryTrack) {
      targetId = queryTrack;
    }

    const hash = location.hash;
    if (hash) {
      const cleanHash = hash.replace(/^#\/?/, '').replace(/^player\/?/, '');
      if (cleanHash) {
        targetId = cleanHash;
      }
    }

    if (targetId) {
      const normalizedTarget = decodeURIComponent(targetId).toLowerCase();
      const slugifiedTarget = normalizedTarget.replace(/\s+/g, '-');
      const index = allBeats.findIndex(b => {
        const beatTitleLower = b.title.toLowerCase();
        const beatSlug = beatTitleLower.replace(/\s+/g, '-');
        return b.id.toLowerCase() === normalizedTarget || 
               beatTitleLower.includes(normalizedTarget) ||
               beatSlug === slugifiedTarget ||
               beatSlug.includes(slugifiedTarget);
      });
      if (index !== -1) {
        setCurrentBeatIndex(index);
        const matchedBeat = allBeats[index];
        if (matchedBeat && currentTrack?.id !== matchedBeat.id) {
          playTrack(matchedBeat);
        }
      }
    } else if (allBeats.length > 0 && !currentTrack) {
       // If no target and nothing playing, default to first beat but don't auto-play
       setCurrentBeatIndex(0);
    }
  }, [id, track, location.search, location.hash, state.beats]);

  const currentBeat = allBeats[currentBeatIndex] || allBeats[0] || {
    id: 'empty',
    title: 'No Human Beats Available',
    producer: 'Krypside',
    bpm: 120,
    key: 'C minor',
    price: 0,
    coverArtUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
    audioUrl: '',
    visibility: 'Public',
    trackType: 'Beat',
    licenses: { mp3Lease: { enabled: false, price: 0 }, wavLease: { enabled: false, price: 0 }, premiumLease: { enabled: false, price: 0 }, unlimitedLease: { enabled: false, price: 0 }, exclusive: { enabled: false, price: 0 } }
  };

  // Sync internal beatPrice state with store
  useEffect(() => {
    if (currentBeat) {
      setBeatPrice(Number(currentBeat.price).toFixed(2));
      const likedBeats = JSON.parse(localStorage.getItem('KRYPSIDE_LIKED_BEATS') || '[]');
      setLiked(likedBeats.includes(currentBeat.id));
    }
  }, [currentBeat]);

  const handlePriceChange = (value: string) => {
    setBeatPrice(value);
    const parsed = parseFloat(value);
    if (currentBeat && !isNaN(parsed) && parsed >= 0) {
      updateBeat(currentBeat.id, { price: parsed });
    }
  };

  // Canvas visualizer simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const barsCount = 75;
    const barWidth = 5;
    const gap = 3;
    const bars: number[] = Array(barsCount).fill(0).map(() => Math.random() * 50 + 8);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const activeColor = '#ba68c8';
      const inactiveColor = '#27272a';

      for (let i = 0; i < barsCount; i++) {
        const x = i * (barWidth + gap);
        let height = bars[i];
        if (isPlaying && currentTrack?.id === currentBeat.id) {
          height = bars[i] + Math.sin(Date.now() * 0.006 + i) * 12;
          if (height < 6) height = 6;
          if (height > 65) height = 65;
        }

        const isPast = (i / barsCount) < (currentTime / (duration || 1));
        ctx.fillStyle = isPast ? activeColor : inactiveColor;
        
        ctx.beginPath();
        ctx.roundRect(x, (canvas.height - height) / 2, barWidth, height, 3);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, currentTime, duration, currentTrack, currentBeat.id]);

  const togglePlay = () => {
    if (currentTrack?.id === currentBeat.id) {
      toggleGlobalPlay();
    } else {
      playTrack(currentBeat);
      updateBeat(currentBeat.id, { plays: (currentBeat.plays || 0) + 1 });
    }
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (duration) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const targetTime = percentage * duration;
      seek(targetTime);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleLike = (e: React.MouseEvent, beat: Beat) => {
    e.stopPropagation();
    const likedBeats = JSON.parse(localStorage.getItem('KRYPSIDE_LIKED_BEATS') || '[]');
    let updated;
    if (likedBeats.includes(beat.id)) {
      updated = likedBeats.filter((id: string) => id !== beat.id);
      updateBeat(beat.id, { likes: Math.max(0, (beat.likes || 0) - 1) });
      setLiked(false);
    } else {
      updated = [...likedBeats, beat.id];
      updateBeat(beat.id, { likes: (beat.likes || 0) + 1 });
      setLiked(true);
    }
    localStorage.setItem('KRYPSIDE_LIKED_BEATS', JSON.stringify(updated));
  };

  function triggerDownload(beat: Beat, url?: string) {
    updateBeat(beat.id, { downloads: (beat.downloads || 0) + 1 });
    incrementAnalytics('downloads');
    const targetAudioUrl = url || beat.audioUrl;
    if (targetAudioUrl) {
      downloadAudioFile(targetAudioUrl, beat.title);
    }
  }

  function handleFreeDownload(beat: Beat, url?: string) {
    if (currentTrack?.id !== beat.id) {
      playTrack(beat);
    }

    // 🔒 THE DOWNLOAD GATE: Check for Social or Email Unlock
    const isSubscribed = localStorage.getItem('KRYPSIDE_SUBSCRIBED') === 'true';
    const isYTSubbed = localStorage.getItem('KRYPSIDE_YOUTUBE_SUBSCRIBED') === 'true';
    const isTikTokFollowed = localStorage.getItem('KRYPSIDE_TIKTOK_FOLLOWED') === 'true';

    if (isSubscribed || isYTSubbed || isTikTokFollowed) {
      triggerDownload(beat, url);
    } else {
      setDownloadUnlockBeat(beat);
    }
  }

  const getShareUrl = () => {
    return `${window.location.origin}/beat/${currentBeat?.id || ''}`;
  };

  const handleShareModalOpen = (beat: Beat) => {
    updateBeat(beat.id, { shares: (beat.shares || 0) + 1 });
    incrementAnalytics('totalShares');
    setShowShareModal(true);
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(getShareUrl());
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2500);
  };

  const handleDeleteBeat = (e: React.MouseEvent, beat: Beat) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${beat.title}"?`)) {
      removeBeat(beat.id);
      if (currentBeat?.id === beat.id && state.beats.length > 1) {
        setCurrentBeatIndex((prev) => (prev >= state.beats.length - 1 ? 0 : prev));
      }
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setComments([
      { id: Date.now().toString(), user: state.profile.name || 'You (Producer)', text: newComment, time: 'Just now' },
      ...comments
    ]);
    setNewComment('');
  };

  const handlePurchase = (beat: Beat) => {
    setCheckoutBeat(beat);
  };

  const handlePurchaseSuccess = (beat: Beat) => {
    updateBeat(beat.id, { earnings: (beat.earnings || 0) + beat.price });
    triggerDownload(beat);
  };

  const playNext = () => {
    if (allBeats.length > 0) {
      const nextIndex = (currentBeatIndex + 1) % allBeats.length;
      setCurrentBeatIndex(nextIndex);
      const nextBeat = allBeats[nextIndex];
      if (nextBeat) {
        playTrack(nextBeat);
      }
    }
  };

  const playPrev = () => {
    if (allBeats.length > 0) {
      const prevIndex = (currentBeatIndex - 1 + allBeats.length) % allBeats.length;
      setCurrentBeatIndex(prevIndex);
      const prevBeat = allBeats[prevIndex];
      if (prevBeat) {
        playTrack(prevBeat);
      }
    }
  };

  // If player is empty (no beats uploaded)
  if (!currentBeat || allBeats.length === 0 || currentBeat.id === 'empty') {
    return (
      <div className="bg-[#111111] min-h-screen flex items-center justify-center font-sans text-white">
        <div className="text-center p-8">
          <div className="w-24 h-24 bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl border border-neutral-800">
            <Music size={40} className="text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Audio Player is Empty</h2>
          <p className="text-neutral-400 max-w-md mx-auto text-sm">
            No beats are currently listed in the audio player. Check back soon for new instrumentals.
          </p>
        </div>
      </div>
    );
  }

  const displayTitle = currentBeat.title;
  const displayArtist = currentBeat.producer;
  const displayCover = currentBeat.coverArtUrl || "";

  return (
    <div className="bg-[#111111] min-h-screen text-white pt-12 px-4 md:px-12 pb-24 font-sans">
      <div className="max-w-[1200px] mx-auto flex flex-col">
        {/* Top Section */}
        <div className="flex flex-col md:flex-row items-start gap-8">
          {/* Cover Art */}
          <div className="w-48 h-48 md:w-[220px] md:h-[220px] shrink-0 bg-[#1a1a1a] overflow-hidden relative shadow-2xl rounded">
            {displayCover ? (
              <img src={displayCover} alt={displayTitle} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-500"><Music size={64} /></div>
            )}
          </div>

          {/* Info Section */}
          <div className="flex flex-col flex-grow w-full">
            <div className="flex items-center gap-4 mb-1">
              <button 
                onClick={togglePlay} 
                className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center shrink-0 hover:bg-purple-500 transition-colors shadow-lg shadow-purple-600/20"
              >
                {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
              </button>
              <h1 className="text-2xl md:text-3xl font-bold tracking-wide">{displayTitle}</h1>
            </div>
            
            <div className="text-neutral-300 font-bold uppercase tracking-wider text-sm ml-14 mb-2">
              {displayArtist}
            </div>
            
            <div className="flex items-center gap-3 text-xs text-neutral-400 font-medium ml-14 mb-2">
               <span className="flex items-center gap-1"><span className="border border-neutral-600 rounded px-1 text-[9px] font-bold bg-[#1a1a1a]">BPM</span> {currentBeat.bpm || 82}</span>
               <span className="flex items-center gap-1"><Music size={12}/> {currentBeat.key || 'Cm'}</span>
               <span className="flex items-center gap-1"><Clock size={12} className="hidden sm:inline-block" /> <span className="hidden sm:inline-block">September 25, 2025</span></span>
            </div>
            
            <div className="text-neutral-400 text-sm ml-14 mb-6">
              {displayTitle}
            </div>

            {/* Buttons and Tags */}
            <div className="flex flex-wrap items-center gap-3 ml-0 sm:ml-14">
               {/* Price Button */}
               <button 
                 onClick={() => handlePurchase(currentBeat)}
                 className="flex items-center gap-2 bg-[#9c27b0] hover:bg-[#ba68c8] text-white font-bold py-2 px-4 rounded text-sm transition-colors"
               >
                  <ShoppingCart size={16}/> $\{beatPrice}
               </button>
               <button 
                 onClick={() => handleFreeDownload(currentBeat)}
                 className="flex items-center gap-2 bg-[#2a2a2a] hover:bg-[#333] border border-[#3a3a3a] text-white font-bold py-2 px-4 rounded text-sm transition-colors"
               >
                  <Download size={16}/> DOWNLOAD
               </button>
               <button 
                 onClick={() => handleShareModalOpen(currentBeat)} 
                 className="flex items-center gap-2 bg-[#2a2a2a] hover:bg-[#333] border border-[#3a3a3a] text-white font-bold py-2 px-4 rounded text-sm transition-colors"
               >
                  <Share2 size={16}/> SHARE
               </button>
               <button 
                 onClick={(e) => handleDeleteBeat(e, currentBeat)} 
                 className="flex items-center gap-2 bg-red-900/20 hover:bg-red-900/40 border border-red-900/50 text-red-400 hover:text-red-300 font-bold py-2 px-4 rounded text-sm transition-colors"
               >
                  <Trash size={16}/> DELETE
               </button>
               
               {/* Tags */}
               <div className="flex gap-2 ml-0 sm:ml-2 mt-2 sm:mt-0 flex-wrap">
                 {(currentBeat.tags || ['hard type beat', 'southside type beat', 'southside']).slice(0,3).map((tag, idx) => (
                    <span key={idx} className="bg-[#111111] border border-[#2a2a2a] text-neutral-300 rounded-full px-4 py-1 text-xs font-medium truncate max-w-[140px]">
                      {tag}
                    </span>
                 ))}
               </div>
            </div>
          </div>
        </div>
        
        {/* Waveform Section */}
        <div className="mt-12 mb-6 flex items-center gap-4">
          <div className="h-16 w-full cursor-pointer relative flex items-center flex-grow">
             <canvas 
               ref={canvasRef} 
               width={1200} 
               height={64} 
               className="w-full h-full object-cover" 
               onClick={handleProgressBarClick}
             />
          </div>
          <button 
             onClick={(e) => handleDeleteBeat(e, currentBeat)}
             title="Delete this beat"
             className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-red-900/10 text-red-500 hover:bg-red-900/30 transition-colors border border-red-900/20"
          >
             <Trash size={18} />
          </button>
        </div>
        
        {/* Comment Box */}
        <div className="flex items-center gap-4 bg-[#111] py-4 mb-6 border-b border-[#222] pb-8">
          <div className="w-10 h-10 bg-[#1a1a1a] rounded-full shrink-0 overflow-hidden flex items-center justify-center">
             <User size={20} className="text-neutral-500" />
          </div>
          <input 
            placeholder="Write a comment..." 
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-grow bg-transparent border-none outline-none text-white placeholder-neutral-500 text-sm" 
          />
          <span className="text-xs text-neutral-500 font-medium">{newComment.length}/240</span>
          <button 
            onClick={handleCommentSubmit}
            className="bg-[#9c27b0] hover:bg-[#ba68c8] font-bold px-6 py-2 rounded text-sm text-white transition-colors"
          >
            SEND
          </button>
        </div>
        
        {/* Collaborators */}
        <div className="mb-12">
          <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-4">Collaborators:</h3>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1a1a1a] rounded-full overflow-hidden shrink-0 flex items-center justify-center">
               <User size={20} className="text-neutral-500" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm text-neutral-200">{displayArtist}</span>
              <span className="text-[10px] text-neutral-500 font-bold uppercase mt-0.5">PRODUCER</span>
            </div>
          </div>
        </div>
        
        {/* Tabs and list */}
        <div className="mt-8 pt-4">
          <div className="flex justify-center gap-8 border-b border-[#222]">
             <button className="text-white font-medium tracking-wide text-xs border-b-[3px] border-white pb-4 px-2 uppercase">RELATED TRACKS</button>
             <button className="text-neutral-500 hover:text-neutral-300 font-medium tracking-wide text-xs pb-4 px-2 uppercase transition-colors">COMMENTS</button>
          </div>
          
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-400 min-w-[800px]">
               <thead>
                 <tr className="border-b border-[#222] text-[9px] font-bold uppercase tracking-widest text-neutral-500">
                    <th className="py-4 px-4 font-bold w-[40%]">TITLE</th>
                    <th className="py-4 px-4 font-bold w-[10%]">TIME</th>
                    <th className="py-4 px-4 font-bold w-[10%]">BPM</th>
                    <th className="py-4 px-4 font-bold w-[20%]">TAGS</th>
                    <th className="py-4 px-4 text-right w-[20%]"></th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-[#151515]">
                 {state.beats.map((beat, idx) => (
                   <tr key={beat.id ? `${beat.id}-${idx}` : idx} className="hover:bg-[#151515] transition-colors group">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-4">
                          <div className="relative w-10 h-10 bg-[#1a1a1a] overflow-hidden cursor-pointer group-hover:opacity-80 rounded" onClick={() => setCurrentBeatIndex(idx)}>
                            {beat.coverArtUrl ? <img src={beat.coverArtUrl} alt={beat.title} className="w-full h-full object-cover" /> : <Music size={16} />}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                               <Play size={16} fill="white" className="text-white" />
                            </div>
                          </div>
                          <span className="font-bold text-neutral-200 text-sm truncate max-w-[250px] cursor-pointer hover:underline" onClick={() => setCurrentBeatIndex(idx)}>{beat.title}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-neutral-500">
                        {beat.audioUrl ? "03:00" : "0:00"}
                      </td>
                      <td className="py-3 px-4 text-xs text-neutral-400">{beat.bpm || 120}</td>
                      <td className="py-3 px-4">
                         <div className="flex gap-2">
                           {(beat.tags || ['hard type']).slice(0, 2).map((t, i) => (
                             <span key={i} className="bg-[#111] border border-[#2a2a2a] text-neutral-400 rounded-full px-2.5 py-1 text-[10px] truncate max-w-[90px]">
                               {t}
                             </span>
                           ))}
                         </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                         <div className="flex justify-end items-center gap-3">
                            <button onClick={() => handleFreeDownload(beat)} className="text-neutral-500 hover:text-white transition-colors p-2">
                              <Download size={14} />
                            </button>
                            <button onClick={() => handleShareModalOpen(beat)} className="text-neutral-500 hover:text-white transition-colors p-2">
                              <Share2 size={14} />
                            </button>
                             <button onClick={(e) => handleDeleteBeat(e, beat)} className="text-red-500/70 hover:text-red-400 transition-colors p-2" title="Delete Beat">
                              <Trash size={14} />
                            </button>
                            <button onClick={() => handlePurchase(beat)} className="flex items-center justify-center gap-1 bg-[#9c27b0] hover:bg-[#ba68c8] text-white font-bold py-1.5 px-3 rounded text-[11px] ml-2 min-w-[70px] transition-colors">
                              <ShoppingCart size={12} /> $\{Number(beat.price).toFixed(2)}
                            </button>
                         </div>
                      </td>
                   </tr>
                 ))}
               </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-6 w-full max-w-md shadow-2xl text-white">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Share2 size={20} className="text-[#ba68c8]" /> Share Track
            </h3>
            <p className="text-sm text-neutral-400 mb-6">
              Share <strong className="text-white">{currentBeat.title}</strong> with your fans across your favorite social channels:
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {/* Twitter / X */}
              <a 
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this incredible beat: ${currentBeat.title} by ${currentBeat.producer}`)}&url=${encodeURIComponent(getShareUrl())}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#1da1f2]/20 border border-[#1da1f2]/50 hover:bg-[#1da1f2]/30 text-white p-3 rounded-lg flex items-center gap-3 font-semibold text-sm transition-colors"
              >
                <span>🐦</span> Twitter / X
              </a>

              {/* Facebook */}
              <a 
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#1877f2]/20 border border-[#1877f2]/50 hover:bg-[#1877f2]/30 text-white p-3 rounded-lg flex items-center gap-3 font-semibold text-sm transition-colors"
              >
                <span>📘</span> Facebook
              </a>

              {/* Instagram */}
              <button 
                onClick={async () => {
                  const shareText = `Check out "${currentBeat.title}" by ${currentBeat.producer}! 🎧🔥`;
                  const shareUrl = getShareUrl();
                  try {
                    await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
                    if (navigator.share) {
                      try {
                        await navigator.share({
                          title: currentBeat.title,
                          text: shareText,
                          url: shareUrl,
                        });
                        return;
                      } catch (err) {
                        // fallback
                      }
                    }
                    window.open('https://www.instagram.com/create/select/?source_url='+encodeURIComponent(shareUrl), '_blank');
                    setShareCopied(true);
                    setTimeout(() => setShareCopied(false), 3000);
                  } catch (err) {
                    window.open('https://www.instagram.com/create/select/?source_url='+encodeURIComponent(shareUrl), '_blank');
                  }
                }}
                className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-pink-500/50 hover:opacity-90 text-white p-3 rounded-lg flex items-center gap-3 font-semibold text-sm transition-colors relative"
              >
                <span>📸</span> Instagram
              </button>

              {/* Tumblr */}
              <a 
                href={`https://www.tumblr.com/widgets/share/tool?posttype=link&url=${encodeURIComponent(getShareUrl())}&caption=${encodeURIComponent(currentBeat.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#35465c]/30 border border-[#35465c]/60 hover:bg-[#35465c]/50 text-white p-3 rounded-lg flex items-center gap-3 font-semibold text-sm transition-colors"
              >
                <span>📌</span> Tumblr
              </a>
            </div>

            {/* Copy Link */}
            <div className="flex gap-2 mb-6">
              <input 
                type="text" 
                readOnly 
                value={getShareUrl()}
                className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs text-neutral-300 font-mono"
              />
              <button 
                onClick={copyShareLink}
                className="bg-[#9c27b0] hover:bg-[#ba68c8] text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                {shareCopied ? <Check size={14} /> : <Copy size={14} />}
                {shareCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <button 
              onClick={() => setShowShareModal(false)}
              className="w-full bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] text-white py-2.5 rounded-lg font-bold text-sm transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      <CheckoutErrorBoundary>
        <CheckoutModal 
          isOpen={!!checkoutBeat} 
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

      {/* Booking Funnel Modal */}
      {bookingModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[999999] flex items-center justify-center font-sans">
          <div className="bg-[#18181c] border-2 border-[#FFC439] rounded-2xl w-[440px] max-h-[90vh] overflow-y-auto p-[35px] text-white shadow-[0_10px_40px_rgba(0,0,0,0.8)] relative">
            {/* ==================== SCREEN A: THE PAY-PER-REQUEST RECHARGE GATE ==================== */}
            {bookingStep === 1 && (
              <div id="paywall-step" style={{ display: 'block' }}>
                  <div style={{ background: '#191922', padding: '20px', borderBottom: '1px solid #242432', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '8px 8px 0 0', margin: '-35px -35px 20px -35px' }}>
                      <div>
                          <h4 style={{ margin: 0, fontSize: '14px', color: '#ff4a4a' }}>⚠️ 0 REQUEST TOKENS REMAINING</h4>
                          <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#9292a6' }}>Buy an additional request slot to change your beat path</p>
                      </div>
                      <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff4a4a' }}>$69.55</span>
                  </div>
                  
                  <p style={{ fontSize: '13px', color: '#9292a6', lineHeight: 1.5, marginBottom: '20px' }}>
                      Your first initial custom beat request has already been used. To unlock a brand new project revision slot, clear the PayPal processing gateway fee below.
                  </p>

                  {/* Itemized Order Summary Box */}
                  <div style={{ background: '#191922', borderRadius: '8px', padding: '16px', marginBottom: '24px', border: '1px solid #242432' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '10px' }}>
                          <span style={{ color: '#9292a6' }}>Additional Production Token</span>
                          <span style={{ fontWeight: 600 }}>$69.55</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #242432' }}>
                          <span style={{ color: '#9292a6' }}>Processing Fees / VAT</span>
                          <span style={{ color: '#00e676', fontWeight: 600 }}>$0.00</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold' }}>
                          <span>Total Due Today:</span>
                          <span style={{ color: '#00e676', fontSize: '16px' }}>$69.55</span>
                      </div>
                  </div>

                  {/* Live PayPal Mount */}
                  <div id="paypal-smart-button-mount" style={{ marginBottom: '15px', position: 'relative', zIndex: 10 }}>
                      <PayPalScriptProvider options={{ clientId: "test", currency: "USD" }}>
                          <PayPalButtons 
                              createOrder={(data, actions) => {
                                  return actions.order.create({
                                      intent: "CAPTURE",
                                      purchase_units: [{
                                          amount: {
                                              value: '69.55',
                                              currency_code: 'USD'
                                          },
                                          description: "Additional Custom Beat Request Token Reload"
                                      }]
                                  });
                              }}
                              onApprove={async (data, actions) => {
                                  if (actions.order) {
                                      const details = await actions.order.capture();
                                      console.log("💰 Payment Cleared! Crediting user profile with 1 token.");
                                      setUserAvailableTokens(1);
                                      setIsReloaded(true);
                                      loadFunnelStep(2);
                                  }
                              }}
                              onError={(err) => {
                                  console.error("PayPal Processing Halted: ", err);
                                  alert("Checkout initialization encountered a localized network bottleneck.");
                              }}
                              style={{ layout: 'vertical', color: 'gold', shape: 'pill', label: 'checkout' }}
                          />
                      </PayPalScriptProvider>
                  </div>
              </div>
            )}

            {/* ==================== SCREEN B: THE REQUEST MESSAGE WALL ==================== */}
            {bookingStep === 2 && (
              <div id="message-wall-step" style={{ display: 'block' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <h3 style={{ margin: 0, color: '#00e676', fontSize: '20px' }}>🔓 Message Wall Active</h3>
                      <span id="token-badge" style={{ background: isReloaded ? '#FFC439' : (userAvailableTokens > 0 ? '#00e676' : '#FFC439'), color: '#111', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' }}>
                          {isReloaded ? 'RELOADED CREDIT UNLOCKED' : (userAvailableTokens > 0 ? `${userAvailableTokens} REQUEST AVAILABLE` : '0 REQUEST TOKENS REMAINING')}
                      </span>
                  </div>
                  
                  <form onSubmit={(e) => {
                      e.preventDefault();
                      
                      const signatureText = contractSig.trim();
                      if(!contractCheck || signatureText.length < 3) {
                          alert("You must check the agreement box and type your legal signature to authorize production.");
                          return;
                      }
                      
                      const requestData = {
                          link: bookingLinks,
                          bpm: bookingBpm,
                          notes: bookingScope,
                          legalSignature: signatureText,
                          agreementTimestamp: new Date().toISOString()
                      };
                      
                      console.log("📨 Executed Legal Package Saved to Studio Database:", requestData);
                      alert(`Contract signed by ${signatureText}! Your request has been securely submitted.`);
                      
                      setUserAvailableTokens(0);
                      setIsReloaded(false);
                      setBookingModalOpen(false);
                      loadFunnelStep(1); // Reset for next time
                      
                      // clear form
                      setBookingLinks('');
                      setBookingBpm('120');
                      setBookingScope('');
                      setContractCheck(false);
                      setContractSig('');
                  }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#aaa' }}>Reference Track URL:</label>
                      <input 
                          type="url" 
                          value={bookingLinks}
                          onChange={(e) => setBookingLinks(e.target.value)}
                          placeholder="YouTube or Spotify link" 
                          required 
                          style={{ width: '100%', padding: '12px', background: '#252529', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff', marginBottom: '15px', boxSizing: 'border-box' }} 
                      />

                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#aaa' }}>Target BPM:</label>
                      <input 
                          type="text" 
                          value={bookingBpm}
                          onChange={(e) => setBookingBpm(e.target.value)}
                          placeholder="e.g., 140" 
                          required 
                          style={{ width: '100%', padding: '12px', background: '#252529', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff', marginBottom: '15px', boxSizing: 'border-box' }} 
                      />

                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#aaa' }}>What do you want changed or created? (Details):</label>
                      <textarea 
                          value={bookingScope}
                          onChange={(e) => setBookingScope(e.target.value)}
                          placeholder="Be descriptive. Submitting this form consumes 1 request token..." 
                          rows={3} 
                          required 
                          style={{ width: '100%', padding: '12px', background: '#252529', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff', marginBottom: '20px', resize: 'none', boxSizing: 'border-box', lineHeight: 1.4 }} 
                      ></textarea>

                      {/* EXPLICIT LEGAL PRO-PAGE CONTRACT CARD SECTION */}
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#FFC439', fontWeight: 'bold' }}>📝 Mandatory Production Agreement:</label>
                      <div style={{ background: '#111116', border: '1px solid #3f3f46', borderRadius: '8px', padding: '12px', height: '110px', overflowY: 'scroll', fontSize: '11px', color: '#ccc', lineHeight: 1.5, marginBottom: '15px', boxSizing: 'border-box', fontFamily: 'monospace' }}>
                          <strong>SECTION 1: EXCLUSIVE PRIVACY CLAUSE</strong><br/>
                          Upon delivery of the custom audio track file, the purchasing Client is strictly prohibited from sharing, copying, leaking, sending, or distributing the audio source data to any third-party individuals, web entities, or networks. This audio asset is created solely and exclusively for your personal use.<br/><br/>
                          <strong>SECTION 2: VIOLATION PENALTY & PERMANENT BLACKLIST</strong><br/>
                          If the client attempts to distribute, leak, or share this custom beat asset with anyone else, the Producer reserves the complete right to immediately terminate the project contract. Furthermore, the Client will be permanently banned and restricted from purchasing or acquiring any future custom beats from this studio space indefinitely.
                      </div>

                      {/* Signature Consent Input Elements */}
                      <div style={{ background: '#191922', padding: '12px', borderRadius: '8px', border: '1px solid #242432', marginBottom: '20px' }}>
                          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: '#fff', cursor: 'pointer', marginBottom: '10px' }}>
                              <input type="checkbox" id="contract-check" required style={{ marginTop: '2px' }} checked={contractCheck} onChange={(e) => setContractCheck(e.target.checked)} />
                              <span>I agree to the privacy restrictions and understand a leak results in a permanent custom beat ban.</span>
                          </label>
                          <input type="text" id="contract-sig" placeholder="Type Full Legal Name to Sign" required style={{ width: '100%', padding: '8px 12px', background: '#252529', border: '1px solid #3f3f46', borderRadius: '6px', color: '#fff', fontSize: '12px', boxSizing: 'border-box' }} value={contractSig} onChange={(e) => setContractSig(e.target.value)} />
                      </div>

                      <button type="submit" style={{ width: '100%', background: '#4e73df', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
                          Sign & Send Request Elements
                      </button>
                  </form>
              </div>
            )}

            <button 
              onClick={() => setBookingModalOpen(false)}
              className="absolute top-[15px] right-[15px] bg-transparent border-none text-[#ff4a4a] text-[24px] font-bold cursor-pointer hover:text-red-400"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
