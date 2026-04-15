"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ProfileImageUpload } from "@/app/(app)/profile/_components/profile-image-upload";
import { FormDisplayField } from "@/components/form";
import { AppPageHeader } from "@/components/layout/app-page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, error, saveProfileNames } =
    useProfile();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!profile) return;
    setFirstName(profile.first_name ?? "");
    setLastName(profile.last_name ?? "");
  }, [profile]);

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

  async function handleSavePersonal(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setSaving(true);
    const { error: upErr } = await saveProfileNames({
      first_name: firstName,
      last_name: lastName,
    });
    setSaving(false);
    if (upErr) {
      setSaveError(upErr);
      return;
    }
    setSavedAt(Date.now());
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
          <p className="text-xs text-muted-foreground -mt-2">
            Sign-in email is managed with your password under{" "}
            <Link
              href="/auth/login"
              className="text-primary font-medium hover:underline underline-offset-2"
            >
              auth
            </Link>
            . Contact support if you need it changed.
          </p>
          <form onSubmit={handleSavePersonal} className="space-y-4 pt-2">
            <h2 className="text-sm font-semibold text-foreground">
              Personal info
            </h2>
            <div className="space-y-2">
              <Label htmlFor="profile-first-name">First name</Label>
              <Input
                id="profile-first-name"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  setSavedAt(null);
                }}
                autoComplete="given-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-last-name">Last name</Label>
              <Input
                id="profile-last-name"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  setSavedAt(null);
                }}
                autoComplete="family-name"
              />
            </div>
            {saveError && (
              <p className="text-sm text-destructive" role="alert">
                {saveError}
              </p>
            )}
            {savedAt && !saveError && (
              <p className="text-xs text-muted-foreground">Changes saved.</p>
            )}
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save personal info"}
            </Button>
          </form>
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
