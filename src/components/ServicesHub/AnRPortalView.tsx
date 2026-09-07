import React, { useState } from 'react';

export const AnRPortalView = () => {
  const [bio, setBio] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [demoLink, setDemoLink] = useState('');

  return (
    <div className="text-white space-y-4">
      <h2 className="text-xl font-bold">A&R & Label Joining</h2>
      <input className="w-full bg-neutral-800 p-2 rounded" placeholder="Bio" value={bio} onChange={e => setBio(e.target.value)} />
      <textarea className="w-full bg-neutral-800 p-2 rounded" placeholder="Lyrics" value={lyrics} onChange={e => setLyrics(e.target.value)} />
      <input className="w-full bg-neutral-800 p-2 rounded" placeholder="Demo Link" value={demoLink} onChange={e => setDemoLink(e.target.value)} />
      <button className="bg-indigo-600 px-4 py-2 rounded">Submit Submission</button>
    </div>
  );
};
