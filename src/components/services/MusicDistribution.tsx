import React, { useState } from 'react';
import { Send, Globe } from 'lucide-react';

export const MusicDistributionServices = () => {
  const [songTitle, setSongTitle] = useState('');
  const [artistName, setArtistName] = useState('');

  const handleDistribute = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Distribution initiated for "${songTitle}" by ${artistName}.`);
  };

  return (
    <div className="space-y-8 text-white">
      <h2 className="text-3xl font-bold">Music Distribution</h2>
      <p className="text-neutral-400">Ready to distribute your music to global platforms?</p>
      
      <form onSubmit={handleDistribute} className="space-y-4 p-6 bg-neutral-900 rounded-2xl border border-neutral-800">
        <input 
          type="text" 
          value={songTitle}
          onChange={(e) => setSongTitle(e.target.value)}
          placeholder="Track Title"
          className="w-full p-3 bg-neutral-950 rounded-lg border border-neutral-800"
        />
        <input 
          type="text" 
          value={artistName}
          onChange={(e) => setArtistName(e.target.value)}
          placeholder="Artist Name"
          className="w-full p-3 bg-neutral-950 rounded-lg border border-neutral-800"
        />
        <button type="submit" className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold">
          <Send className="w-4 h-4" /> Distribute
        </button>
      </form>
    </div>
  );
};
