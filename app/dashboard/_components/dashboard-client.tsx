"use client";

import Link from "next/link";
import { useDashboard } from "@/hooks/use-dashboard";

export function DashboardClient() {
  const { data, loading, error } = useDashboard();

  if (loading) {
    return (
      <p className="text-sm text-white/70">Loading dashboard data...</p>
    );
  }

  if (error || !data) {
    return (
      <p className="text-sm text-red-400" role="alert">
        {error ?? "Unable to load dashboard."}
      </p>
    );
  }

  const { today_schedule, upcoming_jobs, new_prospects, finance_summary, marketing_reminders } =
    data;

  return (
    <div className="space-y-6">
      {/* Top finance summary cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="border border-white/10 rounded-lg p-3 bg-white/5">
          <p className="text-xs text-white/60">Revenue (this month)</p>
          <p className="mt-1 text-xl font-semibold">
            ${finance_summary.revenue.toFixed(2)}
          </p>
        </div>
        <div className="border border-white/10 rounded-lg p-3 bg-white/5">
          <p className="text-xs text-white/60">Expenses (this month)</p>
          <p className="mt-1 text-xl font-semibold">
            ${finance_summary.expenses.toFixed(2)}
          </p>
        </div>
        <div className="border border-white/10 rounded-lg p-3 bg-white/5">
          <p className="text-xs text-white/60">Net income (this month)</p>
          <p className="mt-1 text-xl font-semibold">
            ${finance_summary.net.toFixed(2)}
          </p>
        </div>
      </section>

      {/* Today’s schedule + upcoming jobs */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-white/10 rounded-lg p-3 bg-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Today’s schedule</h2>
            <Link
              href="/schedule"
              className="text-[11px] text-[#86BBD8] hover:underline"
            >
              View schedule
            </Link>
          </div>
          {today_schedule.events.length === 0 &&
            today_schedule.jobs.length === 0 && (
              <p className="text-sm text-white/70">No events scheduled today.</p>
          )}
          {today_schedule.events.length > 0 && (
            <ul className="text-sm text-white/80 space-y-1">
              {today_schedule.events.map((e: any) => (
                <li key={e.id}>
                  <span className="text-xs uppercase text-white/60 mr-1">
                    {e.type}
                  </span>
                  {e.title}
                </li>
              ))}
            </ul>
          )}
          {today_schedule.jobs.length > 0 && (
            <ul className="text-sm text-white/80 space-y-1">
              {today_schedule.jobs.map((j: any) => (
                <li key={j.id}>
                  <Link
                    href={`/jobs/${j.id}`}
                    className="text-[#86BBD8] hover:underline"
                  >
                    {j.customer_name}
                  </Link>{" "}
                  – {j.service_type}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="border border-white/10 rounded-lg p-3 bg-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Upcoming jobs</h2>
            <Link
              href="/jobs"
              className="text-[11px] text-[#86BBD8] hover:underline"
            >
              View jobs
            </Link>
          </div>
          {upcoming_jobs.length === 0 && (
            <p className="text-sm text-white/70">No upcoming jobs scheduled.</p>
          )}
          {upcoming_jobs.length > 0 && (
            <ul className="text-sm text-white/80 space-y-1">
              {upcoming_jobs.map((j: any) => (
                <li key={j.id}>
                  <Link
                    href={`/jobs/${j.id}`}
                    className="text-[#86BBD8] hover:underline"
                  >
                    {j.customer_name}
                  </Link>{" "}
                  – {j.service_type}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* New prospects + marketing reminders */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-white/10 rounded-lg p-3 bg-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">New prospects (7 days)</h2>
            <Link
              href="/customers"
              className="text-[11px] text-[#86BBD8] hover:underline"
            >
              View customers
            </Link>
          </div>
          {new_prospects.length === 0 && (
            <p className="text-sm text-white/70">
              No new prospects in the last 7 days.
            </p>
          )}
          {new_prospects.length > 0 && (
            <ul className="text-sm text-white/80 space-y-1">
              {new_prospects.map((c: any) => (
                <li key={c.id}>{c.name}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="border border-white/10 rounded-lg p-3 bg-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Marketing reminders</h2>
            <Link
              href="/marketing"
              className="text-[11px] text-[#86BBD8] hover:underline"
            >
              View marketing
            </Link>
          </div>
          {marketing_reminders.length === 0 && (
            <p className="text-sm text-white/70">
              Generate marketing content to see it here.
            </p>
          )}
          {marketing_reminders.length > 0 && (
            <ul className="text-sm text-white/80 space-y-1">
              {marketing_reminders.map((m: any) => (
                <li key={m.id}>
                  <span className="text-xs uppercase text-white/60 mr-1">
                    {m.channel}
                  </span>
                  {m.content.slice(0, 80)}
                  {m.content.length > 80 ? "…" : ""}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

