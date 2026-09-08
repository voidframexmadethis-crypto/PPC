import React, { useState } from 'react';
import { Plus, Tag } from 'lucide-react';

export const FlashSaleStudio = () => {
  const [sales, setSales] = useState<any[]>([]); // Initialize with existing sales from DB

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Flash Sale Studio</h2>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold">
          <Plus className="w-4 h-4" /> Create Flash Sale
        </button>
      </div>
      <div className="space-y-4">
        {sales.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">No flash sales scheduled.</div>
        ) : (
          sales.map((sale) => (
            <div key={sale.id} className="p-4 bg-neutral-950 rounded-xl border border-neutral-800">
                {/* Sale details */}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
