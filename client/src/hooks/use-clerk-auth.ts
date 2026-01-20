import { useUser, useClerk } from '@clerk/clerk-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { User } from '@shared/models/auth';

/**
 * Custom hook for Clerk authentication
 *
 * This hook provides a unified interface for authentication state and actions,
 * integrating Clerk's authentication with our backend user data.
 */
export function useClerkAuth() {
  const { user: clerkUser, isLoaded: isClerkLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const queryClient = useQueryClient();

  // Fetch our backend user data (synced from Clerk via webhook)
  const { data: backendUser, isLoading: isBackendLoading } = useQuery<User | null>({
    queryKey: ['/api/auth/user'],
    queryFn: async () => {
      if (!isSignedIn || !clerkUser) return null;

      try {
        const token = await clerkUser.getIdToken();
        const sessionId = clerkUser.lastActiveSessionId;

        const response = await fetch('/api/auth/user', {
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Clerk-Session-Id': sessionId || '',
          },
        });

        if (response.status === 401) {
          return null;
        }

        if (!response.ok) {
          throw new Error(`${response.status}: ${response.statusText}`);
        }

        return response.json();
      } catch (error) {
        console.error('Failed to fetch backend user:', error);
        return null;
      }
    },
    enabled: isClerkLoaded && isSignedIn,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await signOut();
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/auth/user'], null);
      queryClient.clear();
    },
  });

  const isLoading = !isClerkLoaded || (isSignedIn && isBackendLoading);

  return {
    // User data
    user: backendUser,
    clerkUser,

    // Loading states
    isLoading,
    isAuthenticated: isSignedIn && !!backendUser,

    // Actions
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,

    // Clerk-specific
    getToken: async () => {
      if (!clerkUser) return null;
      return await clerkUser.getIdToken();
    },
    getSessionId: () => clerkUser?.lastActiveSessionId || null,
  };
}

/**
 * API client hook with automatic Clerk authentication
 *
 * This hook provides a fetch wrapper that automatically includes Clerk authentication headers
 */
export function useAuthenticatedFetch() {
  const { clerkUser, isSignedIn } = useUser();

  return async <T = any>(url: string, options: RequestInit = {}): Promise<T> => {
    if (!isSignedIn || !clerkUser) {
      throw new Error('Not authenticated');
    }

    const token = await clerkUser.getIdToken();
    const sessionId = clerkUser.lastActiveSessionId;

    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Clerk-Session-Id': sessionId || '',
      },
    });

    if (!response.ok) {
      throw new Error(`${response.status}: ${response.statusText}`);
    }

    return response.json();
  };
}
