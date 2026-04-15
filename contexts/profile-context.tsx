"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type Profile = {
  profile_picture_url: string | null;
  first_name: string | null;
  last_name: string | null;
  created_at?: string | null;
};

type ProfileContextValue = {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  updateProfile: (partial: Partial<Profile>) => void;
  saveProfileNames: (input: {
    first_name: string;
    last_name: string;
  }) => Promise<{ error: string | null }>;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = useCallback((partial: Partial<Profile>) => {
    setProfile((prev) => (prev ? { ...prev, ...partial } : null));
  }, []);

  const saveProfileNames = useCallback(
    async ({
      first_name,
      last_name,
    }: {
      first_name: string;
      last_name: string;
    }): Promise<{ error: string | null }> => {
      if (!user?.id) {
        return { error: "Not signed in." };
      }
      const supabase = createClient();
      const fn = first_name.trim() || null;
      const ln = last_name.trim() || null;
      const { error: upErr } = await supabase
        .from("profiles")
        .update({ first_name: fn, last_name: ln })
        .eq("user_id", user.id);
      if (upErr) {
        return { error: upErr.message };
      }
      updateProfile({ first_name: fn, last_name: ln });
      return { error: null };
    },
    [user?.id, updateProfile],
  );

  useEffect(() => {
    if (!user?.id) {
      setProfile(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("profile_picture_url, first_name, last_name, created_at")
      .eq("user_id", user.id)
      .single()
      .then(({ data, error: fetchError }) => {
        setProfile(data ?? null);
        setError(fetchError?.message ?? null);
        setLoading(false);
      });
  }, [user?.id]);

  const value: ProfileContextValue = {
    profile,
    loading,
    error,
    updateProfile,
    saveProfileNames,
  };

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfileContext(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error("useProfileContext must be used within ProfileProvider");
  }
  return ctx;
}
