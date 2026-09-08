import React, { useState } from 'react';
import { Award } from 'lucide-react';

export const PlaqueStudio = () => {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6">
      <h2 className="text-xl font-bold text-white mb-6">Certified Plaque Studio</h2>
      <div className="text-center py-12 text-neutral-500">
        <Award className="w-12 h-12 mx-auto mb-4 text-neutral-700" />
        <p>Private plaque certification management area.</p>
      </div>
    </div>
  );
};
