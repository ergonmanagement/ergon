"use client";

import Link from "next/link";
import { useState } from "react";
import { AppPageHeader } from "@/components/layout/app-page-header";
import { useJobDetail } from "@/hooks/use-job-detail";
import { useJobPhotoUpload } from "@/hooks/use-job-photos-upload";
import { Button } from "@/components/ui/button";
import { JobLocationMap } from "./job-location-map";

type Props = {
  jobId: string;
};

function statusStyles(status: string) {
  switch (status) {
    case "completed":
      return "bg-success/15 text-success";
    case "scheduled":
      return "bg-primary/15 text-foreground";
    case "paid":
      return "bg-accent text-accent-foreground";
    default:
      return "bg-warning/20 text-foreground";
  }
}

export function JobDetailClient({ jobId }: Props) {
  const { data, loading, error } = useJobDetail(jobId);
  const { upload, uploading, error: uploadError } = useJobPhotoUpload(jobId);
  const [file, setFile] = useState<File | null>(null);

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">Loading job…</p>
    );
  }

  if (error || !data) {
    return (
      <div
        className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg p-4"
        role="alert"
      >
        {error ?? "Job not found."}
      </div>
    );
  }

  const { job, photos } = data;

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    await upload(file);
    setFile(null);
  }

  const scheduleLabel = job.scheduled_start
    ? new Date(job.scheduled_start).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Not scheduled";

  return (
    <div className="space-y-8">
      <Link
        href="/jobs"
        className="inline-flex text-sm font-medium text-primary hover:underline underline-offset-2"
      >
        ← Back to jobs
      </Link>

      <AppPageHeader
        title={job.customer_name}
        description={
          <div className="flex flex-wrap items-center gap-2">
            <span>{job.service_type}</span>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusStyles(job.status)}`}
            >
              {job.status}
            </span>
          </div>
        }
        actions={
          <div className="text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Price
            </p>
            <p className="text-xl font-semibold tabular-nums text-foreground">
              {job.price != null ? `$${job.price.toFixed(2)}` : "—"}
            </p>
          </div>
        }
      />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="ergon-card p-5 space-y-2">
          <h2 className="text-sm font-semibold text-foreground">Schedule</h2>
          <p className="text-sm text-muted-foreground">{scheduleLabel}</p>
          {job.address && (
            <p className="text-sm text-foreground pt-1">
              <span className="text-muted-foreground">Address: </span>
              {job.address}
            </p>
          )}
        </div>
        <div className="ergon-card p-5 space-y-2">
          <h2 className="text-sm font-semibold text-foreground">Notes</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {job.notes ?? "No notes yet."}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Photos</h2>

        <form
          onSubmit={handleUpload}
          className="flex flex-col gap-3 rounded-lg border border-border border-dashed bg-muted/20 p-4 sm:flex-row sm:items-center"
        >
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
          />
          <Button type="submit" size="sm" disabled={uploading || !file}>
            {uploading ? "Uploading…" : "Upload photo"}
          </Button>
          {uploadError && (
            <p className="text-sm text-destructive" role="alert">
              {uploadError}
            </p>
          )}
        </form>

        {photos.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No photos uploaded for this job yet.
          </p>
        )}

        {photos.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="ergon-card overflow-hidden p-0"
              >
                {photo.signed_url ? (
                  <img
                    src={photo.signed_url}
                    alt="Job photo"
                    className="h-32 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
                    Image unavailable
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {job.address?.trim() &&
        process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Location Map</h2>
            <JobLocationMap address={job.address.trim()} />
          </section>
        )}
    </div>
  );
}
