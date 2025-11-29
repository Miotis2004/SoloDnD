import { create } from 'zustand';
import { auth } from '../services/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  error: null,
  
  initializeListener: () => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      set({ user, loading: false });
    });
    return unsubscribe;
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
