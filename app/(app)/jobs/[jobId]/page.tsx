import { requireAuth } from "@/lib/auth";
import { JobDetailClient } from "./_components/job-detail-client";

type PageProps = {
  params: { jobId: string };
};

export default async function JobDetailPage({ params }: PageProps) {
  await requireAuth();
  return <JobDetailClient jobId={params.jobId} />;
}

