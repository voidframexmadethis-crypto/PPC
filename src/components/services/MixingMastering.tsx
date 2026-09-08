import React from 'react';

export const MixingMasteringServices = () => (
  <div className="space-y-6 text-white">
    <h2 className="text-3xl font-bold">Mixing & Mastering</h2>
    <div className="grid md:grid-cols-2 gap-6">
      <div className="p-6 bg-neutral-900 rounded-2xl border border-neutral-800">
        <h3 className="text-xl font-bold mb-4">Mixing</h3>
        <p className="text-neutral-400">Professional balance, EQ, compression, and effects to make your tracks shine.</p>
      </div>
      <div className="p-6 bg-neutral-900 rounded-2xl border border-neutral-800">
        <h3 className="text-xl font-bold mb-4">Mastering</h3>
        <p className="text-neutral-400">Final loudness, sonic polish, and format conversion for streaming platforms.</p>
      </div>
    </div>
  </div>
);
