import React from 'react';
import { Play, ShoppingCart } from 'lucide-react';

interface Pack {
  id: string;
  title: string;
  description: string;
  coverArtUrl: string;
  price: number;
}

interface PackCardProps {
  key?: string | number;
  pack: Pack;
}

export const PackCard = ({ pack }: PackCardProps) => (
  <div className="group relative bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden hover:border-indigo-500/50 transition-all hover:shadow-2xl hover:shadow-indigo-900/10 flex flex-col">
    <div className="aspect-square relative overflow-hidden">
      <img src={pack.coverArtUrl} alt={pack.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <button className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform">
          <Play size={28} className="ml-1" />
        </button>
      </div>
    </div>
    <div className="p-5 flex flex-col flex-grow">
      <h3 className="font-bold text-white text-lg mb-1">{pack.title}</h3>
      <p className="text-neutral-400 text-sm mb-4 flex-grow">{pack.description}</p>
      
      <div className="flex justify-between items-center mt-auto">
        <span className="font-bold text-white text-lg">${Number(pack.price).toFixed(2)}</span>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2">
          <ShoppingCart size={14} /> Buy
        </button>
      </div>
    </div>
  </div>
);
