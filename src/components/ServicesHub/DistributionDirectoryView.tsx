import React from 'react';
import { ExternalLink, Zap, Info } from 'lucide-react';

const distributors = [
  { name: 'DistroKid', description: 'Fast, unlimited distribution.', website: 'https://distrokid.com' },
  { name: 'TuneCore', description: 'Keep 100% of your royalties.', website: 'https://tunecore.com' },
  { name: 'CD Baby', description: 'Extensive retail & sync distribution.', website: 'https://cdbaby.com' },
  { name: 'Amuse', description: 'Free distribution with advanced tiers.', website: 'https://amuse.io' },
];

export const DistributionDirectoryView = () => (
  <div className="space-y-6">
    <div className="bg-gradient-to-r from-indigo-900/20 to-neutral-900 p-6 rounded-xl border border-neutral-800">
      <h2 className="text-2xl font-bold text-white mb-2">Music Distribution</h2>
      <p className="text-neutral-400">Discover trusted platforms to get your music on streaming services.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {distributors.map(dist => (
        <div key={dist.name} className="bg-neutral-800/50 p-5 rounded-lg border border-neutral-700 hover:border-indigo-500 transition-colors">
          <h3 className="text-lg font-bold text-white mb-2">{dist.name}</h3>
          <p className="text-sm text-neutral-400 mb-4">{dist.description}</p>
          <a href={dist.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-indigo-400 text-sm font-bold hover:text-indigo-300">
            Visit Website <ExternalLink size={14} />
          </a>
        </div>
      ))}
    </div>
  </div>
);
