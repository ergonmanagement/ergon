"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { Avatar, getInitials } from "@/components/avatar";
import { LogoutButton } from "./logout-button";

export function AuthButton() {
  const { user, loading } = useAuth();
  const { profile } = useProfile();

  if (loading) {
    return (
      <div className="flex items-center gap-4">
        <span className="h-8 w-20 animate-pulse rounded-md bg-white/10" />
      </div>
    );
  }

  return user ? (
    <div className="flex items-center gap-3">
      <Avatar
        imageUrl={profile?.profile_picture_url ?? null}
        initials={getInitials(
          profile?.first_name ?? null,
          profile?.last_name ?? null,
          user.email
        )}
        size="sm"
      />
      <span className="text-sm text-ergon-cream/90 truncate max-w-[180px]">
        {user.email}
      </span>
      <LogoutButton />
    </div>
  ) : (
    <div className="flex gap-2">
      <Link
        href="/auth/login"
        className="rounded-md border border-white/25 px-3 py-1.5 text-sm text-ergon-cream/90 hover:bg-white/10 transition-colors"
      >
        Sign in
      </Link>
      <Link
        href="/auth/sign-up"
        className="rounded-md bg-ergon-primary px-3 py-1.5 text-sm font-semibold text-ergon-navy hover:bg-ergon-primary-hover transition-colors"
      >
        Sign up
      </Link>
    </div>
  );
}
