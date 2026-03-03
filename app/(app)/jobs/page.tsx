import { requireAuth } from "@/lib/auth";
import { JobsClient } from "./_components/jobs-client";

export default async function JobsPage() {
  await requireAuth();
  return <JobsClient />;
}


