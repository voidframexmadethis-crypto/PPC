import React, { useState } from 'react';
import { StemsHubView } from './StemsHubView';
import { AnRPortalView } from './AnRPortalView';
import { PlaylistCuratorView, ManagerJoinView } from './AdditionalViews';
import { MarketplaceView } from './MarketplaceView';
import { DistributionDirectoryView } from './DistributionDirectoryView';
import { JoinNetworkView } from './JoinNetworkView';
import { MixingMasteringServices } from '../services/MixingMastering';
import { MusicDistributionServices } from '../services/MusicDistribution';

export const ServicesHub = () => {
  const [activeTab, setActiveTab] = useState('join');

  const renderView = () => {
    switch (activeTab) {
      case 'marketplace': return <MarketplaceView />;
      case 'anr_portal': return <AnRPortalView />;
      case 'engineering': return <StemsHubView />;
      case 'playlist_curator': return <PlaylistCuratorView />;
      case 'manager_join': return <ManagerJoinView />;
      case 'distribution': return <DistributionDirectoryView />;
      case 'mixing_mastering': return <MixingMasteringServices />;
      case 'distro': return <MusicDistributionServices />;
      case 'join': return <JoinNetworkView />;
      default: return <JoinNetworkView />;
    }
  };

  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-2 mb-8 p-1 bg-neutral-950 border border-neutral-800 rounded-2xl w-fit">
        {[
          { id: 'join', label: 'Join Network' },
          { id: 'distribution', label: 'Music Distribution' },
          { id: 'marketplace', label: 'Beats Marketplace' },
          { id: 'anr_portal', label: 'A&R Room' },
          { id: 'engineering', label: 'Engineering Stems Hub' },
          { id: 'mixing_mastering', label: 'Mixing & Mastering' },
          { id: 'distro', label: 'Music Distribution' },
        ].map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === tab.id 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <div className="p-8 bg-neutral-950/50 rounded-3xl border border-neutral-800 backdrop-blur-sm shadow-xl">
        {renderView()}
      </div>
    </div>
  );
};
