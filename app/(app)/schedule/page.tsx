import { requireAuth } from "@/lib/auth";
import { ScheduleClient } from "./_components/schedule-client";
import { DirectFunctionTest } from "@/components/direct-function-test";

export default async function SchedulePage() {
  await requireAuth();
  return (
    <div>
      <DirectFunctionTest />
      <ScheduleClient />
    </div>
  );
}

