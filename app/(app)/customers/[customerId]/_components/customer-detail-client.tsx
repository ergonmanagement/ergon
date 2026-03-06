"use client";

import Link from "next/link";
import { useCustomerDetail } from "@/hooks/use-customer-detail";

type Props = {
  customerId: string;
};

export function CustomerDetailClient({ customerId }: Props) {
  const { data, loading, error } = useCustomerDetail(customerId);

  if (loading) {
    return <div className="text-sm text-white/70">Loading customer...</div>;
  }

  if (error || !data) {
    return (
      <div className="text-sm text-red-400" role="alert">
        {error ?? "Customer not found."}
      </div>
    );
  }

  const { customer, jobs, revenue_total } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{customer.name}</h1>
          <p className="text-xs text-white/60 capitalize">{customer.type}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/60">Total Revenue</p>
          <p className="text-xl font-semibold">
            ${revenue_total.toFixed(2)}
          </p>
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-white/10 rounded-lg p-3 bg-white/5 space-y-2">
          <h2 className="text-sm font-semibold">Contact</h2>
          {customer.email && (
            <p className="text-sm text-white/80">Email: {customer.email}</p>
          )}
          {customer.phone && (
            <p className="text-sm text-white/80">Phone: {customer.phone}</p>
          )}
          {customer.address && (
            <p className="text-sm text-white/80">
              Address: {customer.address}
            </p>
          )}
        </div>
        <div className="border border-white/10 rounded-lg p-3 bg-white/5 space-y-2">
          <h2 className="text-sm font-semibold">Notes</h2>
          <p className="text-sm text-white/80">
            {customer.notes ?? "No notes yet."}
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Job history</h2>
        {jobs.length === 0 && (
          <p className="text-sm text-white/70">No jobs for this customer.</p>
        )}
        {jobs.length > 0 && (
          <>
            <div className="hidden md:block">
              <table className="w-full text-sm border border-white/10 rounded-lg overflow-hidden">
                <thead className="bg-white/5 text-left">
                  <tr>
                    <th className="px-3 py-2">Service</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Scheduled</th>
                    <th className="px-3 py-2 text-right">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id} className="border-t border-white/10">
                      <td className="px-3 py-2">
                        <Link
                          href={`/jobs/${job.id}`}
                          className="text-[#86BBD8] hover:underline"
                        >
                          {job.service_type}
                        </Link>
                      </td>
                      <td className="px-3 py-2 capitalize">{job.status}</td>
                      <td className="px-3 py-2 text-xs text-white/70">
                        {job.scheduled_start ?? "Not scheduled"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {job.price != null ? `$${job.price.toFixed(2)}` : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-3 md:hidden">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="border border-white/10 rounded-lg p-3 bg-white/5"
                >
                  <div className="flex justify-between items-center mb-1">
                    <Link
                      href={`/jobs/${job.id}`}
                      className="font-semibold text-sm text-[#86BBD8] hover:underline"
                    >
                      {job.service_type}
                    </Link>
                    <span className="text-xs uppercase text-white/60">
                      {job.status}
                    </span>
                  </div>
                  <p className="text-xs text-white/70">
                    {job.scheduled_start ?? "Not scheduled"}
                  </p>
                  {job.price != null && (
                    <p className="text-xs text-white/70 mt-1">
                      Price: ${job.price.toFixed(2)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

