import React, { useState } from 'react';
import { Play, Pause, Search, ShoppingBag, CheckCircle, SlidersHorizontal, ChevronRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useAudioPlayer } from '../context/AudioPlayerContext';

const CATEGORIES = [
  { id: 'freestyle-trap', name: 'Freestyle Trap Type Beats', img: '/IMG_3627.png' },
  { id: 'free-type-beats', name: 'Free Type Beats', img: '/IMG_3628.png' },
  { id: 'freestyle-inst', name: 'Freestyle Instrumentals', img: '/IMG_3629.png' },
  { id: 'freestyle-inst-rap', name: 'Freestyle Instrumental Rap Beats', img: '/IMG_3630.png' },
  { id: 'rap-type-beat', name: 'Rap Type Beat', img: '/IMG_3631.png' },
  { id: 'free-profit-rap', name: 'Free For Profit Rap Type Beat', img: '/IMG_3632.png' },
  { id: 'type-beat', name: 'Type Beat', img: '/IMG_3633.png' },
  { id: 'free-rap-2026', name: 'Free Rap Type Beat 2026', img: '/IMG_3627.png' }
];

const TAGS = ['freestyle', 'trap', 'type beat', 'free', 'instrumental', 'rap', 'free for profit', '2026'];

const COLLECTIONS = [
  { id: 1, title: 'deep.reasoning album', producer: 'soSpecial', tracks: 10, price: 149.00, img: '/IMG_3628.png', isAd: false, verified: true },
  { id: 2, title: 'DISSEASON', producer: 'kenny', tracks: 18, price: 190.00, img: '/IMG_3629.png', isAd: false, verified: false },
  { id: 3, title: '50 BEATS FOR $50 🔥 JUICE...', producer: 'waytoolost', tracks: 43, price: 50.00, img: '/IMG_3630.png', isAd: false, verified: true },
  { id: 4, title: 'MOST EMOTIONAL BEATS I...', producer: 'WuErbe', tracks: 6, price: 49.99, img: '/IMG_3631.png', isAd: false, verified: false },
  { id: 5, title: '200 BEATS FOR $49', producer: 'BrekBeats', tracks: 200, price: 49.00, img: '/IMG_3632.png', isAd: true, verified: false },
  { id: 6, title: '5 BEATS FOR 15$ | B...', producer: 'Cloud', tracks: 5, price: 15.00, img: '/IMG_3633.png', isAd: true, verified: false },
  { id: 7, title: 'TOO VAIN', producer: 'djshaboogie', tracks: 5, price: 50.00, img: '/IMG_3627.png', isAd: true, verified: false },
  { id: 8, title: '100 BEATS FOR $90', producer: 'Bargholz', tracks: 100, price: 90.00, img: '/IMG_3628.png', isAd: false, verified: false },
  { id: 9, title: 'Platinum Beat Bundle', producer: 'JIJbeats', tracks: 40, price: 50.00, img: '/IMG_3629.png', isAd: false, verified: true },
  { id: 10, title: '10 Beats With Hooks', producer: 'Freek van Worku...', tracks: 10, price: 50.00, img: '/IMG_3630.png', isAd: false, verified: true },
  { id: 11, title: 'West Coast Beat Tape', producer: 'JOKA BEATZ', tracks: 11, price: 29.99, img: '/IMG_3631.png', isAd: false, verified: false },
  { id: 12, title: 'THE BEST LOVE SONG BEATS', producer: 'mengsonbeats', tracks: 10, price: 27.00, img: '/IMG_3632.png', isAd: false, verified: false },
];

