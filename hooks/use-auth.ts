"use client";

import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

/**
 * React hook to manage authentication state in Client Components
 * 
 * Provides:
 * - Current authenticated user data
 * - Loading state during auth checks
 * - Automatic state updates when auth changes
 * 
 * This hook is for client-side components. For server-side auth, use requireAuth() instead.
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, loading } = useAuth();
 *   
 *   if (loading) return <div>Loading...</div>;
 *   if (!user) return <div>Not authenticated</div>;
 *   
 *   return <div>Hello, {user.email}</div>;
 * }
 * ```
 */
export function useAuth() {
  // State to track current authenticated user
  const [user, setUser] = useState<User | null>(null);
  // Loading state to handle initial auth check and transitions
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Get initial session on mount
    // This handles page refreshes and initial loads
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Set up real-time listener for authentication state changes
    // This handles login, logout, token refresh, etc.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Cleanup subscription on unmount to prevent memory leaks
    return () => subscription.unsubscribe();
  }, []); // Empty dependency array - only run once on mount

  return { user, loading };
}
