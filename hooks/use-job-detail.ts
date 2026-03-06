"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Job } from "@/hooks/use-jobs";

export type JobPhoto = {
  id: string;
  storage_path: string;
  signed_url: string | null;
};

export type JobDetail = {
  job: Job;
  photos: JobPhoto[];
};

export function useJobDetail(jobId: string) {
  const [data, setData] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();

        const { data: job, error: jobError } = await supabase
          .from("jobs")
          .select("*")
          .eq("id", jobId)
          .single();

        if (!isMounted) return;

        if (jobError || !job) {
          setError("Job not found.");
          setLoading(false);
          return;
        }

        const { data: photos, error: photosError } = await supabase
          .from("job_photos")
          .select("id, storage_path")
          .eq("job_id", jobId)
          .order("created_at", { ascending: true });

        if (!isMounted) return;

        if (photosError) {
          setError(photosError.message);
          setLoading(false);
          return;
        }

        const photosWithUrls: JobPhoto[] = [];

        for (const photo of photos ?? []) {
          const { data: signed, error: signedError } = await supabase.storage
            .from("job_photos")
            .createSignedUrl(photo.storage_path, 60 * 60);

          if (signedError) {
            photosWithUrls.push({
              id: photo.id,
              storage_path: photo.storage_path,
              signed_url: null,
            });
          } else {
            photosWithUrls.push({
              id: photo.id,
              storage_path: photo.storage_path,
              signed_url: signed.signedUrl,
            });
          }
        }

        setData({
          job: job as Job,
          photos: photosWithUrls,
        });
        setLoading(false);
      } catch (err) {
        if (!isMounted) return;
        console.error(err);
        setError("Unexpected error while loading job.");
        setLoading(false);
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [jobId]);

  return { data, loading, error };
}

