"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useJobPhotoUpload(jobId: string) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File): Promise<void> {
    setUploading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { data, error } = await supabase.functions.invoke("jobs-photos", {
        method: "POST",
        body: {
          job_id: jobId,
          content_type: file.type,
        },
      });

      if (error || (data && (data as any).error)) {
        const message =
          (data as any)?.error ??
          error?.message ??
          "Failed to request upload URL.";
        setError(message);
        setUploading(false);
        return;
      }

      const uploadUrl = (data as any).upload_url as string | undefined;
      if (!uploadUrl) {
        setError("Missing upload URL.");
        setUploading(false);
        return;
      }

      const response = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!response.ok) {
        setError("Upload failed.");
        setUploading(false);
        return;
      }

      setUploading(false);
    } catch (err) {
      console.error(err);
      setError("Unexpected error while uploading photo.");
      setUploading(false);
    }
  }

  return { upload, uploading, error };
}

