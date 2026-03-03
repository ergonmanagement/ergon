"use client";

import { useJobs } from "@/hooks/use-jobs";

export function JobsClient() {
  const { jobs, loading, error } = useJobs();

  if (loading) {
    return <div className="text-sm text-white/70">Loading jobs...</div>;
  }

  if (error) {
    return (
      <div className="text-sm text-red-400" role="alert">
        {error}
      </div>
    );
  }

  if (!jobs.length) {
    return (
      <div className="text-sm text-white/70">
        No jobs yet. Create your first job from the schedule or jobs module.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Jobs</h1>
      <div className="hidden md:block">
        <table className="w-full text-sm border border-white/10 rounded-lg overflow-hidden">
          <thead className="bg-white/5 text-left">
            <tr>
              <th className="px-3 py-2">Customer</th>
              <th className="px-3 py-2">Service</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Scheduled</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.id} className="border-t border-white/10">
                <td className="px-3 py-2">{j.customer_name}</td>
                <td className="px-3 py-2">{j.service_type}</td>
                <td className="px-3 py-2 capitalize">{j.status}</td>
                <td className="px-3 py-2 text-xs text-white/70">
                  {j.scheduled_start ?? "Not scheduled"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-3 md:hidden">
        {jobs.map((j) => (
          <div
            key={j.id}
            className="border border-white/10 rounded-lg p-3 bg-white/5"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold">{j.customer_name}</span>
              <span className="text-xs uppercase text-white/60">
                {j.status}
              </span>
            </div>
            <p className="text-xs text-white/70">
              {j.service_type} •{" "}
              {j.scheduled_start ? j.scheduled_start : "Not scheduled"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

