'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth';
import { firebaseAuth, googleProvider } from '@/lib/firebase';

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  firebaseAuth: typeof firebaseAuth;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  firebaseAuth: null,
  signIn: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!firebaseAuth) {
      setIsLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(firebaseAuth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  async function signIn() {
    if (!firebaseAuth || !googleProvider) {
      console.warn('Firebase Auth is not configured. Running in preview mode.');
      return;
    }
    try {
      await signInWithPopup(firebaseAuth, googleProvider);
    } catch (err) {
      console.error('Sign-in error:', err);
    }
  }

  async function signOut() {
    if (!firebaseAuth) return;
    try {
      await fbSignOut(firebaseAuth);
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        firebaseAuth,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
