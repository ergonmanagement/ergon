import { requireAuth } from "@/lib/auth";
import { ScheduleClient } from "./_components/schedule-client";

export default async function SchedulePage() {
  await requireAuth();
  return <ScheduleClient />;
}