export default function Collections() {
  const [activeCircle, setActiveCircle] = useState<string | null>(null);
  const { state } = useStore();
  const { currentTrack, isPlaying, togglePlay, playTrack } = useAudioPlayer();

  const dynamicCategories = state.beats.map((beat) => ({
    id: beat.id,
    name: beat.title,
    img: beat.coverArtUrl || '/IMG_3627.png',
    beat: beat,
  }));
  const allCategories = [...dynamicCategories, ...CATEGORIES];

  const dynamicCollections = state.beats.map((beat) => ({
    id: beat.id,
    title: beat.title,
    producer: beat.producer || 'NightRunna',
    tracks: 1,
    price: beat.price || 0,
    img: beat.coverArtUrl || '/IMG_3627.png',
    isAd: false,
    verified: true,
    beat: beat,
  }));
  const allCollections = [...dynamicCollections, ...COLLECTIONS];

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Explore Collections</h1>
          <button className="text-sm font-medium text-neutral-400 hover:text-white flex items-center gap-1 transition-colors bg-neutral-900/50 hover:bg-neutral-800 px-4 py-2 rounded-full border border-neutral-800">
            Hide <ChevronRight size={16} className="rotate-90" />
          </button>
        </div>

        {/* CIRCULAR CATEGORIES CAROUSEL */}
        <div className="flex gap-4 md:gap-8 overflow-x-auto pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
          {allCategories.map((cat: any) => {
            const isCurrentlyPlaying = cat.beat ? (currentTrack?.id === cat.id && isPlaying) : (activeCircle === cat.id);
            
            return (
              <div 
                key={cat.id}
                className="flex flex-col items-center gap-4 cursor-pointer group flex-shrink-0"
                onClick={() => {
                  if (cat.beat) {
                    if (currentTrack?.id === cat.id) {
                      togglePlay();
                    } else {
                      playTrack(cat.beat);
                    }
                  } else {
                    setActiveCircle(isCurrentlyPlaying ? null : cat.id);
                  }
                }}
              >
                <div className={`w-24 h-24 md:w-36 md:h-36 rounded-full relative p-1 transition-all duration-300 ${isCurrentlyPlaying ? 'border-indigo-500' : 'border-transparent group-hover:border-neutral-700'} border-2`}>
                  <div className="w-full h-full rounded-full overflow-hidden relative bg-neutral-900 shadow-2xl isolate">
                    <img 
                      src={cat.img} 
                      alt={cat.name}
                      className={`w-full h-full object-cover transition-transform duration-700 ${isCurrentlyPlaying ? 'animate-[spin_4s_linear_infinite]' : 'group-hover:scale-110'}`}
                    />
                    
                    {/* Vinyl Record Effect when playing */}
                    {isCurrentlyPlaying && (
                      <div className="absolute inset-0 z-10">
                        <div className="absolute inset-0 rounded-full border-[10px] md:border-[16px] border-black/30 mix-blend-overlay pointer-events-none" />
                        <div className="absolute inset-0 rounded-full border-[20px] md:border-[32px] border-black/20 mix-blend-overlay pointer-events-none" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-6 h-6 md:w-10 md:h-10 bg-neutral-950 rounded-full border border-neutral-800 flex items-center justify-center shadow-inner">
                            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-neutral-800 rounded-full" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Dark gradient overlay for non-playing hover */}
                    {!isCurrentlyPlaying && (
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors z-0" />
                    )}
                  </div>
                </div>
                <span className={`text-sm md:text-base font-semibold tracking-tight transition-colors ${isCurrentlyPlaying ? 'text-indigo-400' : 'text-neutral-400 group-hover:text-white'}`}>
                  {cat.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* SEARCH & TAGS TOOLBAR */}
        <div className="flex flex-col xl:flex-row xl:items-center gap-4 my-10 border-t border-neutral-900 pt-8">
          {/* Search Bar */}
          <div className="relative w-full xl:w-72 flex-shrink-0">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={18} className="text-neutral-500" />
            </div>
            <input 
              type="text" 
              placeholder="Search for tags..." 
              className="w-full bg-[#111111] border border-neutral-800 text-white text-sm rounded-full pl-11 pr-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-neutral-600 font-medium"
            />
          </div>

          {/* Tags Carousel */}
          <div className="flex-1 flex items-center gap-2 overflow-x-auto hide-scrollbar pb-2 xl:pb-0 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
            {TAGS.map((tag) => (
              <button 
                key={tag} 
                className="whitespace-nowrap px-5 py-2.5 rounded-full bg-[#111111] border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600 text-sm font-semibold tracking-wide capitalize transition-all active:scale-95"
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Filter Action */}
          <div className="flex items-center gap-2 flex-shrink-0 ml-auto xl:ml-0">
            <button className="w-11 h-11 rounded-full border border-neutral-800 bg-[#111111] flex items-center justify-center text-neutral-400 hover:text-white hover:border-neutral-600 transition-colors">
              <SlidersHorizontal size={18} />
            </button>
          </div>
        </div>

        {/* COLLECTIONS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-12">
          {allCollections.map((item: any) => {
            const isCurrentlyPlaying = item.beat && currentTrack?.id === item.id && isPlaying;
            
            return (
            <div key={item.id} className="flex flex-col group w-full cursor-pointer">
              
              {/* Image Container with Folder Sleeve Effect */}
              <div className="relative w-full aspect-square mb-4 isolate">
                {/* Folder Sleeve Tab (Behind) */}
                <div className="absolute -top-2 left-6 right-6 h-4 bg-[#141414] border-t border-l border-r border-[#262626] rounded-t-lg -z-10 transition-transform duration-300 group-hover:-translate-y-2 opacity-80" />
                
                {/* Main Image */}
                <div className="relative w-full h-full rounded-xl bg-neutral-900 border border-[#262626] overflow-hidden shadow-2xl z-10">
                  <img src={item.img} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.beat) {
                          if (currentTrack?.id === item.id) {
                            togglePlay();
                          } else {
                            playTrack(item.beat);
                          }
                        }
                      }}
                      className="w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center text-white transition-transform duration-300 transform group-hover:scale-110 active:scale-95 shadow-2xl"
                    >
                      {isCurrentlyPlaying ? (
                         <Pause fill="currentColor" size={24} className="ml-1" />
                      ) : (
                         <Play fill="currentColor" size={24} className="ml-1" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Meta Info */}
              <div className="flex flex-col gap-1.5 px-1 mb-4 flex-1">
                <h3 className="font-bold text-white text-[15px] truncate tracking-tight">{item.title}</h3>
                <div className="flex items-center gap-1.5 text-[13px] text-neutral-400 font-medium truncate">
                  {item.isAd && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-neutral-800 text-neutral-300 border border-neutral-700 tracking-wider">
                      AD
                    </span>
                  )}
                  <span className="truncate">{item.producer}</span>
                  {item.verified && (
                    <CheckCircle size={14} className="text-blue-500 flex-shrink-0" fill="currentColor" stroke="black" />
                  )}
                  <span className="text-neutral-600 mx-0.5">•</span>
                  <span className="flex-shrink-0">{item.tracks} Tracks</span>
                </div>
              </div>

              {/* Price Action Button */}
              <button className="w-full py-2.5 px-4 rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] hover:bg-[#111] hover:border-indigo-500/50 hover:text-indigo-400 transition-all duration-300 flex items-center justify-center gap-2 text-sm font-bold text-white">
                <ShoppingBag size={16} />
                ${typeof item.price === 'number' ? item.price.toFixed(2) : '0.00'}
              </button>
            </div>
          );
        })}
        </div>

      </div>
    </div>
  );
}
