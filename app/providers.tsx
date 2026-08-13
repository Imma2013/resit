'use client';

import { ConvexProviderWithAuth, ConvexReactClient } from 'convex/react';
import { onIdTokenChanged, type User } from 'firebase/auth';
import { useEffect, useMemo, useState } from 'react';
import { firebaseAuth } from '@/lib/firebase';

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!firebaseAuth) {
      setIsLoading(false);
      return;
    }
    return onIdTokenChanged(firebaseAuth, (nextUser) => {
      setUser(nextUser);
      setIsLoading(false);
    });
  }, []);

  return {
    isLoading,
    isAuthenticated: user !== null,
    fetchAccessToken: async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      if (!user || !firebaseAuth) return null;
      return user.getIdToken(forceRefreshToken);
    },
  };
}

export function AppProviders({ children }: Readonly<{ children: React.ReactNode }>) {
  const client = useMemo(() => convexUrl ? new ConvexReactClient(convexUrl) : null, []);

  if (!client) return children;

  return (
    <ConvexProviderWithAuth client={client} useAuth={useFirebaseAuth}>
      {children}
    </ConvexProviderWithAuth>
  );
}
