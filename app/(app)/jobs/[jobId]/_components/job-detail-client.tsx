"use client";

import { useState } from "react";
import { useJobDetail } from "@/hooks/use-job-detail";
import { useJobPhotoUpload } from "@/hooks/use-job-photos-upload";

type Props = {
  jobId: string;
};

export function JobDetailClient({ jobId }: Props) {
  const { data, loading, error } = useJobDetail(jobId);
  const { upload, uploading, error: uploadError } = useJobPhotoUpload(jobId);
  const [file, setFile] = useState<File | null>(null);

  if (loading) {
    return <div className="text-sm text-white/70">Loading job...</div>;
  }

  if (error || !data) {
    return (
      <div className="text-sm text-red-400" role="alert">
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{job.customer_name}</h1>
          <p className="text-sm text-white/70">{job.service_type}</p>
          <p className="text-xs text-white/60 capitalize">{job.status}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/60">Price</p>
          <p className="text-xl font-semibold">
            {job.price != null ? `$${job.price.toFixed(2)}` : "-"}
          </p>
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-white/10 rounded-lg p-3 bg-white/5 space-y-2">
          <h2 className="text-sm font-semibold">Schedule</h2>
          <p className="text-sm text-white/80">
            {job.scheduled_start ?? "Not scheduled"}
          </p>
          {job.address && (
            <p className="text-sm text-white/80 mt-1">Address: {job.address}</p>
          )}
        </div>
        <div className="border border-white/10 rounded-lg p-3 bg-white/5 space-y-2">
          <h2 className="text-sm font-semibold">Notes</h2>
          <p className="text-sm text-white/80">
            {job.notes ?? "No notes yet."}
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Photos</h2>

        <form
          onSubmit={handleUpload}
          className="flex flex-col sm:flex-row gap-2 items-start sm:items-center"
        >
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-xs text-white/80"
          />
          <button
            type="submit"
            disabled={uploading || !file}
            className="inline-flex items-center rounded-md border border-white/20 px-3 py-1 text-xs disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload photo"}
          </button>
          {uploadError && (
            <p className="text-xs text-red-400" role="alert">
              {uploadError}
            </p>
          )}
        </form>

        {photos.length === 0 && (
          <p className="text-sm text-white/70">
            No photos uploaded for this job yet.
          </p>
        )}

        {photos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="border border-white/10 rounded-lg overflow-hidden bg-white/5"
              >
                {photo.signed_url ? (
                  <img
                    src={photo.signed_url}
                    alt="Job photo"
                    className="w-full h-32 object-cover"
                  />
                ) : (
                  <div className="w-full h-32 flex items-center justify-center text-xs text-white/60">
                    Image unavailable
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

