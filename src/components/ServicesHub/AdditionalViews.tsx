import React, { useState } from 'react';

export const PlaylistCuratorView = () => {
  const [genreLink, setGenreLink] = useState('');
  return (
    <div className="text-white space-y-4">
      <h2 className="text-xl font-bold">Playlist Curator Submission</h2>
      <input className="w-full bg-neutral-800 p-2 rounded" placeholder="Target Genre/Playlist Link" value={genreLink} onChange={e => setGenreLink(e.target.value)} />
      <button className="bg-indigo-600 px-4 py-2 rounded">Submit Targeting</button>
    </div>
  );
};

export const ManagerJoinView = () => (
  <div className="text-white space-y-4">
    <h2 className="text-xl font-bold">Manager Join / Label Application</h2>
    <p>Submit your management portfolio here.</p>
    <button className="bg-indigo-600 px-4 py-2 rounded">Submit Portfolio</button>
  </div>
);
