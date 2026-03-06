"use client";

import { useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useProfileImageUpload } from "@/hooks/use-profile-image-upload";
import { Avatar, getInitials } from "@/components/avatar";

type Profile = {
  profile_picture_url: string | null;
  first_name: string | null;
  last_name: string | null;
};

export function ProfileImageUpload({ profile }: { profile: Profile }) {
  const { user } = useAuth();
  const { upload, uploading, uploadedUrl, error } = useProfileImageUpload();
  const inputRef = useRef<HTMLInputElement>(null);

  const initials = getInitials(
    profile.first_name,
    profile.last_name,
    user?.email
  );

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) await upload(file);
    e.target.value = "";
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="relative rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
      >
        <Avatar
          imageUrl={uploadedUrl ?? profile.profile_picture_url}
          initials={initials}
          size="lg"
        />
        {uploading && (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white text-xs">
            Uploading…
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload profile picture"
      />
      <span className="text-sm text-gray-500">
        {uploading ? "Uploading…" : "Click to change photo"}
      </span>
      {error && (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
