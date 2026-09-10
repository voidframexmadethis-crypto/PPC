import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { useAuth } from '../context/AuthContext';
import { useMarketingSettings } from '../hooks/useMarketingSettings';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { auth, storage, db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { Upload, Image as ImageIcon, Music, CheckCircle2, ChevronRight, ChevronLeft, Sparkles, AlertCircle, Trash2, Loader2, Play } from 'lucide-react';
import { Beat, License, Tier, SocialUnlock } from '../types';
import { analyzeAudioFile, AudioAnalysisResult } from '../lib/audioAnalyzer';
import TrackPlayer from './TrackPlayer';
import LiveSocialUnlock from './LiveSocialUnlock';
import { StepWizard } from './uploader/StepWizard';
import { FileStep } from './uploader/FileStep';
import { extractWaveformData } from '../lib/waveformUtils';

const steps = ['Files', 'Beat Details', 'Artwork', 'Metadata', 'Licensing', 'Store Preview', 'Review & Publish'];

const FilePreview = ({ file }: { file: File }) => {
  const [url, setUrl] = useState<string>('');
  
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const isAudio = file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|m4a|flac|aac|ogg|wma)$/i);

  if (!isAudio) return null;

  return <TrackPlayer src={url} className="bg-neutral-900/50 p-2 rounded-md border border-neutral-800/50 mt-2" />;
};


const isMarketingSetting = (key: string) => {
  const marketingKeys = [
    'autoPostVideo', 'youtubeVideoGen', 'tiktokVideoGen', 'youtubeTargetChannel', 
    'tiktokTargetChannel', 'youtubeCompanionUrl', 'soundcloudSyncLink', 
    'audiomackEmbedCode', 'tiktokTrendingAudioSync', 'dspDistributionOptIn', 
    'spotifyArtistLink', 'appleMusicArtistLink', 'upcCoreField', 
    'googleAnalyticsCode', 'metaPixelId', 'googleAdsTracker', 'pinterestTagId', 
    'tiktokPixelId', 'utmCampaignBuilder', 'smartLinkShortUrl', 'autoSocialCopy', 
    'directCheckoutShortcut', 'emailReceiptLayout', 'mailingListTrigger', 
    'socialShareArray', 'rssPodcastFeed', 'airbitFeaturedBid', 
    'localStorageBackupRegistry', 'tosComplianceMatrix'
  ];
  return marketingKeys.includes(key);
};

