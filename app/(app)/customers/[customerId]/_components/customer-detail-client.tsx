"use client";

import Link from "next/link";
import { AppPageHeader } from "@/components/layout/app-page-header";
import { useCustomerDetail } from "@/hooks/use-customer-detail";

type Props = {
  customerId: string;
};

export function CustomerDetailClient({ customerId }: Props) {
  const { data, loading, error } = useCustomerDetail(customerId);

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">Loading customer…</p>
    );
  }

  if (error || !data) {
    return (
      <div
        className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg p-4"
        role="alert"
      >
        {error ?? "Customer not found."}
      </div>
    );
  }

  const { customer, jobs, revenue_total } = data;

  return (
    <div className="space-y-8">
      <Link
        href="/customers"
        className="inline-flex text-sm font-medium text-primary hover:underline underline-offset-2"
      >
        ← Back to customers
      </Link>

      <AppPageHeader
        title={customer.name}
        description={
          <span className="inline-flex items-center gap-2 capitalize">
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {customer.type}
            </span>
          </span>
        }
        actions={
          <div className="text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Total revenue
            </p>
            <p className="text-xl font-semibold tabular-nums text-foreground">
              ${revenue_total.toFixed(2)}
            </p>
          </div>
        }
      />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="ergon-card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Contact</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            {customer.email && (
              <p>
                <span className="font-medium text-foreground">Email: </span>
                {customer.email}
              </p>
            )}
            {customer.phone && (
              <p>
                <span className="font-medium text-foreground">Phone: </span>
                {customer.phone}
              </p>
            )}
            {customer.address && (
              <p>
                <span className="font-medium text-foreground">Address: </span>
                {customer.address}
              </p>
            )}
            {!customer.email && !customer.phone && !customer.address && (
              <p>No contact details on file.</p>
            )}
          </div>
        </div>
        <div className="ergon-card p-5 space-y-2">
          <h2 className="text-sm font-semibold text-foreground">Notes</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {customer.notes ?? "No notes yet."}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Job history</h2>
        {jobs.length === 0 && (
          <p className="text-sm text-muted-foreground">No jobs for this customer.</p>
        )}
        {jobs.length > 0 && (
          <>
            <div className="hidden md:block ergon-card overflow-hidden p-0">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/50 text-left">
                  <tr>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Service
                    </th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Scheduled
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Price
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <Link
                          href={`/jobs/${job.id}`}
                          className="font-medium text-primary hover:underline underline-offset-2"
                        >
                          {job.service_type}
                        </Link>
                      </td>
                      <td className="px-4 py-3 capitalize text-muted-foreground">
                        {job.status}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {job.scheduled_start
                          ? new Date(job.scheduled_start).toLocaleString(
                              undefined,
                              {
                                dateStyle: "medium",
                                timeStyle: "short",
                              },
                            )
                          : "Not scheduled"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-foreground">
                        {job.price != null ? `$${job.price.toFixed(2)}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-3 md:hidden">
              {jobs.map((job) => (
                <div key={job.id} className="ergon-card p-4">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <Link
                      href={`/jobs/${job.id}`}
                      className="text-sm font-semibold text-primary hover:underline underline-offset-2"
                    >
                      {job.service_type}
                    </Link>
                    <span className="text-xs font-medium uppercase text-muted-foreground">
                      {job.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {job.scheduled_start
                      ? new Date(job.scheduled_start).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "Not scheduled"}
                  </p>
                  {job.price != null && (
                    <p className="mt-2 text-sm font-medium tabular-nums text-foreground">
                      ${job.price.toFixed(2)}
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
