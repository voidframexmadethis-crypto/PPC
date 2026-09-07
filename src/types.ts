export interface SocialLink {
  id: string;
  platform: string;
  url: string;
}

export interface MarketingConfig {
  autoPostVideo: boolean;
  youtubeVideoGen: boolean;
  tiktokVideoGen: boolean;
  youtubeTargetChannel: string;
  tiktokTargetChannel: string;
  youtubeCompanionUrl: string;
  soundcloudSyncLink: string;
  audiomackEmbedCode: string;
  tiktokTrendingAudioSync: string;
  dspDistributionOptIn: boolean;
  spotifyArtistLink: string;
  appleMusicArtistLink: string;
  upcCoreField: string;
  googleAnalyticsCode: string;
  metaPixelId: string;
  googleAdsTracker: string;
  pinterestTagId: string;
  tiktokPixelId: string;
  utmCampaignBuilder: string;
  smartLinkShortUrl: string;
  autoSocialCopy: string;
  directCheckoutShortcut: string;
  emailReceiptLayout: 'Standard' | 'Compact' | 'Custom';
  mailingListTrigger: boolean;
  socialShareArray: string;
  rssPodcastFeed: boolean;
  airbitFeaturedBid: string;
  localStorageBackupRegistry: boolean;
  tosComplianceMatrix: boolean;
}

export interface Profile {
  name: string;
  bio: string;
  avatarUrl: string;
  voiceTagUrl?: string;
  paypalEmail?: string;
  socialLinks: SocialLink[];
  marketingConfig?: MarketingConfig;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  videoId: string;
}

export interface License {
  type: string;
  price: number;
  agreementUrl?: string;
}

export interface Tier {
  level: string;
  price: number;
}

export interface BulkDiscount {
  threshold: number;
  discountPercentage: number;
}

export interface SocialUnlock {
  id: string;
  requiredAction: 'SPOTIFY_FOLLOW' | 'YOUTUBE_SUBSCRIBE' | 'EMAIL_LIST';
  targetAccountId: string;
  freeDownloadFileType: 'MP3' | 'WAV';
}

export interface Beat {
  id: string;
  title: string;
  producer: string;
  bpm: number;
  key: string;
  mode?: string;
  price: number;
  coverArtUrl: string;
  audioUrl: string; // The URL to play (tagged MP3)
  untaggedWavUrl?: string; // High quality untagged WAV
  stemsZipUrl?: string; // ZIP file with stems
  watermarkedAudioUrl?: string; // Watermarked version for preview
  visibility: 'Public' | 'Private' | 'Unlisted';
  trackType: 'Beat' | 'Chorus' | 'Song' | 'Top Line' | 'Vocals';
  licenses: {
    mp3Lease: { enabled: boolean; price: number };
    wavLease: { enabled: boolean; price: number };
    premiumLease: { enabled: boolean; price: number };
    unlimitedLease: { enabled: boolean; price: number };
    exclusive: { enabled: boolean; price: number };
  };
  customLicenses?: License[];
  tieredPricing?: Tier[];
  bulkDiscount?: BulkDiscount;
  freeDownload?: { 
    enabled: boolean; 
    requirement: 'email' | 'social' | 'none';
    protection: 'tagged' | 'untagged';
    socialGate?: 'youtube' | 'soundcloud' | 'profile';
    redirectUrl?: string;
  };
  socialUnlocks?: SocialUnlock[];
  redirectUrl?: string;
  isExclusive?: boolean;
  contentIdEnabled?: boolean;
  likes?: number;
  dislikes?: number;
  plays?: number;
  shares?: number;
  purchases?: number;
  earnings?: number;
  downloads?: number;
  mood?: string[];
  tags?: string[];
  isLocal?: boolean;
  isHumanUploaded?: boolean;
  userId?: string;
  createdAt?: any;
  updatedAt?: any;
  releaseDate?: string;
  gear?: string;
  instruments?: string[];
  primaryGenre?: string;
  secondaryGenre?: string;
  isExplicit?: boolean;
  isInstrumental?: boolean;
  productionYear?: number;
  isrcCode?: string;
  socialPostTitle?: string;
  socialPostDescription?: string;
  socialPostArtworkUrl?: string;
}

export type MarketingErrorCode = 
  | 'AD_BLOCKER_DETECTED' 
  | 'API_RATE_LIMIT_EXCEEDED' 
  | 'OAUTH_POPUP_BLOCKED' 
  | 'UNKNOWN_MARKETING_ERROR';

export interface MarketingErrorContext {
  componentName: string;
  context?: Record<string, any>;
  onEmailCaptureFallback?: () => void;
  onBypassSocialCheck?: () => void;
  onCheckoutFallback?: () => void;
}

export interface Analytics {
  siteVisits: number;
  uniqueVisitors: number;
  totalPlays: number;
  totalShares: number;
  downloads: number;
  totalEarnings?: number;
  platformFees?: number;
}

export interface StoreState {
  profile: Profile;
  videos: YouTubeVideo[];
  beats: Beat[];
  archivedBeats: Beat[];
  analytics: Analytics;
}
