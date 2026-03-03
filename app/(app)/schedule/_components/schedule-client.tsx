"use client";

import { useMemo, useState } from "react";
import { useSchedule } from "@/hooks/use-schedule";

type ViewMode = "week" | "month";

function getCurrentWeekRange() {
  const now = new Date();
  const day = now.getUTCDay(); // 0 = Sunday
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - diffToMonday);
  monday.setUTCHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);

  return { from: monday.toISOString(), to: sunday.toISOString() };
}

function getCurrentMonthRange() {
  const now = new Date();
  const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  const last = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
  return { from: first.toISOString(), to: last.toISOString() };
}

export function ScheduleClient() {
  const [view, setView] = useState<ViewMode>("week");

  const initialRange = useMemo(
    () => (view === "week" ? getCurrentWeekRange() : getCurrentMonthRange()),
    [view],
  );

  const { events, loading, error } = useSchedule({
    from: initialRange.from,
    to: initialRange.to,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Schedule</h1>
        <div className="inline-flex rounded-md border border-white/20 text-xs overflow-hidden">
          <button
            type="button"
            onClick={() => setView("week")}
            className={`px-3 py-1 ${
              view === "week" ? "bg-white/20 text-white" : "text-white/70"
            }`}
          >
            Week
          </button>
          <button
            type="button"
            onClick={() => setView("month")}
            className={`px-3 py-1 ${
              view === "month" ? "bg-white/20 text-white" : "text-white/70"
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-sm text-white/70">Loading schedule...</div>
      )}

      {error && (
        <div className="text-sm text-red-400" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && !events.length && (
        <div className="text-sm text-white/70">
          No events scheduled in this range.
        </div>
      )}

      {!loading && !error && events.length > 0 && (
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="border border-white/10 rounded-lg p-3 bg-white/5"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-sm">{event.title}</span>
                <span className="text-xs uppercase text-white/60">
                  {event.type}
                </span>
              </div>
              <p className="text-xs text-white/70">
                {event.start_at} – {event.end_at}
              </p>
              {event.location && (
                <p className="text-xs text-white/70 mt-1">
                  Location: {event.location}
                </p>
              )}
              {event.notes && (
                <p className="text-xs text-white/70 mt-1">{event.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

