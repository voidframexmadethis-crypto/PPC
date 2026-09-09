import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Beat, Profile, StoreState, YouTubeVideo, Analytics } from '../types';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  orderBy,
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { filterHumanBeats, isAIPlaceholderBeat } from '../lib/beatUtils';
import { MILESTONES, generatePlaqueId } from '../utils/achievementUtils';

interface StoreContextType {
  state: StoreState;
  updateProfile: (profile: Partial<Profile>) => Promise<void>;
  addVideo: (video: YouTubeVideo) => void;
  removeVideo: (id: string) => void;
  addBeat: (beat: Beat) => Promise<void>;
  removeBeat: (id: string) => Promise<void>;
  restoreBeat: (id: string) => Promise<void>;
  updateBeat: (id: string, updates: Partial<Beat>) => Promise<void>;
  incrementAnalytics: (metric: keyof Analytics, amount?: number) => void;
  resetAnalytics: (metric: keyof Analytics) => void;
  recordAnalyticsEvent: (eventType: 'VISIT' | 'DOWNLOAD' | 'SHARE' | 'LIKE' | 'PLAY' | 'VIEW' | 'PURCHASE', trackId?: string, metadata?: any) => Promise<void>;
}

const STARTER_BEATS: Beat[] = [];

const defaultState: StoreState = {
  profile: {
    name: 'NightRunna',
    bio: 'Pro Audio Loops & Instrumental Beats',
    avatarUrl: '',
    socialLinks: [],
  },
  videos: [],
  beats: [],
  archivedBeats: [],
  analytics: {
    siteVisits: 0,
    uniqueVisitors: 0,
    totalPlays: 0,
    totalShares: 0,
    downloads: 0,
    totalEarnings: 0,
    platformFees: 0,
  },
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<StoreState>(() => {
    try {
      const savedBeats = localStorage.getItem('nightrunna_beats_backup');
      const savedArchived = localStorage.getItem('nightrunna_archived_backup');
      const savedProfile = localStorage.getItem('nightrunna_profile_backup');
      const parsedBeats = savedBeats ? JSON.parse(savedBeats) : [];
      const validBeats = filterHumanBeats(parsedBeats);
      return {
        profile: savedProfile ? JSON.parse(savedProfile) : defaultState.profile,
        videos: [],
        beats: validBeats,
        archivedBeats: savedArchived ? JSON.parse(savedArchived) : [],
        analytics: defaultState.analytics,
      };
    } catch (e) {
      return defaultState;
    }
  });

  const incrementAnalytics = (metric: keyof Analytics, amount: number = 1) => {
    setState(prev => ({
      ...prev,
      analytics: {
        ...prev.analytics,
        [metric]: (prev.analytics[metric] || 0) + amount
      }
    }));
  };

  const resetAnalytics = (metric: keyof Analytics) => {
    setState(prev => ({
      ...prev,
      analytics: {
        ...prev.analytics,
        [metric]: 0
      }
    }));
  };

  const recordAnalyticsEvent = async (eventType: 'VISIT' | 'DOWNLOAD' | 'SHARE' | 'LIKE' | 'PLAY' | 'VIEW' | 'PURCHASE', trackId?: string, metadata?: any) => {
    let visitorId = localStorage.getItem('NIGHTRUNNA_VISITOR_ID');
    if (!visitorId) {
      visitorId = `v_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem('NIGHTRUNNA_VISITOR_ID', visitorId);
    }
    
    // Fallback original tracking
    try {
      await fetch('/api/analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType, trackId, visitorId })
      });
    } catch (err) {
      // Non-fatal
    }


    
    // Check for important events to trigger notifications
    let notifData: any = null;
    if (eventType === 'PURCHASE') {
      const beatName = metadata?.beatTitle || trackId || 'A beat';
      const price = metadata?.price || 0;
      notifData = {
        type: 'SALE',
        title: '💰 NEW BEAT SALE',
        message: `"${beatName}" was purchased.\n$${Number(price).toFixed(2)}`,
        url: '/admin/orders',
        read: false,
        timestamp: new Date().toISOString()
      };
    } else if (eventType === 'PLAY' && trackId) {
      const beat = state.beats.find(b => b.id === trackId);
      if (beat) {
        const plays = (beat.plays || 0) + 1;
        const matchingMilestone = MILESTONES.find(m => m.milestone === plays);
        if (matchingMilestone) {
           const plaqueId = generatePlaqueId(beat.id, matchingMilestone.milestone);
           const now = new Date();
           const docId = `${beat.id}_${matchingMilestone.milestone}`;

           // Persist Digital Record Plaque to Firestore
           try {
             await setDoc(doc(db, 'achievements', docId), {
               id: docId,
               plaqueId,
               beatId: beat.id,
               beatTitle: beat.title || 'Untitled Beat',
               producer: beat.producer || 'NightRunna',
               milestone: matchingMilestone.milestone,
               milestoneLabel: matchingMilestone.label,
               requiredPlays: matchingMilestone.milestone,
               actualPlaysWhenUnlocked: plays,
               coverArtUrl: beat.coverArtUrl || '',
               earnedDate: now.toISOString(),
               earnedTimestamp: now.getTime(),
               verificationStatus: 'VERIFIED',
               createdAt: serverTimestamp()
             }, { merge: true });
           } catch (e) {
             console.warn("Could not record achievement plaque to Firestore", e);
           }

           notifData = {
             type: 'MILESTONE',
             title: '🏆 RECORD PLAQUE UNLOCKED',
             message: `"${beat.title}" reached ${matchingMilestone.label}!\nYour Digital Record Plaque is ready in the Hall of Fame.`,
             url: '/admin/achievements',
             read: false,
             timestamp: now.toISOString()
           };
        } else {
           // Check for real trending surge based on real play timestamps
           const now = Date.now();
           const playHistoryKey = `play_history_${trackId}`;
           const recentPlayTimes: number[] = JSON.parse(localStorage.getItem(playHistoryKey) || '[]')
             .filter((t: number) => now - t < 3600000); // Last 1 hour
           recentPlayTimes.push(now);
           localStorage.setItem(playHistoryKey, JSON.stringify(recentPlayTimes));

           const lastTrendingSent = Number(localStorage.getItem(`trending_sent_${trackId}`) || '0');
           if (recentPlayTimes.length >= 5 && now - lastTrendingSent > 86400000) {
              localStorage.setItem(`trending_sent_${trackId}`, now.toString());
              notifData = {
                type: 'TRENDING',
                title: '📈 TRENDING BEAT',
                message: `"${beat.title}" is receiving significantly more plays (${recentPlayTimes.length} plays in the past hour).`,
                url: '/admin/analytics',
                read: false,
                timestamp: new Date().toISOString()
              };
           }
        }
      }
    } else if (eventType === 'DOWNLOAD' && trackId) {
       // Throttled Free Download Notification
       const dlKey = `dl_throttle_${trackId}`;
       const dlCount = parseInt(localStorage.getItem(dlKey) || '0') + 1;
       localStorage.setItem(dlKey, dlCount.toString());
       
       if (dlCount % 5 === 0) {
          const beat = state.beats.find(b => b.id === trackId);
          notifData = {
             type: 'DOWNLOAD',
             title: '🆓 FREE DOWNLOAD ACTIVITY',
             message: `"${beat?.title || 'A beat'}" has reached ${dlCount} downloads.`,
             url: '/admin/analytics',
             read: false,
             timestamp: new Date().toISOString()
          };
       }
    }

    if (notifData) {
      // Check notification preferences saved by admin
      let pushAllowed = true;
      let historyAllowed = true;
      let categoryAllowed = true;

      const savedPrefs = localStorage.getItem('NIGHTRUNNA_NOTIF_PREFS');
      if (savedPrefs) {
        try {
          const parsed = JSON.parse(savedPrefs);
          if (typeof parsed.pushEnabled === 'boolean') pushAllowed = parsed.pushEnabled;
          if (typeof parsed.historyEnabled === 'boolean') historyAllowed = parsed.historyEnabled;
          if (parsed.categories) {
            if (notifData.type === 'SALE') categoryAllowed = parsed.categories.sales !== false;
            if (notifData.type === 'MILESTONE') categoryAllowed = parsed.categories.milestones !== false;
            if (notifData.type === 'DOWNLOAD') categoryAllowed = parsed.categories.freeDownloads !== false;
            if (notifData.type === 'TRENDING') categoryAllowed = parsed.categories.trending !== false;
          }
        } catch (e) {
          console.warn("Error reading notification preferences", e);
        }
      }

      if (categoryAllowed) {
        try {
          if (historyAllowed) {
            await addDoc(collection(db, 'notifications'), notifData);
          }
          if (pushAllowed) {
            await fetch('/api/push/notify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(notifData)
            });
          }
        } catch (e) {
          console.warn("Could not record notification", e);
        }
      }
    }


    // New persistent Firestore analytics
    try {
      await addDoc(collection(db, 'analytics_events'), {
        eventType,
        trackId: trackId || null,
        visitorId,
        metadata: metadata || null,
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.warn("Firestore analytics logging failed", err);
    }
  };

  // Save to localStorage whenever beats/archivedBeats/profile change
  useEffect(() => {
    try {
      const validBeats = filterHumanBeats(state.beats);
      localStorage.setItem('nightrunna_beats_backup', JSON.stringify(validBeats));
      localStorage.setItem('nightrunna_archived_backup', JSON.stringify(state.archivedBeats));
      localStorage.setItem('nightrunna_profile_backup', JSON.stringify(state.profile));
    } catch (e) {
      console.error("Failed to save local backup", e);
    }
  }, [state.beats, state.archivedBeats, state.profile]);

  // Sync Beats from Firestore
  useEffect(() => {
    // Public beats listener
    const publicQ = query(
      collection(db, 'beats'),
      where('visibility', '==', 'Public'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribePublic = onSnapshot(publicQ, (snapshot) => {
      const publicBeats: Beat[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const b = { id: doc.id, ...data } as Beat;
        if (!isAIPlaceholderBeat(b)) {
          publicBeats.push(b);
        }
      });
      
      setState(prev => {
        const combined = [...publicBeats, ...prev.beats];
        const uniqueBeats = Array.from(new Map(combined.map(item => [item.id, item])).values());
        
        // Deduplicate by title + producer to prevent duplicates
        const seen = new Set<string>();
        const filtered = uniqueBeats.filter(b => {
          const key = `${(b.title || '').toLowerCase().trim()}_${(b.producer || '').toLowerCase().trim()}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        return {
          ...prev,
          beats: filtered.length > 0 ? filtered : filterHumanBeats(prev.beats)
        };
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'beats');
    });

    // User-specific beats listener (for private/unlisted)
    let unsubscribeUser = () => {};
    if (user) {
      const userQ = query(
        collection(db, 'beats'),
        where('userId', '==', user.uid),
        where('visibility', 'in', ['Private', 'Unlisted'])
      );

      unsubscribeUser = onSnapshot(userQ, (snapshot) => {
        const privateBeats: Beat[] = [];
        snapshot.forEach((doc) => {
          privateBeats.push({ id: doc.id, ...doc.data() } as Beat);
        });

        setState(prev => ({
          ...prev,
          archivedBeats: privateBeats
        }));
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'beats');
      });
    }

    return () => {
      unsubscribePublic();
      unsubscribeUser();
    };
  }, [user]);

  // Sync Profile from Firestore
  useEffect(() => {
    if (!user) return;

    const profileRef = doc(db, 'profiles', user.uid);
    const unsubscribe = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        setState(prev => ({
          ...prev,
          profile: { ...prev.profile, ...docSnap.data() } as Profile
        }));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `profiles/${user.uid}`);
    });

    return () => unsubscribe();
  }, [user]);

  const updateProfile = async (profileUpdate: Partial<Profile>) => {
    setState(prev => ({
      ...prev,
      profile: { ...prev.profile, ...profileUpdate }
    }));
    if (!user) return;
    const profileRef = doc(db, 'profiles', user.uid);
    try {
      await setDoc(profileRef, { 
        ...profileUpdate, 
        userId: user.uid,
        updatedAt: serverTimestamp() 
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `profiles/${user.uid}`);
    }
  };

  const addVideo = (video: YouTubeVideo) => {
    setState((prev) => ({
      ...prev,
      videos: [...prev.videos, video],
    }));
  };

  const removeVideo = (id: string) => {
    setState((prev) => ({
      ...prev,
      videos: prev.videos.filter((v) => v.id !== id),
    }));
  };

  const sanitizeForFirestore = (obj: any): any => {
    if (obj === null || obj === undefined) return null;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
    
    const clean: Record<string, any> = {};
    for (const [key, val] of Object.entries(obj)) {
      if (val !== undefined) {
        clean[key] = sanitizeForFirestore(val);
      }
    }
    return clean;
  };

  const addBeat = async (beat: Beat) => {
    const beatId = beat.id || `human_beat_${Date.now()}`;
    const formattedBeat: Beat = {
      ...beat,
      id: beatId,
      isHumanUploaded: true,
      isLocal: true,
      userId: user?.uid || 'local_user',
      createdAt: (beat.createdAt || new Date().toISOString()) as any,
      updatedAt: new Date().toISOString() as any,
    };

    // 1. Instantly update React local state so the beat appears everywhere immediately
    setState(prev => ({
      ...prev,
      beats: [formattedBeat, ...prev.beats.filter(b => b.id !== formattedBeat.id)]
    }));

    // 2. Persist to Firestore if user is authenticated
    if (user) {
      try {
        const beatRef = doc(db, 'beats', formattedBeat.id);
        const firestoreBeat = sanitizeForFirestore({
          ...formattedBeat,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        await setDoc(beatRef, firestoreBeat);

        // 3. Save Licenses to subcollection
        if (formattedBeat.licenses) {
          const licenseTypes = ['mp3Lease', 'wavLease', 'premiumLease', 'unlimitedLease', 'exclusive'];
          for (const type of licenseTypes) {
            const licenseData = (formattedBeat.licenses as any)[type];
            if (licenseData && licenseData.enabled) {
              const licenseRef = doc(db, 'beats', formattedBeat.id, 'licenses', type);
              await setDoc(licenseRef, {
                licenseType: type,
                price: Number(licenseData.price),
                isActive: true
              });
            }
          }
        }

        // 4. Save Social Unlocks to subcollection
        if (formattedBeat.socialUnlocks && formattedBeat.socialUnlocks.length > 0) {
          for (const unlock of formattedBeat.socialUnlocks) {
            const unlockRef = doc(db, 'beats', formattedBeat.id, 'social_unlocks', unlock.id);
            await setDoc(unlockRef, sanitizeForFirestore(unlock));
          }
        }
      } catch (error) {
        console.warn("Firestore save fallback to local state:", error);
      }
    }
  };

  const removeBeat = async (id: string) => {
    setState(prev => ({
      ...prev,
      beats: prev.beats.filter(b => b.id !== id),
      archivedBeats: prev.archivedBeats.filter(b => b.id !== id)
    }));

    if (user && !id.startsWith('local_') && !id.startsWith('default_')) {
      const beatRef = doc(db, 'beats', id);
      try {
        await deleteDoc(beatRef);
      } catch (error) {
        try {
          await updateDoc(beatRef, { 
            visibility: 'Private',
            updatedAt: serverTimestamp()
          });
        } catch (e) {
          handleFirestoreError(error, OperationType.UPDATE, `beats/${id}`);
        }
      }
    }
  };

  const restoreBeat = async (id: string) => {
    if (!user || id.startsWith('local_')) return;
    const beatRef = doc(db, 'beats', id);
    try {
      await updateDoc(beatRef, { 
        visibility: 'Public',
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `beats/${id}`);
    }
  };

  const updateBeat = async (id: string, updates: Partial<Beat>) => {
    if (!user || id.startsWith('local_')) {
      setState(prev => ({
        ...prev,
        beats: prev.beats.map(b => b.id === id ? { ...b, ...updates } : b),
        archivedBeats: prev.archivedBeats.map(b => b.id === id ? { ...b, ...updates } : b)
      }));
      return;
    }
    const beatRef = doc(db, 'beats', id);
    try {
      await updateDoc(beatRef, { 
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `beats/${id}`);
    }
  };

  return (
    <StoreContext.Provider
      value={{
        state,
        updateProfile,
        addVideo,
        removeVideo,
        addBeat,
        removeBeat,
        restoreBeat,
        updateBeat,
        incrementAnalytics,
        resetAnalytics,
        recordAnalyticsEvent,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
