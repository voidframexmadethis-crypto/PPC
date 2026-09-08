import React from 'react';
import { Play, Pause, ShoppingCart, Download, ThumbsUp, Music } from 'lucide-react';
import { Beat } from '../../types';

interface TrackRowProps {
  key?: string;
  rank: number;
  beat: Beat;
  isPlaying: boolean;
  onTogglePlay: (beat: Beat) => void;
  onPurchase: (beat: Beat) => void;
  onFreeDownload: (beat: Beat) => void;
  onLike: (beat: Beat) => void;
}

export const TrackRow = ({ rank, beat, isPlaying, onTogglePlay, onPurchase, onFreeDownload, onLike }: TrackRowProps) => (
  <div className={`group flex items-center gap-6 p-4 rounded-xl border border-neutral-800/50 hover:border-indigo-500/50 transition-all hover:bg-neutral-900/50 ${isPlaying ? 'bg-neutral-900 border-indigo-500/30' : ''}`}>
    <div className="text-2xl font-black text-neutral-600 tabular-nums w-8 flex-shrink-0 group-hover:text-indigo-500 transition-colors">
      {String(rank).padStart(2, '0')}
    </div>
    
    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 relative">
      {beat.coverArtUrl ? (
        <img src={beat.coverArtUrl} alt={beat.title} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-neutral-600">
          <Music size={24} />
        </div>
      )}
      <button 
        onClick={() => onTogglePlay(beat)}
        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {isPlaying ? <Pause size={24} className="text-white" /> : <Play size={24} className="text-white ml-1" />}
      </button>
    </div>

    <div className="flex-grow min-w-0">
      <h3 className="font-bold text-white text-lg truncate">{beat.title}</h3>
      <p className="text-neutral-400 text-sm truncate">{beat.producer}</p>
    </div>

    <div className="hidden md:flex gap-8 text-neutral-400 text-sm font-medium">
      <span>{beat.bpm || 120} BPM</span>
      <span className="tabular-nums">{beat.plays || 0} plays</span>
    </div>

    <div className="flex items-center gap-3">
      <button onClick={() => onLike(beat)} className="text-neutral-600 hover:text-indigo-400">
        <ThumbsUp size={18} />
      </button>
      <button onClick={() => onPurchase(beat)} className="bg-neutral-800 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all">
        ${Number(beat.price).toFixed(2)}
      </button>
    </div>
  </div>
);