const BeatUploader = React.memo(() => {
  const { state, addBeat } = useStore();
  const { playTrack, togglePlay: toggleGlobalPlay, currentTrack, isPlaying: isGlobalPlaying } = useAudioPlayer();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { marketingConfig, saveMarketingSettings } = useMarketingSettings();
    
  // 🛠️ SMART UPLOADER DETECTION
  // Bypasses cloud if not signed in or in local preview
  const isDevMode = !user;
    
  const [uploaderState, setUploaderState] = useState({
    currentStep: 0,
    tagInput: '',
    uploadProgress: {} as { [key: string]: number },
    isUploading: false,
    isAnalyzing: false,
    analysisNotice: null as string | null,
    isDragging: false,
    uploadedFiles: [] as File[],
    formData: {
      title: '',
      producer: '',
      bpm: '' as string | number,
      key: '',
      mode: 'Major',
      price: '' as string | number,
      coverArtUrl: '',
      audioUrl: '',
      untaggedWavUrl: '',
      stemsZipUrl: '',
      freeDownload: { enabled: true, requirement: 'email', protection: 'tagged' },
      isExclusive: false,
      contentIdEnabled: false,
      customLicenses: [] as License[],
      socialUnlocks: [] as SocialUnlock[],
      tieredPricing: [] as Tier[],
      bulkDiscount: { threshold: 0, discountPercentage: 0 },
      description: '',
      mood: [] as string[],
      tags: [] as string[],
      releaseDate: '',
      gear: '',
      instruments: [] as string[],
      primaryGenre: '',
      secondaryGenre: '',
      trackType: 'Beat' as 'Beat' | 'Chorus' | 'Song' | 'Top Line' | 'Vocals',
      isExplicit: false,
      isInstrumental: false,
      productionYear: new Date().getFullYear(),
      isrcCode: '',
      iswcCode: '',
      socialPostTitle: '',
      socialPostDescription: '',
      socialPostArtworkUrl: '',
      typeBeat: '',
      energyLevel: 'Moderate',
      vocalPresence: false,
      isDraft: false,
      // --- Licenses & Commerce ---
      basicMp3LeaseEnabled: true,
      basicMp3LeasePrice: 29.99,
      premiumWavLeaseEnabled: true,
      premiumWavLeasePrice: 49.99,
      trackoutsLeaseEnabled: true,
      trackoutsLeasePrice: 99.99,
      unlimitedLeaseEnabled: false,
      unlimitedLeasePrice: 199.99,
      exclusiveRightsEnabled: false,
      exclusiveRightsPrice: 500.00,
      makeAnOfferEnabled: false,
      minimumPriceFloor: 0,
      licenseTemplate: 'Standard',
      customContract: '',
      defaultTemplateOverride: false,
      bulkDiscountCategory: 'Buy 2 Get 1 Free',
      couponsLink: '',
      youtubeContentIdEnrollment: 'Opt-out',
      youtubeContentIdWhitelist: '',
      // --- Free Downloads & Lead Generation (191-215) ---
      freeDownloadEnabled: false,
      freeDeliveryVariant: 'Watermarked Preview',
      requireEmail: false,
      socialUnlockModule: 'None',
      airbitFollowGate: false,
      youtubeSubGate: false,
      youtubeChannelId: '',
      tiktokGate: false,
      soundcloudGate: false,
      twitterGate: false,
      freeLeaseContract: 'Promotional Use Only',
      mailingListSegment: '',
      newsletterApiSync: '',
      socialApiValidator: true,
      maxFreeDownloads: 0,
      redirectUrl: '',
      tosComplianceBox: true,
      marketingOptIn: true,
      freeDownloadTrackingId: '',
      watermarkHardLock: true,
      downloadFailureAlertEmail: '',
      linkExpirationHours: 24,
      geoTargetFilter: 'Global',
      captchaGate: false,
      freeMetricsId: '',
      // --- Visibility, Scheduling & Release Launch (246-270) ---
      visibilityPlacement: 'Public',
      futureDateRelease: '',
      futureTimeRelease: '',
      unlistedAccessUrlToken: '',
      passwordVaultString: '',
      infinityStoreSync: true,
      html5MarketplaceSync: true,
      voiceTagUrl: '',
      storePagePointer: 'Home',
      storeFrontRowPinned: false,
      currentStatusBadge: 'Draft',
      bulkActionQueueBatch: '',
      archivedExcludedVector: false,
      catalogSortIndex: 0,
      regionalMarketBlackout: '',
      seasonalTakedownSwitch: false,
      preOrderAssetLock: false,
      profileDiscoveryPinned: false,
      embedPlayerTabConfig: 'Top',
      directEmbedUrlExport: '',
      standaloneDomainMapping: '',
      bandzoogleSyncToken: '',
      externalStoreThemeOverride: '',
      // --- Syndication, Marketing Pixels & Automation (271-300) ---
      autoPostVideo: false,
      youtubeVideoGen: false,
      tiktokVideoGen: false,
      youtubeTargetChannel: '',
      tiktokTargetChannel: '',
      youtubeCompanionUrl: '',
      soundcloudSyncLink: '',
      audiomackEmbedCode: '',
      tiktokTrendingAudioSync: '',
      dspDistributionOptIn: false,
      spotifyArtistLink: '',
      appleMusicArtistLink: '',
      upcCoreField: '',
      googleAnalyticsCode: '',
      metaPixelId: '',
      googleAdsTracker: '',
      pinterestTagId: '',
      tiktokPixelId: '',
      utmCampaignBuilder: '',
      smartLinkShortUrl: '',
      autoSocialCopy: '',
      directCheckoutShortcut: '',
      emailReceiptLayout: 'Standard',
      mailingListTrigger: false,
      socialShareArray: 'Twitter, Facebook, WhatsApp, Email',
      rssPodcastFeed: false,
      airbitFeaturedBid: '',
      localStorageBackupRegistry: true,
      tosComplianceMatrix: false,
    }
  });

  const { currentStep, tagInput, uploadProgress, isUploading, isAnalyzing, analysisNotice, isDragging, uploadedFiles, formData } = uploaderState;

  // Helper setters to maintain compatibility with existing logic
  const setCurrentStep = (val: number | ((v: number) => number)) => 
    setUploaderState(p => ({ ...p, currentStep: typeof val === 'function' ? val(p.currentStep) : val }));
  
  const setTagInput = (val: string | ((v: string) => string)) => 
    setUploaderState(p => ({ ...p, tagInput: typeof val === 'function' ? val(p.tagInput) : val }));

  const setUploadProgress = (val: any) => 
    setUploaderState(p => ({ ...p, uploadProgress: typeof val === 'function' ? val(p.uploadProgress) : val }));

  const setIsUploading = (val: boolean | ((v: boolean) => boolean)) => 
    setUploaderState(p => ({ ...p, isUploading: typeof val === 'function' ? val(p.isUploading) : val }));

  const setIsAnalyzing = (val: boolean | ((v: boolean) => boolean)) => 
    setUploaderState(p => ({ ...p, isAnalyzing: typeof val === 'function' ? val(p.isAnalyzing) : val }));

  const setAnalysisNotice = (val: string | null | ((v: string | null) => string | null)) => 
    setUploaderState(p => ({ ...p, analysisNotice: typeof val === 'function' ? val(p.analysisNotice) : val }));

  const setIsDragging = (val: boolean | ((v: boolean) => boolean)) => 
    setUploaderState(p => ({ ...p, isDragging: typeof val === 'function' ? val(p.isDragging) : val }));

  const setUploadedFiles = (val: File[] | ((v: File[]) => File[])) => 
    setUploaderState(p => ({ ...p, uploadedFiles: typeof val === 'function' ? val(p.uploadedFiles) : val }));

  const setFormData = (val: any) => 
    setUploaderState(p => ({ ...p, formData: typeof val === 'function' ? val(p.formData) : val }));




  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent, type: 'audio' | 'image') => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files, type);
    }
  };



  React.useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).updateStorefrontMetadata) {
      const specs = `Key: ${formData.key || 'D# minor'} | BPM: ${formData.bpm || '119'}${formData.mood ? ` | Mood: ${formData.mood}` : ''}`;
      (window as any).updateStorefrontMetadata(
        formData.title || 'Dark hall',
        formData.producer || 'NightRunna',
        formData.price || '30.00',
        formData.coverArtUrl || 'https://vercel.app',
        specs
      );
    }
  }, [formData.title, formData.producer, formData.price, formData.coverArtUrl, formData.key, formData.bpm, formData.mood]);

  // Initialize formData with marketingConfig if it's not already set
  const isInitialized = React.useRef(false);
  useEffect(() => {
    if (marketingConfig && !isInitialized.current) {
      setFormData((prev: any) => ({ ...prev, ...marketingConfig }));
      isInitialized.current = true;
    }
  }, [marketingConfig]);





  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as any;
    const finalValue = type === 'checkbox' ? checked : (type === 'number' ? (value === '' ? '' : Number(value)) : value);

    setFormData(prev => {
      const updated = { 
        ...prev, 
        [name]: finalValue
      };

      // 🎯 Auto-detect redirect URL whenever typing or updating beat title
      if (name === 'title') {
        const beatTitle = String(value).trim();
        // If redirectUrl was empty or auto-generated player link, dynamically update it
        if (!prev.redirectUrl || prev.redirectUrl.startsWith('/player?track=') || prev.redirectUrl === prev.audioUrl) {
          updated.redirectUrl = beatTitle ? `/player?track=${encodeURIComponent(beatTitle)}` : (prev.audioUrl || '');
        }
      }

      // If it's a marketing setting, save it to the database independently
      if (isMarketingSetting(name)) {
        saveMarketingSettings({ [name]: finalValue } as any);
      }

      return updated;
    });
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim().replace(/^#/, '');
      if (newTag && !formData.tags.includes(newTag)) {
        setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag] }));
      }
      setTagInput('');
    } else if (e.key === 'Backspace' && !tagInput && formData.tags.length > 0) {
      setFormData(prev => {
        const newTags = [...prev.tags];
        newTags.pop();
        return { ...prev, tags: newTags };
      });
    }
  };

  const removeTag = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleFileUpload = async (files: FileList | null, type: 'audio' | 'image', role: 'tagged' | 'untagged' | 'stems' | 'tag' = 'tagged', fieldToUpdate: string = 'coverArtUrl') => {
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      // 1. Instant processing for preview
      let instantObjectUrl = '';
      try {
        instantObjectUrl = URL.createObjectURL(file);
      } catch (e) {}

      const cleanTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").replace(/\b\w/g, l => l.toUpperCase());
      const bpmMatch = file.name.match(/(\d{2,3})\s*bpm/i);
      const extractedBpm = bpmMatch ? bpmMatch[1] : '';

      if (type === 'audio') {
        setFormData(prev => ({
          ...prev, 
          audioUrl: (role === 'tagged' && !prev.audioUrl) ? instantObjectUrl : prev.audioUrl,
          untaggedWavUrl: (role === 'untagged' && !prev.untaggedWavUrl) ? instantObjectUrl : prev.untaggedWavUrl,
          stemsZipUrl: (role === 'stems' && !prev.stemsZipUrl) ? instantObjectUrl : prev.stemsZipUrl,
          voiceTagUrl: (role === 'tag' && !prev.voiceTagUrl) ? instantObjectUrl : prev.voiceTagUrl,
          title: prev.title || cleanTitle,
          bpm: prev.bpm || extractedBpm || 130
        }));
        setUploadedFiles(prev => [...prev, file]);
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
      } else {
        setFormData(prev => ({ ...prev, [fieldToUpdate]: instantObjectUrl }));
      }

      // 2. Upload Logic: Attempt Internet Archive via server proxy first, fall back to local upload if credentials missing or fails
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload-ia');
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.success && response.url) {
              setFormData(prev => {
                if (type === 'audio') {
                  if (role === 'tagged') return { ...prev, audioUrl: response.url };
                  if (role === 'untagged') return { ...prev, untaggedWavUrl: response.url };
                  if (role === 'stems') return { ...prev, stemsZipUrl: response.url };
                  if (role === 'tag') return { ...prev, voiceTagUrl: response.url };
                }
                return { ...prev, [fieldToUpdate]: response.url };
              });
              setIsUploading(false);
              return;
            }
          } catch (e) {}
        }

        // Graceful Fallback: Upload locally if IA is unconfigured or fails
        console.warn('Internet Archive upload unavailable or failed. Falling back to secure local storage...');
        const fallbackXhr = new XMLHttpRequest();
        fallbackXhr.open('POST', `/api/upload-local?type=${type}`);
        
        fallbackXhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
          }
        };

        fallbackXhr.onload = () => {
          if (fallbackXhr.status === 200) {
            try {
              const response = JSON.parse(fallbackXhr.responseText);
              if (response.success && response.url) {
                setFormData(prev => {
                  if (type === 'audio') {
                    if (role === 'tagged') return { ...prev, audioUrl: response.url };
                    if (role === 'untagged') return { ...prev, untaggedWavUrl: response.url };
                    if (role === 'stems') return { ...prev, stemsZipUrl: response.url };
                    if (role === 'tag') return { ...prev, voiceTagUrl: response.url };
                  }
                  return { ...prev, [fieldToUpdate]: response.url };
                });
              }
            } catch (err) {
              console.error('Local fallback parsing failed:', err);
            }
          } else {
            console.error('Local fallback upload failed:', fallbackXhr.status);
          }
          setIsUploading(false);
        };

        fallbackXhr.onerror = () => {
          console.error('Local fallback connection error');
          setIsUploading(false);
        };

        const fallbackData = new FormData();
        fallbackData.append('file', file);
        fallbackXhr.send(fallbackData);
      };

      xhr.onerror = () => {
        console.warn('IA upload connection error. Trying local storage...');
        const fallbackXhr = new XMLHttpRequest();
        fallbackXhr.open('POST', `/api/upload-local?type=${type}`);
        
        fallbackXhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
          }
        };

        fallbackXhr.onload = () => {
          if (fallbackXhr.status === 200) {
            try {
              const response = JSON.parse(fallbackXhr.responseText);
              if (response.success && response.url) {
                setFormData(prev => {
                  if (type === 'audio') {
                    if (role === 'tagged') return { ...prev, audioUrl: response.url };
                    if (role === 'untagged') return { ...prev, untaggedWavUrl: response.url };
                    if (role === 'stems') return { ...prev, stemsZipUrl: response.url };
                    if (role === 'tag') return { ...prev, voiceTagUrl: response.url };
                  }
                  return { ...prev, [fieldToUpdate]: response.url };
                });
              }
            } catch (err) {}
          }
          setIsUploading(false);
        };

        fallbackXhr.onerror = () => {
          setIsUploading(false);
        };

        const fallbackData = new FormData();
        fallbackData.append('file', file);
        fallbackXhr.send(fallbackData);
      };

      const formDataObj = new FormData();
      formDataObj.append('file', file);
      xhr.send(formDataObj);
    }
  };

  const testAudioPlayerInUploader = (urlToTest?: string) => {
    const rawTarget = urlToTest || formData.redirectUrl || formData.audioUrl;
    
    // If the target URL is a player link (/player?track=...), navigate to the audio player for that beat!
    if (rawTarget && (rawTarget.startsWith('/player') || rawTarget.includes('/player?'))) {
      navigate(rawTarget);
      return;
    }

    // Otherwise, stream the audio file directly in the global audio player
    const streamAudioUrl = formData.audioUrl || (rawTarget && !rawTarget.includes('/player') ? rawTarget : '');

    playTrack({
      id: 'uploader_preview_' + Date.now(),
      title: formData.title || 'Beat Preview',
      producer: formData.producer || 'NightRunna',
      coverArtUrl: formData.coverArtUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
      audioUrl: streamAudioUrl,
      bpm: Number(formData.bpm) || 130,
      price: Number(formData.price) || 35
    } as Beat);
  };

  const handlePublish = async () => {
    // Determine title & audio URL with reliable fallbacks
    const defaultTitle = uploadedFiles.length > 0 
      ? uploadedFiles[0].name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ") 
      : 'My Uploaded Beat';
    
    const finalTitle = (formData.title || defaultTitle).trim();

    let finalAudioUrl = formData.audioUrl;
    if (!finalAudioUrl && uploadedFiles.length > 0) {
      try {
        finalAudioUrl = URL.createObjectURL(uploadedFiles[0]);
      } catch (e) {
        console.warn("Unable to create Object URL for file:", e);
      }
    }
    if (!finalAudioUrl) {
      finalAudioUrl = '';
    }

    let waveformData: number[] = [];
    if (uploadedFiles.length > 0) {
      waveformData = await extractWaveformData(uploadedFiles[0]);
    } else if (finalAudioUrl) {
      waveformData = await extractWaveformData(finalAudioUrl);
    }

    const finalRedirectUrl = formData.redirectUrl || `/player?track=${encodeURIComponent(finalTitle)}`;

    const newBeat: Beat = {
      id: 'human_beat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      title: finalTitle,
      producer: formData.producer || 'NightRunna',
      bpm: Number(formData.bpm) || 130,
      key: formData.key || 'C Minor',
      mode: formData.mode || 'Minor',
      price: Number(formData.price) || 35.00,
      coverArtUrl: formData.coverArtUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
      audioUrl: finalAudioUrl,
      waveformData,
      untaggedWavUrl: formData.untaggedWavUrl,
      stemsZipUrl: formData.stemsZipUrl,
      redirectUrl: finalRedirectUrl,
      visibility: (formData.visibilityPlacement as any) || 'Public',
      trackType: formData.trackType || 'Beat',
      isHumanUploaded: true,
      isLocal: true,
      licenses: {
        mp3Lease: { enabled: formData.basicMp3LeaseEnabled, price: Number(formData.basicMp3LeasePrice) || 35.00 },
        wavLease: { enabled: formData.premiumWavLeaseEnabled, price: Number(formData.premiumWavLeasePrice) || 65.00 },
        premiumLease: { enabled: formData.trackoutsLeaseEnabled, price: Number(formData.trackoutsLeasePrice) || 150.00 },
        unlimitedLease: { enabled: formData.unlimitedLeaseEnabled, price: Number(formData.unlimitedLeasePrice) || 250.00 },
        exclusive: { enabled: formData.exclusiveRightsEnabled, price: Number(formData.exclusiveRightsPrice) || 500.00 },
      },
      socialUnlocks: formData.socialUnlockModule !== 'None' ? [{
        id: 'su_' + Date.now(),
        requiredAction: formData.socialUnlockModule as any,
        targetAccountId: formData.youtubeChannelId,
        freeDownloadFileType: formData.freeDeliveryVariant as any || 'MP3'
      }] : [],
      freeDownload: {
        enabled: formData.freeDownloadEnabled || formData.socialUnlockModule !== 'None',
        requirement: formData.requireEmail ? 'email' : (formData.youtubeSubGate || formData.tiktokGate || formData.twitterGate ? 'social' : 'none'),
        protection: formData.freeDeliveryVariant === 'Clean File (Untagged)' ? 'untagged' : 'tagged',
        redirectUrl: finalRedirectUrl,
      },
      isExclusive: formData.exclusiveRightsEnabled,
      contentIdEnabled: formData.youtubeContentIdEnrollment === 'Opt-in',
      mood: formData.mood || 'Dark',
      tags: formData.tags || [],
      releaseDate: formData.futureDateRelease || new Date().toISOString(),
      gear: formData.gear || '',
      instruments: formData.instruments || '',
      primaryGenre: formData.primaryGenre || 'Hip Hop',
      secondaryGenre: formData.secondaryGenre || '',
      isExplicit: formData.isExplicit || false,
      isInstrumental: formData.isInstrumental || true,
      productionYear: Number(formData.productionYear) || new Date().getFullYear(),
      isrcCode: formData.isrcCode || '',
      socialPostTitle: (formData.socialPostTitle || finalTitle).trim(),
      socialPostDescription: (formData.socialPostDescription || '').trim(),
      socialPostArtworkUrl: formData.socialPostArtworkUrl || formData.coverArtUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
    };

    try {
      await addBeat(newBeat);
    } catch (err) {
      console.warn("addBeat notice:", err);
    }

    // 🎵 Stream immediately on Audio Player when beat is uploaded/published!
    playTrack(newBeat);

    // 🔔 Notify VIP subscribers about the new beat drop instantly!
    try {
      await fetch('/api/notify-beat-drop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beatTitle: newBeat.title,
          producer: newBeat.producer,
          bpm: newBeat.bpm,
          key: newBeat.key,
          coverArtUrl: newBeat.coverArtUrl
        })
      });
    } catch (err) {
      console.error("Failed to broadcast beat drop notification:", err);
    }

    // Navigate straight to the beat on the audio player page!
    navigate(`/player?track=${encodeURIComponent(newBeat.title)}`);
  };

  return (
    <div className="w-full max-w-6xl mx-auto pb-20 animate-in fade-in duration-500">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Beat Uploader</h1>
          <p className="text-neutral-400 mt-2">Upload your beat, add metadata, and configure sales options.</p>
        </div>
        
        {isDevMode && (
          <div className="bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Dev Mode: Local Storage</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-8 relative">
        <div className="flex justify-between">
          {steps.map((step, i) => (
            <div key={step} className="flex flex-col items-center relative z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors border-2 ${
                i < currentStep ? 'bg-indigo-500 border-indigo-500 text-white' : 
                i === currentStep ? 'bg-neutral-900 border-indigo-500 text-indigo-400' : 'bg-neutral-900 border-neutral-700 text-neutral-500'
              }`}>
                {i < currentStep ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
              </div>
              <span className={`text-xs mt-2 font-medium hidden sm:block ${i <= currentStep ? 'text-neutral-200' : 'text-neutral-500'}`}>
                {step}
              </span>
            </div>
          ))}
        </div>
        <div className="absolute top-5 left-0 w-full h-[2px] bg-neutral-800 -z-0">
           <div 
             className="h-full bg-indigo-500 transition-all duration-300"
             style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
           />
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-neutral-900 rounded-2xl p-6 md:p-8 border border-neutral-800 shadow-xl mb-8">
        
        {/* STEP 1: Files & Artwork */}
        {currentStep === 0 && (
  <div className="space-y-6 animate-in fade-in duration-300">
    <FileStep 
        onFilesSelected={(files) => handleFileUpload(files, 'audio')} 
        isUploading={isUploading}
        uploadedFiles={uploadedFiles}
    />
  </div>
)}









  

        {/* STEP 2: Basic Info */}
        {currentStep === 1 && (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-xl font-semibold mb-4 border-b border-neutral-800 pb-2 flex justify-between items-end">
                Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Track Title *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className="flex-1 bg-neutral-950 border-2 border-neutral-700 rounded-xl px-5 py-3.5 text-lg md:text-2xl text-white focus:outline-none focus:ring-4 focus:ring-indigo-500 font-bold"
                      required
                    />
                    <button type="button" className="px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20 text-sm flex items-center hover:bg-indigo-500/20">
                      <Sparkles className="w-4 h-4 mr-2" /> AI Title
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Release Date</label>
                  <input
                    type="date"
                    name="releaseDate"
                    value={formData.releaseDate}
                    onChange={handleChange}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Gear / Equipment</label>
                  <input
                    type="text"
                    name="gear"
                    value={formData.gear}
                    onChange={handleChange}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. MPC, Moog, Serum..."
                  />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-neutral-400 mb-1">Instruments</label>
                    <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-2 flex flex-wrap gap-2 focus-within:border-indigo-500 transition-colors">
                      {formData.instruments.map((inst, index) => (
                        <span key={index} className="bg-neutral-800 text-white text-xs px-2 py-1 rounded-full flex items-center">
                          {inst}
                          <button type="button" onClick={() => setFormData(prev => ({...prev, instruments: prev.instruments.filter((_, i) => i !== index)}))} className="ml-1 text-neutral-400 hover:text-white">
                            &times;
                          </button>
                        </span>
                      ))}
                      <input 
                        type="text" 
                        value={tagInput} // Reuse tagInput or create new one? I'll reuse it for simplicity if I make it generic or create new one. I'll create new one.
                        // Wait, I need a separate input for instruments.
                        // I will just add instrument input.
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                if (tagInput.trim()) {
                                    setFormData(prev => ({...prev, instruments: [...prev.instruments, tagInput.trim()]}));
                                    setTagInput('');
                                }
                            }
                        }}
                        className="bg-transparent border-none text-sm text-white focus:outline-none flex-1 min-w-[120px]" 
                        placeholder="Add instrument..."
                      />
                    </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Track Type</label>
                  <select
                    name="trackType"
                    value={formData.trackType}
                    onChange={handleChange}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option>Beat</option>
                    <option>Beat with Hook</option>
                    <option>Song</option>
                    <option>Instrumental</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Producer / Artist</label>
                  <input
                    type="text"
                    name="producer"
                    value={formData.producer}
                    onChange={handleChange}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24 resize-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Metadata */}
        {currentStep === 2 && (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-xl font-semibold mb-4 border-b border-neutral-800 pb-2 flex justify-between items-end">
                Metadata
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Primary Genre</label>
                  <input type="text" name="primaryGenre" value={formData.primaryGenre} onChange={handleChange} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Secondary Genre</label>
                  <input type="text" name="secondaryGenre" value={formData.secondaryGenre} onChange={handleChange} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">BPM</label>
                  <input type="number" name="bpm" value={formData.bpm} onChange={handleChange} className="w-full bg-neutral-950 border-2 border-neutral-700 rounded-xl px-4 py-3.5 text-lg md:text-xl text-white focus:outline-none focus:ring-4 focus:ring-indigo-500 font-mono font-bold" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Key / Mode</label>
                  <div className="flex gap-2">
                    <input type="text" name="key" value={formData.key} onChange={handleChange} className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm font-mono" placeholder="Root" />
                    <select name="mode" value={formData.mode} onChange={handleChange} className="w-24 bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-2 text-sm">
                      <option value="Major">Major</option>
                      <option value="Minor">Minor</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Mood (Max 2)</label>
                  <input type="text" value={formData.mood.join(', ')} onChange={(e) => setFormData(prev => ({...prev, mood: e.target.value.split(',').map(m => m.trim()).filter(m => m).slice(0, 2)}))} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Chill, Dark" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Production Year</label>
                  <input type="number" name="productionYear" value={formData.productionYear} onChange={handleChange} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">ISRC Code</label>
                  <input type="text" name="isrcCode" value={formData.isrcCode} onChange={handleChange} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">ISWC Code</label>
                  <input type="text" name="iswcCode" value={formData.iswcCode || ''} onChange={handleChange} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Type Beat Attribution</label>
                  <input type="text" name="typeBeat" value={formData.typeBeat || ''} onChange={handleChange} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Drake" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Energy Level</label>
                  <select name="energyLevel" value={formData.energyLevel || 'Moderate'} onChange={handleChange} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm">
                     <option>Chill</option>
                     <option>Moderate</option>
                     <option>High</option>
                  </select>
                </div>
                <div className="flex gap-4 col-span-full mt-2 border-t border-neutral-800 pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.isExplicit} onChange={(e) => setFormData(prev => ({...prev, isExplicit: e.target.checked}))} className="rounded border-neutral-700 bg-neutral-950 text-indigo-500 focus:ring-indigo-500" />
                    Explicit Content
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.isInstrumental} onChange={(e) => setFormData(prev => ({...prev, isInstrumental: e.target.checked}))} className="rounded border-neutral-700 bg-neutral-950 text-indigo-500 focus:ring-indigo-500" />
                    Instrumental Only
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.vocalPresence || false} onChange={(e) => setFormData(prev => ({...prev, vocalPresence: e.target.checked}))} className="rounded border-neutral-700 bg-neutral-950 text-indigo-500 focus:ring-indigo-500" />
                    Contains Backing Vocals
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.isDraft || false} onChange={(e) => setFormData(prev => ({...prev, isDraft: e.target.checked}))} className="rounded border-neutral-700 bg-neutral-950 text-indigo-500 focus:ring-indigo-500" />
                    Save as Draft (WIP)
                  </label>
                </div>
                <div className="col-span-full">
                   <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-2 flex flex-wrap gap-2 focus-within:border-indigo-500 transition-colors">
                     {formData.tags.map((tag, index) => (
                       <span key={index} className="bg-neutral-800 text-white text-xs px-2 py-1 rounded-full flex items-center">
                         #{tag}
                         <button type="button" onClick={() => removeTag(index)} className="ml-1 text-neutral-400 hover:text-white">
                           &times;
                         </button>
                       </span>
                     ))}
                     <input 
                       type="text" 
                       value={tagInput} 
                       onChange={(e) => setTagInput(e.target.value)}
                       onKeyDown={handleTagKeyDown}
                       className="bg-transparent border-none text-sm text-white focus:outline-none flex-1 min-w-[120px]" 
                       placeholder="Add a tag..."
                     />
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Commercial & Licensing Controls */}
        {currentStep === 3 && (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-neutral-800 pb-2">
                <h2 className="text-xl font-semibold">Pricing & Licenses</h2>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-neutral-400">License Template Override</label>
                  <input type="checkbox" checked={formData.defaultTemplateOverride} onChange={(e) => setFormData(prev => ({...prev, defaultTemplateOverride: e.target.checked}))} className="rounded border-neutral-700 bg-neutral-950 text-indigo-500 focus:ring-indigo-500" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Standard License Price Configurator</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-neutral-500">$</span>
                    <input type="number" step="0.01" name="price" value={formData.price} onChange={handleChange} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-8 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Automated Licensing Template</label>
                  <select name="licenseTemplate" value={formData.licenseTemplate} onChange={handleChange} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option>Standard</option>
                    <option>Premium</option>
                    <option>Exclusive Only</option>
                    <option>Custom Contract</option>
                  </select>
                </div>
              </div>

              {/* License Tiers List (clean, un-crowded design) */}
              <div className="space-y-3">
                <div className="bg-neutral-950/50 p-4 rounded-lg border border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={formData.basicMp3LeaseEnabled} onChange={(e) => setFormData(prev => ({...prev, basicMp3LeaseEnabled: e.target.checked}))} className="rounded border-neutral-700 bg-neutral-900 text-indigo-500 focus:ring-indigo-500 w-5 h-5" />
                    <div>
                      <h4 className="font-medium text-neutral-200 text-sm">Basic MP3 Lease</h4>
                      <p className="text-xs text-neutral-500">Entry-level streaming lease configurations.</p>
                    </div>
                  </div>
                  {formData.basicMp3LeaseEnabled && (
                    <div className="relative w-40">
                      <span className="absolute left-3.5 top-3 text-neutral-400 text-base font-bold">$</span>
                      <input type="number" step="0.01" name="basicMp3LeasePrice" value={formData.basicMp3LeasePrice} onChange={handleChange} className="w-full bg-neutral-900 border-2 border-neutral-700 rounded-xl pl-8 pr-4 py-2.5 text-lg md:text-xl text-white focus:outline-none focus:ring-4 focus:ring-indigo-500 font-mono font-bold" />
                    </div>
                  )}
                </div>

                <div className="bg-neutral-950/50 p-4 rounded-lg border border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={formData.premiumWavLeaseEnabled} onChange={(e) => setFormData(prev => ({...prev, premiumWavLeaseEnabled: e.target.checked}))} className="rounded border-neutral-700 bg-neutral-900 text-indigo-500 focus:ring-indigo-500 w-5 h-5" />
                    <div>
                      <h4 className="font-medium text-neutral-200 text-sm">Premium WAV Lease</h4>
                      <p className="text-xs text-neutral-500">High-quality uncompressed audio licensing.</p>
                    </div>
                  </div>
                  {formData.premiumWavLeaseEnabled && (
                    <div className="relative w-40">
                      <span className="absolute left-3.5 top-3 text-neutral-400 text-base font-bold">$</span>
                      <input type="number" step="0.01" name="premiumWavLeasePrice" value={formData.premiumWavLeasePrice} onChange={handleChange} className="w-full bg-neutral-900 border-2 border-neutral-700 rounded-xl pl-8 pr-4 py-2.5 text-lg md:text-xl text-white focus:outline-none focus:ring-4 focus:ring-indigo-500 font-mono font-bold" />
                    </div>
                  )}
                </div>

                <div className="bg-neutral-950/50 p-4 rounded-lg border border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={formData.trackoutsLeaseEnabled} onChange={(e) => setFormData(prev => ({...prev, trackoutsLeaseEnabled: e.target.checked}))} className="rounded border-neutral-700 bg-neutral-900 text-indigo-500 focus:ring-indigo-500 w-5 h-5" />
                    <div>
                      <h4 className="font-medium text-neutral-200 text-sm">Trackouts Premium Lease</h4>
                      <p className="text-xs text-neutral-500">Multi-track stem lease availability.</p>
                    </div>
                  </div>
                  {formData.trackoutsLeaseEnabled && (
                    <div className="relative w-40">
                      <span className="absolute left-3.5 top-3 text-neutral-400 text-base font-bold">$</span>
                      <input type="number" step="0.01" name="trackoutsLeasePrice" value={formData.trackoutsLeasePrice} onChange={handleChange} className="w-full bg-neutral-900 border-2 border-neutral-700 rounded-xl pl-8 pr-4 py-2.5 text-lg md:text-xl text-white focus:outline-none focus:ring-4 focus:ring-indigo-500 font-mono font-bold" />
                    </div>
                  )}
                </div>

                <div className="bg-neutral-950/50 p-4 rounded-lg border border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={formData.unlimitedLeaseEnabled} onChange={(e) => setFormData(prev => ({...prev, unlimitedLeaseEnabled: e.target.checked}))} className="rounded border-neutral-700 bg-neutral-900 text-indigo-500 focus:ring-indigo-500 w-5 h-5" />
                    <div>
                      <h4 className="font-medium text-neutral-200 text-sm">Unlimited Lease License</h4>
                      <p className="text-xs text-neutral-500">Unrestricted commercial lease models.</p>
                    </div>
                  </div>
                  {formData.unlimitedLeaseEnabled && (
                    <div className="relative w-40">
                      <span className="absolute left-3.5 top-3 text-neutral-400 text-base font-bold">$</span>
                      <input type="number" step="0.01" name="unlimitedLeasePrice" value={formData.unlimitedLeasePrice} onChange={handleChange} className="w-full bg-neutral-900 border-2 border-neutral-700 rounded-xl pl-8 pr-4 py-2.5 text-lg md:text-xl text-white focus:outline-none focus:ring-4 focus:ring-indigo-500 font-mono font-bold" />
                    </div>
                  )}
                </div>

                <div className="bg-indigo-950/20 p-4 rounded-lg border border-indigo-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={formData.exclusiveRightsEnabled} onChange={(e) => setFormData(prev => ({...prev, exclusiveRightsEnabled: e.target.checked}))} className="rounded border-indigo-700 bg-neutral-900 text-indigo-500 focus:ring-indigo-500 w-5 h-5" />
                    <div>
                      <h4 className="font-medium text-indigo-200 text-sm flex items-center gap-2">Exclusive Rights Permanent Buyout <Sparkles size={14} className="text-indigo-400" /></h4>
                      <p className="text-xs text-indigo-400/60">Permanent catalog master purchases.</p>
                    </div>
                  </div>
                  {formData.exclusiveRightsEnabled && (
                    <div className="relative w-40">
                      <span className="absolute left-3.5 top-3 text-neutral-400 text-base font-bold">$</span>
                      <input type="number" step="0.01" name="exclusiveRightsPrice" value={formData.exclusiveRightsPrice} onChange={handleChange} className="w-full bg-neutral-900 border-2 border-neutral-700 rounded-xl pl-8 pr-4 py-2.5 text-lg md:text-xl text-white focus:outline-none focus:ring-4 focus:ring-indigo-500 font-mono font-bold" />
                    </div>
                  )}
                </div>
              </div>

              {/* Negotiations & Discounts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-6 border-t border-neutral-800">
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-neutral-950 p-3 rounded border border-neutral-800">
                    <span className="text-sm text-neutral-300">Negotiable "Make an Offer" Bidding</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={formData.makeAnOfferEnabled} onChange={(e) => setFormData(prev => ({ ...prev, makeAnOfferEnabled: e.target.checked }))} />
                      <div className="w-9 h-5 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500"></div>
                    </label>
                  </div>
                  
                  {formData.makeAnOfferEnabled && (
                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-1">Minimum Price Floor Limit Bidding Box</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-neutral-500 text-sm">$</span>
                        <input type="number" name="minimumPriceFloor" value={formData.minimumPriceFloor} onChange={handleChange} className="w-full bg-neutral-950 border border-neutral-800 rounded-md pl-7 pr-3 py-1.5 text-sm" placeholder="Minimum offer accepted" />
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Bulk Discount Category Connector Selector</label>
                    <select name="bulkDiscountCategory" value={formData.bulkDiscountCategory} onChange={handleChange} className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-1.5 text-sm">
                      <option>None</option>
                      <option>Buy 1 Get 1 Free</option>
                      <option>Buy 2 Get 1 Free</option>
                      <option>Buy 3 Get 2 Free</option>
                      <option>Custom Promo A</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Custom License Contract Text Connector</label>
                    <select name="customContract" value={formData.customContract} onChange={handleChange} className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-1.5 text-sm">
                      <option value="">Use Default Template</option>
                      <option value="contract_a">Custom Contract Template A</option>
                      <option value="contract_b">Custom Contract Template B</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Coupons Optimization Link Entry</label>
                    <input type="text" name="couponsLink" value={formData.couponsLink} onChange={handleChange} className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-1.5 text-sm" placeholder="e.g. SUMMER25 campaign" />
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* STEP 5: Advanced Settings */}
        {currentStep === 4 && (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-xl font-semibold mb-4 border-b border-neutral-800 pb-2">Advanced Settings</h2>
              <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800 space-y-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">YouTube Content ID Enrollment</label>
                  <select name="youtubeContentIdEnrollment" value={formData.youtubeContentIdEnrollment} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="Opt-out">Do Not Enroll</option>
                    <option value="Opt-in">Enroll Track in Content ID</option>
                  </select>
                  <p className="text-xs text-neutral-500 mt-1">Automatically flag unauthorized usage on YouTube.</p>
                </div>

                {formData.youtubeContentIdEnrollment === 'Opt-in' && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1">YouTube Content ID White-List Exception</label>
                    <textarea name="youtubeContentIdWhitelist" value={formData.youtubeContentIdWhitelist} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Enter channel IDs or URLs to exclude from claims..." rows={3} />
                    <p className="text-xs text-neutral-500 mt-1">These channels will not receive copyright claims.</p>
                  </div>
                )}
              </div>
              
              <h2 className="text-xl font-semibold mb-4 border-b border-neutral-800 pb-2">Free Downloads & Lead Generation Gates</h2>
              <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
                  <div>
                    <h3 className="font-medium text-white">Free Download Enable Master Switch</h3>
                    <p className="text-xs text-neutral-500 mt-1">Permits free downloads of files to build email lists and social followings.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={formData.freeDownloadEnabled} 
                      onChange={(e) => setFormData(prev => ({ ...prev, freeDownloadEnabled: e.target.checked }))} 
                    />
                    <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                  </label>
                </div>
                
                {formData.freeDownloadEnabled && (
                  <div className="space-y-6 animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-1">Free Delivery File Variant</label>
                        <select name="freeDeliveryVariant" value={formData.freeDeliveryVariant} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                          <option>Watermarked Preview</option>
                          <option>Clean File (Untagged)</option>
                          <option>Voice Tagged MP3</option>
                        </select>
                      </div>
                      
                      <div>
                         <label className="block text-sm font-medium text-neutral-400 mb-1">Watermark Hard-Lock Requirement</label>
                         <div className="mt-2 flex items-center">
                            <input type="checkbox" checked={formData.watermarkHardLock} onChange={(e) => setFormData(prev => ({...prev, watermarkHardLock: e.target.checked}))} className="rounded border-neutral-700 bg-neutral-900 text-indigo-500 focus:ring-indigo-500" />
                            <span className="ml-2 text-sm text-neutral-300">Ensure voice tags remain on free distributions</span>
                         </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded border border-neutral-800 bg-neutral-900/50">
                         <h4 className="font-medium text-sm text-white mb-3">Email Capture Gates</h4>
                         <div className="space-y-3">
                           <label className="flex items-center text-sm text-neutral-300">
                              <input type="checkbox" checked={formData.requireEmail} onChange={(e) => setFormData(prev => ({...prev, requireEmail: e.target.checked}))} className="mr-2 rounded border-neutral-700 bg-neutral-900 text-indigo-500 focus:ring-indigo-500" />
                              Email Capture Lead Requirement (Name & Email)
                           </label>
                           {formData.requireEmail && (
                             <>
                              <input type="text" name="mailingListSegment" value={formData.mailingListSegment} onChange={handleChange} className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-xs text-white" placeholder="Mailing List Segment Grouping (e.g. Beats_2024)" />
                              <input type="text" name="newsletterApiSync" value={formData.newsletterApiSync} onChange={handleChange} className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-xs text-white" placeholder="External Newsletter API Sync Link (Mailchimp/AWeber)" />
                             </>
                           )}
                           <label className="flex items-center text-sm text-neutral-300">
                              <input type="checkbox" checked={formData.marketingOptIn} onChange={(e) => setFormData(prev => ({...prev, marketingOptIn: e.target.checked}))} className="mr-2 rounded border-neutral-700 bg-neutral-900 text-indigo-500 focus:ring-indigo-500" />
                              Collect Marketing Communications Opt-In
                           </label>
                         </div>
                      </div>

                      <div className="p-4 rounded border border-neutral-800 bg-neutral-900/50">
                         <h4 className="font-medium text-sm text-white mb-3">Social Unlock Gates</h4>
                         <div className="space-y-3">
                           <label className="flex items-center text-sm text-neutral-300">
                              <input type="checkbox" checked={formData.airbitFollowGate} onChange={(e) => setFormData(prev => ({...prev, airbitFollowGate: e.target.checked}))} className="mr-2 rounded border-neutral-700 bg-neutral-900 text-indigo-500 focus:ring-indigo-500" />
                              Platform Profile Follow Gate
                           </label>
                           <label className="flex items-center text-sm text-neutral-300">
                              <input type="checkbox" checked={formData.youtubeSubGate} onChange={(e) => setFormData(prev => ({...prev, youtubeSubGate: e.target.checked}))} className="mr-2 rounded border-neutral-700 bg-neutral-900 text-indigo-500 focus:ring-indigo-500" />
                              YouTube Subscription Gate
                           </label>
                           {formData.youtubeSubGate && (
                             <input type="text" name="youtubeChannelId" value={formData.youtubeChannelId} onChange={handleChange} className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-xs text-white" placeholder="Verified Target Channel ID" />
                           )}
                           <label className="flex items-center text-sm text-neutral-300">
                              <input type="checkbox" checked={formData.tiktokGate} onChange={(e) => setFormData(prev => ({...prev, tiktokGate: e.target.checked}))} className="mr-2 rounded border-neutral-700 bg-neutral-900 text-indigo-500 focus:ring-indigo-500" />
                              TikTok Account Connection Gate
                           </label>
                           <label className="flex items-center text-sm text-neutral-300">
                              <input type="checkbox" checked={formData.soundcloudGate} onChange={(e) => setFormData(prev => ({...prev, soundcloudGate: e.target.checked}))} className="mr-2 rounded border-neutral-700 bg-neutral-900 text-indigo-500 focus:ring-indigo-500" />
                              SoundCloud Account Connection Gate
                           </label>
                           <label className="flex items-center text-sm text-neutral-300">
                              <input type="checkbox" checked={formData.twitterGate} onChange={(e) => setFormData(prev => ({...prev, twitterGate: e.target.checked}))} className="mr-2 rounded border-neutral-700 bg-neutral-900 text-indigo-500 focus:ring-indigo-500" />
                              Twitter/X Social Follow Gate
                           </label>
                         </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-1">Free Lease Contract Association</label>
                        <select name="freeLeaseContract" value={formData.freeLeaseContract} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                          <option>Promotional Use Only</option>
                          <option>Non-Profit / No Streaming</option>
                          <option>Custom Free Agreement</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-1">Download Pool Maximum Limit</label>
                        <input type="number" name="maxFreeDownloads" value={formData.maxFreeDownloads} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono" placeholder="0 = Unlimited" />
                      </div>

                      <div className="col-span-1 md:col-span-2 p-4 bg-indigo-950/20 border border-indigo-500/30 rounded-lg space-y-3">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                          <div>
                            <label className="block text-sm font-bold text-white flex items-center gap-2">
                              <span>Free Download Redirect & Player Link</span>
                              {formData.title && (
                                <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[11px] font-semibold rounded-full flex items-center gap-1">
                                  ✓ Title Detected: "{formData.title}"
                                </span>
                              )}
                            </label>
                            <p className="text-xs text-neutral-400">
                              When unlocked, automatically redirects or streams this beat on the audio player or starts direct audio download.
                            </p>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                const beatName = formData.title || 'Beat';
                                const playerLink = `/player?track=${encodeURIComponent(beatName)}`;
                                setFormData(prev => ({ ...prev, redirectUrl: playerLink }));
                              }}
                              className="px-2 py-1 bg-indigo-900/60 hover:bg-indigo-800/80 text-indigo-300 text-xs font-semibold rounded border border-indigo-500/40 transition-all flex items-center gap-1 shadow-sm"
                              title="Redirect listener to beat on audio player page"
                            >
                              🎧 Sync Beat Title Link
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const fileUrl = formData.audioUrl || '';
                                setFormData(prev => ({ ...prev, redirectUrl: fileUrl }));
                              }}
                              className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded border border-neutral-700 transition-all flex items-center gap-1"
                              title="Set URL directly to uploaded audio file"
                            >
                              ⚡ Direct Audio File
                            </button>

                            <button
                              type="button"
                              onClick={() => testAudioPlayerInUploader(formData.redirectUrl)}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded shadow transition-all flex items-center gap-1"
                            >
                              <Play size={11} className="fill-current" /> Stream in Player
                            </button>
                          </div>
                        </div>

                        <div className="relative">
                          <input 
                            type="text" 
                            name="redirectUrl" 
                            value={formData.redirectUrl} 
                            onChange={handleChange} 
                            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono" 
                            placeholder={formData.title ? `/player?track=${encodeURIComponent(formData.title)}` : "e.g. /player?track=YourBeat or https://yoursite.com/audio.mp3"} 
                          />
                        </div>

                        <div className="flex flex-wrap items-center justify-between text-[11px] text-neutral-400 gap-2">
                          <span className="flex items-center gap-1.5">
                            <span>Status:</span>
                            <strong className="text-emerald-400 font-mono bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                              {formData.redirectUrl ? `Detected (${formData.redirectUrl})` : (formData.title ? `Auto-Detecting (/player?track=${encodeURIComponent(formData.title)})` : 'Link Ready')}
                            </strong>
                          </span>
                          {formData.title && (
                            <button
                              type="button"
                              onClick={() => {
                                navigate(`/player?track=${encodeURIComponent(formData.title)}`);
                              }}
                              className="text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 font-semibold"
                            >
                              <span>Open "{formData.title}" in Audio Player</span> →
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-1">Free Download Tracking Event ID</label>
                        <input type="text" name="freeDownloadTrackingId" value={formData.freeDownloadTrackingId} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono" placeholder="e.g. PROMO-2024-X" />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-1">Download Failure Notification Email</label>
                        <input type="email" name="downloadFailureAlertEmail" value={formData.downloadFailureAlertEmail} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="admin@domain.com" />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-1">Download Link Expiration Clock (Hours)</label>
                        <input type="number" name="linkExpirationHours" value={formData.linkExpirationHours} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono" />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-1">Geo-Targeted Free Download Filter</label>
                        <select name="geoTargetFilter" value={formData.geoTargetFilter} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                          <option>Global</option>
                          <option>US & Canada Only</option>
                          <option>Europe Only</option>
                          <option>Exclude Certain Regions</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-1">Free Track Performance Metrics ID</label>
                        <input type="text" name="freeMetricsId" value={formData.freeMetricsId} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono" placeholder="Monitors conversions" />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 pt-4 border-t border-neutral-800 text-sm text-neutral-300">
                      <label className="flex items-center cursor-pointer">
                        <input type="checkbox" checked={formData.socialApiValidator} onChange={(e) => setFormData(prev => ({...prev, socialApiValidator: e.target.checked}))} className="mr-2 rounded border-neutral-700 bg-neutral-900 text-indigo-500 focus:ring-indigo-500" />
                        Social API Status Validator Monitor
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input type="checkbox" checked={formData.tosComplianceBox} onChange={(e) => setFormData(prev => ({...prev, tosComplianceBox: e.target.checked}))} className="mr-2 rounded border-neutral-700 bg-neutral-900 text-indigo-500 focus:ring-indigo-500" />
                        TOS Compliance Box
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input type="checkbox" checked={formData.captchaGate} onChange={(e) => setFormData(prev => ({...prev, captchaGate: e.target.checked}))} className="mr-2 rounded border-neutral-700 bg-neutral-900 text-indigo-500 focus:ring-indigo-500" />
                        Abuse Prevention Captcha Gate
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4 border-b border-neutral-800 pb-2">
                <h2 className="text-xl font-semibold">Visibility, Scheduling & Release Launch</h2>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${formData.currentStatusBadge === 'Live' ? 'bg-green-500/20 text-green-400' : 'bg-neutral-800 text-neutral-400'}`}>
                   Status: {formData.currentStatusBadge}
                </span>
              </div>
              
              <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1">Visibility Placement</label>
                    <select name="visibilityPlacement" value={formData.visibilityPlacement} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="Public">Public (Marketplace & Store)</option>
                      <option value="Private">Private (Hidden)</option>
                      <option value="Unlisted">Unlisted (Direct Link Only)</option>
                      <option value="Scheduled">Scheduled</option>
                    </select>
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-transparent mb-1">.</label>
                     <button type="button" onClick={() => setFormData(prev => ({...prev, currentStatusBadge: 'Live'}))} className="w-full py-2 px-4 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg text-sm transition-colors shadow-lg shadow-green-900/20">
                        Immediate Live Publication
                     </button>
                  </div>
                </div>

                {formData.visibilityPlacement === 'Scheduled' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-neutral-800 rounded-lg bg-neutral-900/50">
                    <div>
                      <label className="block text-sm font-medium text-neutral-400 mb-1">Future Date Release (Calendar)</label>
                      <input type="date" name="futureDateRelease" value={formData.futureDateRelease} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-400 mb-1">Future Time Release (Timezone)</label>
                      <input type="time" name="futureTimeRelease" value={formData.futureTimeRelease} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </div>
                )}

                {(formData.visibilityPlacement === 'Unlisted' || formData.visibilityPlacement === 'Private') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-neutral-800 rounded-lg bg-neutral-900/50">
                    <div>
                      <label className="block text-sm font-medium text-neutral-400 mb-1">Unlisted Access URL Token String</label>
                      <div className="flex">
                        <input type="text" name="unlistedAccessUrlToken" value={formData.unlistedAccessUrlToken} onChange={handleChange} className="flex-1 bg-neutral-900 border border-neutral-700 rounded-l-lg px-4 py-2 text-sm text-white font-mono" placeholder="Generate unique link..." />
                        <button type="button" onClick={() => setFormData(prev => ({...prev, unlistedAccessUrlToken: Math.random().toString(36).substring(2,15)}))} className="bg-neutral-800 px-3 py-2 border border-neutral-700 border-l-0 rounded-r-lg text-xs font-semibold hover:bg-neutral-700 transition-colors">GENERATE</button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-400 mb-1">Password Vault Protection Entry String</label>
                      <input type="password" name="passwordVaultString" value={formData.passwordVaultString} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono" placeholder="Lock track page..." />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-neutral-800">
                  <div className="space-y-4">
                     <h3 className="text-sm font-medium text-white mb-2">Store & Embed Configurations</h3>
                     
                     <div className="flex items-center justify-between bg-neutral-900/50 p-3 rounded border border-neutral-800">
                        <span className="text-sm text-neutral-300">Infinity Store Sync</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                           <input type="checkbox" checked={formData.infinityStoreSync} onChange={(e) => setFormData(prev => ({...prev, infinityStoreSync: e.target.checked}))} className="sr-only peer" />
                           <div className="w-9 h-5 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500"></div>
                        </label>
                     </div>
                     
                     <div className="flex items-center justify-between bg-neutral-900/50 p-3 rounded border border-neutral-800">
                        <span className="text-sm text-neutral-300">HTML5 Marketplace Sync</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                           <input type="checkbox" checked={formData.html5MarketplaceSync} onChange={(e) => setFormData(prev => ({...prev, html5MarketplaceSync: e.target.checked}))} className="sr-only peer" />
                           <div className="w-9 h-5 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500"></div>
                        </label>
                     </div>

                     <div>
                        <label className="block text-xs font-medium text-neutral-400 mb-1">Store Page Selection Pointer Grid</label>
                        <select name="storePagePointer" value={formData.storePagePointer} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-1.5 text-sm text-white">
                           <option>Home</option><option>New Releases</option><option>Featured</option><option>Custom Page 1</option>
                        </select>
                     </div>
                     
                     <div>
                        <label className="block text-xs font-medium text-neutral-400 mb-1">Embed Player Tab Configuration</label>
                        <select name="embedPlayerTabConfig" value={formData.embedPlayerTabConfig} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-1.5 text-sm text-white">
                           <option>Top</option><option>Bottom</option><option>Hidden</option>
                        </select>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <h3 className="text-sm font-medium text-white mb-2">Display & Integrations</h3>

                     <div className="flex flex-col gap-3">
                        <label className="flex items-center text-sm text-neutral-300 cursor-pointer">
                           <input type="checkbox" checked={formData.storeFrontRowPinned} onChange={(e) => setFormData(prev => ({...prev, storeFrontRowPinned: e.target.checked}))} className="mr-2 rounded border-neutral-700 bg-neutral-900 text-indigo-500 focus:ring-indigo-500" />
                           Store Front Row Featured Pinned
                        </label>
                        <label className="flex items-center text-sm text-neutral-300 cursor-pointer">
                           <input type="checkbox" checked={formData.profileDiscoveryPinned} onChange={(e) => setFormData(prev => ({...prev, profileDiscoveryPinned: e.target.checked}))} className="mr-2 rounded border-neutral-700 bg-neutral-900 text-indigo-500 focus:ring-indigo-500" />
                           Profile Discovery Feed Pinned Trigger
                        </label>
                        <label className="flex items-center text-sm text-neutral-300 cursor-pointer">
                           <input type="checkbox" checked={formData.preOrderAssetLock} onChange={(e) => setFormData(prev => ({...prev, preOrderAssetLock: e.target.checked}))} className="mr-2 rounded border-neutral-700 bg-neutral-900 text-indigo-500 focus:ring-indigo-500" />
                           Pre-Order Asset Lock Mechanism
                        </label>
                        <label className="flex items-center text-sm text-neutral-300 cursor-pointer">
                           <input type="checkbox" checked={formData.archivedExcludedVector} onChange={(e) => setFormData(prev => ({...prev, archivedExcludedVector: e.target.checked}))} className="mr-2 rounded border-neutral-700 bg-neutral-900 text-indigo-500 focus:ring-indigo-500" />
                           Archived Excluded Vector (Off-shelf storage)
                        </label>
                        <label className="flex items-center text-sm text-neutral-300 cursor-pointer">
                           <input type="checkbox" checked={formData.seasonalTakedownSwitch} onChange={(e) => setFormData(prev => ({...prev, seasonalTakedownSwitch: e.target.checked}))} className="mr-2 rounded border-neutral-700 bg-neutral-900 text-indigo-500 focus:ring-indigo-500" />
                           Seasonal Takedown Activation Switch
                        </label>
                     </div>

                     <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                           <label className="block text-xs font-medium text-neutral-400 mb-1">Catalog Sort Index</label>
                           <input type="number" name="catalogSortIndex" value={formData.catalogSortIndex} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-1.5 text-sm text-white font-mono" />
                        </div>
                        <div>
                           <label className="block text-xs font-medium text-neutral-400 mb-1">Bulk Action Batch</label>
                           <input type="text" name="bulkActionQueueBatch" value={formData.bulkActionQueueBatch} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-1.5 text-sm text-white" placeholder="Group ID" />
                        </div>
                     </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-neutral-800">
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1">Regional Market Blackout</label>
                    <input type="text" name="regionalMarketBlackout" value={formData.regionalMarketBlackout} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-sm text-white" placeholder="Country Codes (e.g. RU, CN)" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1">Bandzoogle Feature Sync Token</label>
                    <input type="text" name="bandzoogleSyncToken" value={formData.bandzoogleSyncToken} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-sm text-white font-mono" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1">External Store Theme Override</label>
                    <input type="text" name="externalStoreThemeOverride" value={formData.externalStoreThemeOverride} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-sm text-white" placeholder="Theme ID or hex colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1">Standalone Domain Mapping Hook</label>
                    <input type="text" name="standaloneDomainMapping" value={formData.standaloneDomainMapping} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-sm text-white" placeholder="customdomain.com/beat" />
                  </div>
                  <div className="col-span-full flex gap-2">
                     <button type="button" className="flex-1 py-2 px-4 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-300 font-medium rounded-lg text-sm transition-colors">
                        Save Configuration Master Call
                     </button>
                     <button type="button" className="flex-1 py-2 px-4 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 font-medium rounded-lg text-sm transition-colors">
                        Direct Embed URL Exporter
                     </button>
                     <button type="button" className="flex-1 py-2 px-4 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 font-medium rounded-lg text-sm transition-colors">
                        Global Refresh Sync Signal
                     </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-4 border-b border-neutral-800 pb-2">Collaborators</h2>
              <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800 text-center text-sm text-neutral-500">
                You are currently taking 100% of profit and publishing.
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: Syndication & Marketing Pixels */}
        {currentStep === 5 && (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
             <div>
                <h2 className="text-xl font-semibold mb-4 border-b border-neutral-800 pb-2">Social Post Settings</h2>
                <div className="bg-neutral-950 p-6 rounded-lg border border-neutral-800 mb-8 space-y-4">
                   <div>
                      <label className="block text-sm font-medium text-neutral-400 mb-1">Social Post Title</label>
                      <input type="text" name="socialPostTitle" value={formData.socialPostTitle} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-sm text-white" placeholder="Optional custom title for social posts" />
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-neutral-400 mb-1">Social Post Description</label>
                      <textarea name="socialPostDescription" value={formData.socialPostDescription} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-sm text-white" placeholder="Optional custom description for social posts" rows={2} />
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-neutral-400 mb-1">Social Post Artwork</label>
                      <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e.target.files, 'image', 'tagged', 'socialPostArtworkUrl')} className="w-full text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-neutral-800 file:text-neutral-300 hover:file:bg-neutral-700" />
                      {formData.socialPostArtworkUrl && <img src={formData.socialPostArtworkUrl} alt="Social Preview" className="mt-2 w-32 h-32 object-cover rounded-lg" />}
                   </div>
                </div>
             </div>
             <div>
                <h2 className="text-xl font-semibold mb-4 border-b border-neutral-800 pb-2">Syndication Channels & Marketing Pixels</h2>
                
                <div className="mb-8">
                   <LiveSocialUnlock />
                </div>

                <div className="bg-neutral-950 p-6 rounded-lg border border-neutral-800 mb-8 shadow-inner">
                   <div className="flex items-center gap-3 mb-6 border-b border-neutral-800 pb-4">
                     <div className="p-2 bg-indigo-500/10 rounded-lg">
                       <Sparkles className="w-5 h-5 text-indigo-400" />
                     </div>
                     <div>
                       <h3 className="text-sm font-bold text-white uppercase tracking-wider">Social Unlock Settings</h3>
                       <p className="text-[10px] text-neutral-400">Marketing automation & Social Unlock locks for free downloads.</p>
                     </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div>
                       <label className="block text-xs font-medium text-neutral-400 mb-1">Required Action</label>
                       <select 
                         name="socialUnlockModule" 
                         value={formData.socialUnlockModule} 
                         onChange={handleChange}
                         className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-1.5 text-sm text-white focus:ring-1 focus:ring-indigo-500"
                       >
                         <option value="None">None</option>
                         <option value="SPOTIFY_FOLLOW">Spotify Follow</option>
                         <option value="YOUTUBE_SUBSCRIBE">YouTube Subscribe</option>
                         <option value="EMAIL_LIST">Email List Subscription</option>
                       </select>
                     </div>
                     <div>
                       <label className="block text-xs font-medium text-neutral-400 mb-1">Target Account ID / URL</label>
                       <input 
                         type="text" 
                         name="youtubeChannelId" 
                         value={formData.youtubeChannelId} 
                         onChange={handleChange} 
                         placeholder="e.g. Channel ID or User ID"
                         className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-1.5 text-sm text-white focus:ring-1 focus:ring-indigo-500" 
                       />
                     </div>
                     <div>
                       <label className="block text-xs font-medium text-neutral-400 mb-1">Free Download File Type</label>
                       <select 
                         name="freeDeliveryVariant" 
                         value={formData.freeDeliveryVariant} 
                         onChange={handleChange}
                         className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-1.5 text-sm text-white focus:ring-1 focus:ring-indigo-500"
                       >
                         <option value="MP3">MP3 (320kbps)</option>
                         <option value="WAV">WAV (Lossless)</option>
                       </select>
                     </div>
                   </div>
                </div>

                <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800 space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                         <h3 className="text-sm font-medium text-white mb-2">Automated Video Production & Social Channels</h3>
                         
                         <label className="flex items-center text-sm text-neutral-300 cursor-pointer">
                            <input type="checkbox" checked={formData.autoPostVideo} onChange={(e) => setFormData(prev => ({...prev, autoPostVideo: e.target.checked}))} className="mr-2 rounded border-neutral-700 bg-neutral-900 text-indigo-500 focus:ring-indigo-500" />
                            Auto-Post Beat Video Master Toggle
                         </label>
                         <label className="flex items-center text-sm text-neutral-300 cursor-pointer">
                            <input type="checkbox" checked={formData.youtubeVideoGen} onChange={(e) => setFormData(prev => ({...prev, youtubeVideoGen: e.target.checked}))} className="mr-2 rounded border-neutral-700 bg-neutral-900 text-indigo-500 focus:ring-indigo-500" />
                            YouTube Video Generation Pipeline Switch
                         </label>
                         <label className="flex items-center text-sm text-neutral-300 cursor-pointer">
                            <input type="checkbox" checked={formData.tiktokVideoGen} onChange={(e) => setFormData(prev => ({...prev, tiktokVideoGen: e.target.checked}))} className="mr-2 rounded border-neutral-700 bg-neutral-900 text-indigo-500 focus:ring-indigo-500" />
                            TikTok Short-Form Video Generator Switch
                         </label>

                         <div>
                            <label className="block text-xs font-medium text-neutral-400 mb-1">YouTube Target Channel Account Box</label>
                            <input type="text" name="youtubeTargetChannel" value={formData.youtubeTargetChannel} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-1.5 text-sm text-white" />
                         </div>
                         <div>
                            <label className="block text-xs font-medium text-neutral-400 mb-1">TikTok Target Channel Account Box</label>
                            <input type="text" name="tiktokTargetChannel" value={formData.tiktokTargetChannel} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-1.5 text-sm text-white" />
                         </div>
                         <div>
                            <label className="block text-xs font-medium text-neutral-400 mb-1">YouTube Companion Video URL Slot</label>
                            <input type="url" name="youtubeCompanionUrl" value={formData.youtubeCompanionUrl} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-1.5 text-sm text-white" />
                         </div>
                         <div>
                            <label className="block text-xs font-medium text-neutral-400 mb-1">TikTok Trending Audio Track Sync</label>
                            <input type="text" name="tiktokTrendingAudioSync" value={formData.tiktokTrendingAudioSync} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-1.5 text-sm text-white" />
                         </div>
                      </div>

                      <div className="space-y-4">
                         <h3 className="text-sm font-medium text-white mb-2">DSP Distribution & Integrations</h3>

                         <label className="flex items-center text-sm text-neutral-300 cursor-pointer bg-neutral-900/50 p-2 border border-neutral-800 rounded">
                            <input type="checkbox" checked={formData.dspDistributionOptIn} onChange={(e) => setFormData(prev => ({...prev, dspDistributionOptIn: e.target.checked}))} className="mr-2 rounded border-neutral-700 bg-neutral-900 text-indigo-500 focus:ring-indigo-500" />
                            DSP Distribution Master Opt-In (Spotify/Apple)
                         </label>
                         
                         <div>
                            <label className="block text-xs font-medium text-neutral-400 mb-1">Spotify Verified Artist Link Identification Box</label>
                            <input type="text" name="spotifyArtistLink" value={formData.spotifyArtistLink} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-1.5 text-sm text-white" />
                         </div>
                         <div>
                            <label className="block text-xs font-medium text-neutral-400 mb-1">Apple Music Artist Link Identification Box</label>
                            <input type="text" name="appleMusicArtistLink" value={formData.appleMusicArtistLink} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-1.5 text-sm text-white" />
                         </div>
                         <div>
                            <label className="block text-xs font-medium text-neutral-400 mb-1">Universal Product Code (UPC) Core Field</label>
                            <input type="text" name="upcCoreField" value={formData.upcCoreField} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-1.5 text-sm text-white font-mono" />
                         </div>
                         <div>
                            <label className="block text-xs font-medium text-neutral-400 mb-1">SoundCloud Track Synchronizer Link Box</label>
                            <input type="url" name="soundcloudSyncLink" value={formData.soundcloudSyncLink} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-1.5 text-sm text-white" />
                         </div>
                         <div>
                            <label className="block text-xs font-medium text-neutral-400 mb-1">Audiomack Embed Widget Code Window</label>
                            <textarea name="audiomackEmbedCode" value={formData.audiomackEmbedCode} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-1.5 text-sm text-white" rows={2} />
                         </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-neutral-800">
                      <div className="space-y-4">
                         <h3 className="text-sm font-medium text-white mb-2">Tracking Pixels & Ads</h3>
                         <div>
                            <label className="block text-xs font-medium text-neutral-400 mb-1">Google Analytics Account Code Input</label>
                            <input type="text" name="googleAnalyticsCode" value={formData.googleAnalyticsCode} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-1.5 text-sm text-white font-mono" placeholder="G-XXXXXXXXXX" />
                         </div>
                         <div>
                            <label className="block text-xs font-medium text-neutral-400 mb-1">Meta (Facebook) Pixel Identification Entry</label>
                            <input type="text" name="metaPixelId" value={formData.metaPixelId} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-1.5 text-sm text-white font-mono" />
                         </div>
                         <div>
                            <label className="block text-xs font-medium text-neutral-400 mb-1">Google Ads Conversions Event Tracker</label>
                            <input type="text" name="googleAdsTracker" value={formData.googleAdsTracker} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-1.5 text-sm text-white font-mono" />
                         </div>
                         <div>
                            <label className="block text-xs font-medium text-neutral-400 mb-1">Pinterest Tag Pixel Event Tracking</label>
                            <input type="text" name="pinterestTagId" value={formData.pinterestTagId} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-1.5 text-sm text-white font-mono" />
                         </div>
                         <div>
                            <label className="block text-xs font-medium text-neutral-400 mb-1">TikTok Pixel Ad Attribution</label>
                            <input type="text" name="tiktokPixelId" value={formData.tiktokPixelId} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-1.5 text-sm text-white font-mono" />
                         </div>
                      </div>

                      <div className="space-y-4">
                         <h3 className="text-sm font-medium text-white mb-2">Marketing Utilities</h3>
                         <div>
                            <label className="block text-xs font-medium text-neutral-400 mb-1">UTM Campaign Parameter Builder Tool</label>
                            <input type="text" name="utmCampaignBuilder" value={formData.utmCampaignBuilder} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-1.5 text-sm text-white" placeholder="?utm_source=IG&utm_medium=bio" />
                         </div>
                         <div>
                            <label className="block text-xs font-medium text-neutral-400 mb-1">SmartLink Short URL Output Exporter</label>
                            <input type="text" name="smartLinkShortUrl" value={formData.smartLinkShortUrl} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-1.5 text-sm text-white" />
                         </div>
                         <div>
                            <label className="block text-xs font-medium text-neutral-400 mb-1">Automated Social Copy Generation Box</label>
                            <textarea name="autoSocialCopy" value={formData.autoSocialCopy} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-1.5 text-sm text-white" placeholder="Creates ad captions matching chosen mood tags..." rows={2} />
                         </div>
                         <div>
                            <label className="block text-xs font-medium text-neutral-400 mb-1">Marketplace Direct Checkout Shortcut Code</label>
                            <input type="text" name="directCheckoutShortcut" value={formData.directCheckoutShortcut} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-1.5 text-sm text-white" />
                         </div>
                         
                         <label className="flex items-center text-sm text-neutral-300 cursor-pointer">
                            <input type="checkbox" checked={formData.mailingListTrigger} onChange={(e) => setFormData(prev => ({...prev, mailingListTrigger: e.target.checked}))} className="mr-2 rounded border-neutral-700 bg-neutral-900 text-indigo-500 focus:ring-indigo-500" />
                            Mailing List Marketing Automation Trigger Check
                         </label>
                         <label className="flex items-center text-sm text-neutral-300 cursor-pointer">
                            <input type="checkbox" checked={formData.rssPodcastFeed} onChange={(e) => setFormData(prev => ({...prev, rssPodcastFeed: e.target.checked}))} className="mr-2 rounded border-neutral-700 bg-neutral-900 text-indigo-500 focus:ring-indigo-500" />
                            RSS Podcast Distribution Feed Toggle
                         </label>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-neutral-800">
                      <div>
                         <label className="block text-xs font-medium text-neutral-400 mb-1">Email Notification Receipt Layout</label>
                         <select name="emailReceiptLayout" value={formData.emailReceiptLayout} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-1.5 text-sm text-white">
                            <option>Standard</option><option>Custom Brand A</option>
                         </select>
                      </div>
                      <div>
                         <label className="block text-xs font-medium text-neutral-400 mb-1">Social Share Button Configuration Array</label>
                         <input type="text" name="socialShareArray" value={formData.socialShareArray} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-1.5 text-sm text-white" />
                      </div>
                      <div>
                         <label className="block text-xs font-medium text-neutral-400 mb-1">Airbit Marketplace Featured Bid Selector</label>
                         <input type="text" name="airbitFeaturedBid" value={formData.airbitFeaturedBid} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-1.5 text-sm text-white" placeholder="Paid promotion spaces..." />
                      </div>
                   </div>

                   <div className="flex gap-4 pt-4 border-t border-neutral-800 text-sm text-neutral-300">
                      <label className="flex items-center cursor-pointer">
                         <input type="checkbox" checked={formData.localStorageBackupRegistry} onChange={(e) => setFormData(prev => ({...prev, localStorageBackupRegistry: e.target.checked}))} className="mr-2 rounded border-neutral-700 bg-neutral-900 text-indigo-500 focus:ring-indigo-500" />
                         Local Storage Backup Draft Registry
                      </label>
                      <label className="flex items-center cursor-pointer">
                         <input type="checkbox" checked={formData.tosComplianceMatrix} onChange={(e) => setFormData(prev => ({...prev, tosComplianceMatrix: e.target.checked}))} className="mr-2 rounded border-neutral-700 bg-neutral-900 text-indigo-500 focus:ring-indigo-500" />
                         Platform Terms of Upload Compliance Matrix
                      </label>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* STEP 7: Review */}
        {currentStep === 6 && (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-xl font-semibold mb-6 border-b border-neutral-800 pb-2 text-center text-indigo-400">Review & Publish</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Left pane */}
                <div className="space-y-6">
                  <div className="bg-neutral-950 rounded-xl border border-neutral-800 p-6 flex flex-col md:flex-row gap-6 items-center">
                    <div className="w-32 h-32 rounded-lg bg-neutral-900 overflow-hidden flex-shrink-0 shadow-lg">
                      {formData.coverArtUrl ? (
                        <img src={formData.coverArtUrl} alt="Cover" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-600 bg-neutral-900 border border-neutral-800"><ImageIcon className="w-8 h-8" /></div>
                      )}
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <h3 className="text-2xl font-bold">{formData.title || 'Untitled Track'}</h3>
                      <p className="text-indigo-400 font-medium mb-4">{formData.producer}</p>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm font-mono text-neutral-400">
                        <div className="bg-neutral-900 rounded p-2 border border-neutral-800 text-center">
                          <span className="block text-xs text-neutral-500 uppercase">BPM</span>
                          <span className="text-neutral-200">{formData.bpm}</span>
                        </div>
                        <div className="bg-neutral-900 rounded p-2 border border-neutral-800 text-center">
                          <span className="block text-xs text-neutral-500 uppercase">Key</span>
                          <span className="text-neutral-200">{formData.key}</span>
                        </div>
                        <div className="bg-neutral-900 rounded p-2 border border-neutral-800 text-center">
                          <span className="block text-xs text-neutral-500 uppercase">Genre</span>
                          <span className="text-neutral-200 truncate block">{formData.genre}</span>
                        </div>
                        <div className="bg-neutral-900 rounded p-2 border border-neutral-800 text-center">
                          <span className="block text-xs text-neutral-500 uppercase">Price</span>
                          <span className="text-indigo-400">${formData.price}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 flex items-start space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-indigo-100">Ready to Publish</h4>
                      <p className="text-sm text-indigo-200/70 mt-1">Your track will be visible based on your privacy settings and available for purchase immediately.</p>
                    </div>
                  </div>
                </div>

                {/* Right pane: The Real-time Live Sync Preview Card */}
                <div className="flex flex-col items-center justify-center">
                  <h3 className="text-sm text-neutral-400 uppercase font-bold tracking-wider mb-2">⚡ Live Speed Sync Preview ⚡</h3>
                  <div className="player-card w-full max-w-[400px] !my-0 text-center">
                    <img 
                      id="ui-artwork" 
                      src={formData.coverArtUrl || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80"} 
                      alt="Beat Artwork" 
                      className="artwork-view mx-auto" 
                    />
                    <h2 id="ui-title" className="text-xl font-bold text-white leading-tight mt-2">{formData.title || "Dark hall"}</h2>
                    <p id="ui-artist" className="text-[#94a3b8] text-sm mt-1">by {formData.producer || "NightRunna"}</p>
                    <p id="ui-specs" className="text-[#64748b] text-xs mt-1">
                      Key: {formData.key || 'D# minor'} | BPM: {formData.bpm || '119'}{formData.mood ? ` | Mood: ${formData.mood}` : ''}
                    </p>
                    
                    <div id="ui-price" className="price-text">
                      ${Number(formData.price || 30.00).toFixed(2)}
                    </div>

                    <a 
                      id="ui-checkout-btn" 
                      href={(() => {
                        const paypalUser = localStorage.getItem('NIGHTRUNNA_PERSONAL_PAYPAL') || state.profile.paypalEmail || "nightrunna842@gmail.com";
                        const cleanPrice = parseFloat(formData.price as string || '30.00').toFixed(2);
                        if (paypalUser.includes('@')) {
                          return `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodeURIComponent(paypalUser)}&amount=${cleanPrice}&currency_code=USD`;
                        }
                        return `https://paypal.me/${paypalUser}/${cleanPrice}`;
                      })()} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn-paypal"
                    >
                      💙 Checkout with PayPal
                    </a>
                    <button
                      onClick={() => {
                        setFormData({
                            title: '',
                            producer: '',
                            bpm: '',
                            key: '',
                            mode: 'Major',
                            price: '',
                            coverArtUrl: '',
                            audioUrl: '',
                            freeDownload: { enabled: true, requirement: 'email', protection: 'tagged' },
                            isExclusive: false,
                            contentIdEnabled: false,
                            customLicenses: [],
                            tieredPricing: [],
                            bulkDiscount: { threshold: 0, discountPercentage: 0 },
                            description: '',
                            mood: [],
                            tags: [],
                            releaseDate: '',
                            gear: '',
                            instruments: [],
                            primaryGenre: '',
                            secondaryGenre: '',
                            trackType: 'Beat',
                            isExplicit: false,
                            isInstrumental: false,
                            productionYear: new Date().getFullYear(),
                            isrcCode: '',
                        });
                        setCurrentStep(0);
                      }}
                      className="mt-4 flex items-center justify-center gap-2 w-full bg-red-900/10 hover:bg-red-900/30 border border-red-900/30 text-red-500 font-bold py-2 px-4 rounded-lg text-sm transition-colors"
                    >
                      <Trash2 size={16} /> Delete Placeholder Beat
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
        {/* Navigation */}
        <div className="flex justify-between items-center mt-10 pt-6 border-t border-neutral-800">
          <button
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-8 py-4 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-base md:text-lg transition-colors shadow-lg cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" /> Back
          </button>
          
          {currentStep < steps.length - 1 ? (
            <button
              onClick={() => setCurrentStep(prev => Math.min(steps.length - 1, prev + 1))}
              className="flex items-center gap-2 px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-extrabold text-base md:text-xl transition-colors shadow-xl cursor-pointer"
            >
              Next <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
             <button
              onClick={handlePublish}
              className="flex items-center gap-3 px-12 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-extrabold text-lg md:text-2xl transition-all shadow-2xl cursor-pointer active:scale-95"
            >
              <Upload className="w-6 h-6" /> Upload Beat
            </button>
          )}
        </div>
    </div>
  );
});

export default BeatUploader;
