import React from 'react';
import { Play, Pause, ShoppingCart, Download, ThumbsUp } from 'lucide-react';
import { Beat } from '../../types';

interface BeatCardProps {
  key?: string | number;
  beat: Beat;
  isPlaying: boolean;
  onTogglePlay: (beat: Beat) => void;
  onPurchase: (beat: Beat) => void;
  onFreeDownload: (beat: Beat) => void;
  onLike: (beat: Beat) => void;
}

export const BeatCard = ({ beat, isPlaying, onTogglePlay, onPurchase, onFreeDownload, onLike }: BeatCardProps) => (
  <div className="group relative bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden hover:border-indigo-500/50 transition-all hover:shadow-2xl hover:shadow-indigo-900/10">
    <div className="aspect-square relative overflow-hidden">
      {beat.coverArtUrl ? (
        <img src={beat.coverArtUrl} alt={beat.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      ) : (
        <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-neutral-600">No Art</div>
      )}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <button onClick={() => onTogglePlay(beat)} className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform">
          {isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
        </button>
      </div>
    </div>
    <div className="p-4">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-white text-lg truncate flex-1">{beat.title}</h3>
        <button onClick={() => onLike(beat)} className="text-neutral-500 hover:text-indigo-400"><ThumbsUp size={16} /></button>
      </div>
      <p className="text-neutral-400 text-sm mb-4">{beat.producer}</p>
      
      <div className="flex justify-between items-center">
        <button onClick={() => onPurchase(beat)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2">
          <ShoppingCart size={14} /> ${Number(beat.price).toFixed(2)}
        </button>
        {beat.freeDownload?.enabled && (
          <button onClick={() => onFreeDownload(beat)} className="text-neutral-400 hover:text-white">
            <Download size={18} />
          </button>
        )}
      </div>
    </div>
  </div>
);
