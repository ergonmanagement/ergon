import { requireAuth } from "@/lib/auth";
import { ScheduleClient } from "./_components/schedule-client";
import { AuthDebugger } from "@/components/auth-debugger";
import { SessionRefreshTest } from "@/components/session-refresh-test";
import { ForceLogoutButton } from "@/components/force-logout-button";

export default async function SchedulePage() {
  await requireAuth();
  return (
    <div>
      <ForceLogoutButton />
      <SessionRefreshTest />
      <AuthDebugger />
      <ScheduleClient />
    </div>
  );
}

