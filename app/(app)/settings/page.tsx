import { requireAuth } from "@/lib/auth";
import { SettingsClient } from "./_components/settings-client";

export default async function SettingsPage() {
  await requireAuth();
  return <SettingsClient />;
}

