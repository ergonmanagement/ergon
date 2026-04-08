"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ProfileImageUpload } from "@/app/(app)/profile/_components/profile-image-upload";
import { FormDisplayField } from "@/components/form";
import { AppPageHeader } from "@/components/layout/app-page-header";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, error } = useProfile();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth/login");
    }
  }, [user, authLoading, router]);

  if (authLoading || profileLoading) {
    return (
      <div className="max-w-md space-y-4">
        <AppPageHeader title="Profile" variant="minimal" />
        <p className="text-sm text-muted-foreground">Loading profile…</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-md space-y-8">
      <AppPageHeader
        title="Profile"
        description="Your account details"
      />

      {error ? (
        <div className="ergon-card border-destructive/20 p-4">
          <p className="text-sm font-medium text-destructive mb-1">
            Error loading profile
          </p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      ) : profile ? (
        <div className="ergon-card p-6 space-y-6">
          <div className="flex justify-center pb-2">
            <ProfileImageUpload
              profile={{
                profile_picture_url: profile.profile_picture_url,
                first_name: profile.first_name,
                last_name: profile.last_name,
              }}
            />
          </div>
          <FormDisplayField label="Email">{user.email}</FormDisplayField>
          {profile.first_name && (
            <FormDisplayField label="First Name">
              {profile.first_name}
            </FormDisplayField>
          )}
          {profile.last_name && (
            <FormDisplayField label="Last Name">
              {profile.last_name}
            </FormDisplayField>
          )}
          {profile.created_at && (
            <FormDisplayField label="Member Since">
              {new Date(profile.created_at).toLocaleDateString()}
            </FormDisplayField>
          )}
        </div>
      ) : (
        <div className="ergon-card p-4">
          <p className="text-sm text-muted-foreground">No profile found.</p>
        </div>
      )}

      <Link
        href="/dashboard"
        className="inline-flex text-sm font-medium text-primary hover:underline underline-offset-2"
      >
        ← Back to dashboard
      </Link>
    </div>
  );
}
