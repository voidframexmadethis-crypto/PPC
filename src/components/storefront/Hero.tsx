import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

export const Hero = () => (
  <div className="relative overflow-hidden bg-neutral-950 border-b border-neutral-800">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#4338ca_0%,transparent_70%)] opacity-30"></div>
    <div className="relative max-w-7xl mx-auto px-8 py-24 text-center">
      <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tighter mb-4 uppercase">NightRunna</h1>
      <p className="text-xl text-neutral-400 mb-8 max-w-2xl mx-auto font-medium">PRODUCE DIFFERENT. SECURE YOUR SOUND.</p>
      <div className="flex gap-4 justify-center">
        <a href="#featured" className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2">
          EXPLORE BEATS <ArrowRight size={18} />
        </a>
        <a href="#latest" className="bg-neutral-800 text-white px-8 py-3 rounded-lg font-bold hover:bg-neutral-700 transition-colors">
          LATEST DROPS
        </a>
      </div>
    </div>
  </div>
);
