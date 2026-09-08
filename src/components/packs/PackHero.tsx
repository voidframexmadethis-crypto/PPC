import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

export const PackHero = () => (
  <div className="relative overflow-hidden bg-neutral-950 border-b border-neutral-800">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#4338ca_0%,transparent_70%)] opacity-40"></div>
    <div className="relative max-w-7xl mx-auto px-8 py-32 text-center">
      <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-6 uppercase">Beat Packs</h1>
      <p className="text-xl md:text-2xl text-neutral-400 mb-10 max-w-3xl mx-auto font-medium tracking-wide">
        Curated collections of production-ready sounds built for producers who refuse to sound ordinary.
      </p>
      <div className="flex gap-4 justify-center">
        <a href="#explore" className="bg-indigo-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all hover:scale-105 flex items-center gap-2 shadow-[0_0_20px_rgba(79,70,229,0.4)]">
          EXPLORE COLLECTIONS <ArrowRight size={20} />
        </a>
      </div>
    </div>
  </div>
);
