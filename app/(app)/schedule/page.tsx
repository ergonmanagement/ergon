import { requireAuth } from "@/lib/auth";
import { ScheduleClient } from "./_components/schedule-client";
import { AuthDebugger } from "@/components/auth-debugger";
import { SessionRefreshTest } from "@/components/session-refresh-test";

export default async function SchedulePage() {
  await requireAuth();
  return (
    <div>
      <SessionRefreshTest />
      <AuthDebugger />
      <ScheduleClient />
    </div>
  );
}

