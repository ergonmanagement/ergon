"use client";

import { ProfileProvider } from "@/contexts/profile-context";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProfileProvider>{children}</ProfileProvider>;
}
