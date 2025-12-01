import { create } from 'zustand';
import { auth, db } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

const emptyProfile = {
  displayName: '',
  pronouns: '',
  bio: ''
};

const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,
  error: null,
  profile: emptyProfile,
  profileLoading: false,
  profileError: null,

  initializeListener: () => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      set({ user, loading: false });

      if (user?.uid) {
        await get().loadProfile(user.uid);
      } else {
        set({ profile: emptyProfile, profileLoading: false, profileError: null });
      }
    });
    return unsubscribe;
  },

  // Note: user object from Firebase is read-only. We need to store profile data separately in Firestore
  // or just manage local state for purchases.
  // For this MVP, we will assume purchases are stored in a `user_profiles` collection or similar.
  // Actually, we can attach it to the local user object if we fetch it.

  purchasedContent: [], // Array of Campaign IDs

  addPurchase: (contentId) => set((state) => ({
      purchasedContent: [...state.purchasedContent, contentId]
  })),

  updateProfileField: (field, value) => set((state) => ({
    profile: { ...state.profile, [field]: value }
  })),

  loadProfile: async (uid) => {
    try {
      set({ profileLoading: true, profileError: null });

      if (import.meta.env.VITE_FIREBASE_API_KEY === "dummy-key") {
        const cachedProfile = JSON.parse(localStorage.getItem(`profile_${uid}`) || '{}');
        set({ profile: { ...emptyProfile, ...cachedProfile }, profileLoading: false });
        return;
      }

      const profileRef = doc(db, 'users', uid);
      const snap = await getDoc(profileRef);
      const data = snap.exists() ? snap.data() : {};

      set({
        profile: {
          ...emptyProfile,
          displayName: data.displayName || data.name || '',
          pronouns: data.pronouns || '',
          bio: data.bio || ''
        },
        profileLoading: false
      });
    } catch (error) {
      console.error('Failed to load profile', error);
      set({ profileError: error.message, profileLoading: false });
    }
  },

  saveProfile: async (uid) => {
    const { profile } = get();

    try {
      set({ profileLoading: true, profileError: null });

      if (import.meta.env.VITE_FIREBASE_API_KEY === "dummy-key") {
        localStorage.setItem(`profile_${uid}`, JSON.stringify(profile));
        set({ profileLoading: false });
        return;
      }

      await setDoc(
        doc(db, 'users', uid),
        {
          displayName: profile.displayName || '',
          pronouns: profile.pronouns || '',
          bio: profile.bio || '',
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );

      set({ profileLoading: false });
    } catch (error) {
      console.error('Failed to save profile', error);
      set({ profileError: error.message, profileLoading: false });
    }
  },

  register: async (email, password) => {
    try {
      set({ loading: true, error: null });
      if (import.meta.env.VITE_FIREBASE_API_KEY === "dummy-key") {
        console.warn("Using Mock Registration.");
        set({ user: { uid: "mock-user-123", email: email }, loading: false });
        return;
      }
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  login: async (email, password) => {
    try {
      set({ loading: true, error: null });
      // For demo purposes, if keys are missing, we mock a login
      if (import.meta.env.VITE_FIREBASE_API_KEY === "dummy-key") {
         console.warn("Using Mock Login because Firebase keys are missing.");
         set({ user: { uid: "mock-user-123", email: email }, loading: false });
         return;
      }
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  logout: async () => {
    try {
      if (import.meta.env.VITE_FIREBASE_API_KEY === "dummy-key") {
          set({ user: null });
          return;
      }
      await signOut(auth);
    } catch (error) {
      console.error(error);
    }
  }
}));

export default useAuthStore;
