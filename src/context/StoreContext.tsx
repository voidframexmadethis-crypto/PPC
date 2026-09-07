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
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { filterHumanBeats, isAIPlaceholderBeat } from '../lib/beatUtils';

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
  recordAnalyticsEvent: (eventType: 'VISIT' | 'DOWNLOAD' | 'SHARE' | 'LIKE', trackId?: string) => Promise<void>;
}

const STARTER_BEATS: Beat[] = [];

const defaultState: StoreState = {
  profile: {
    name: 'KRYPSIDE',
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
      const savedBeats = localStorage.getItem('krypside_beats_backup');
      const savedArchived = localStorage.getItem('krypside_archived_backup');
      const savedProfile = localStorage.getItem('krypside_profile_backup');
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

  const recordAnalyticsEvent = async (eventType: 'VISIT' | 'DOWNLOAD' | 'SHARE' | 'LIKE', trackId?: string) => {
    const visitorId = localStorage.getItem('KRYPSIDE_VISITOR_ID');
    try {
      await fetch('/api/analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType, trackId, visitorId })
      });
    } catch (err) {
      console.error("Failed to record analytics event", err);
    }
  };

  // Save to localStorage whenever beats/archivedBeats/profile change
  useEffect(() => {
    try {
      const validBeats = filterHumanBeats(state.beats);
      localStorage.setItem('krypside_beats_backup', JSON.stringify(validBeats));
      localStorage.setItem('krypside_archived_backup', JSON.stringify(state.archivedBeats));
      localStorage.setItem('krypside_profile_backup', JSON.stringify(state.profile));
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
