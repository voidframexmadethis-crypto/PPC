import React from 'react';
import { PackHero } from '../components/packs/PackHero';
import { PackCard } from '../components/packs/PackCard';

export default function BeatPacks() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <PackHero />
      <div className="max-w-7xl mx-auto px-8 py-12">
        <section id="explore">
          <h2 className="text-3xl font-bold mb-8">All Collections</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <p className="text-neutral-500">No beat packs available at the moment.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
