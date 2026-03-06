"use client";

import { useMemo, useState } from "react";
import {
  FinanceEntryType,
  useFinanceEntries,
} from "@/hooks/use-finance-entries";

type RangePreset = "week" | "month" | "year";

function getRange(preset: RangePreset): { from: string; to: string } {
  const now = new Date();

  if (preset === "week") {
    const day = now.getUTCDay();
    const diffToMonday = (day + 6) % 7;
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() - diffToMonday);
    monday.setUTCHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    sunday.setUTCHours(23, 59, 59, 999);

    return {
      from: monday.toISOString().slice(0, 10),
      to: sunday.toISOString().slice(0, 10),
    };
  }

  if (preset === "month") {
    const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const last = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0),
    );
    return {
      from: first.toISOString().slice(0, 10),
      to: last.toISOString().slice(0, 10),
    };
  }

  const first = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const last = new Date(Date.UTC(now.getUTCFullYear(), 11, 31));
  return {
    from: first.toISOString().slice(0, 10),
    to: last.toISOString().slice(0, 10),
  };
}

export function FinanceClient() {
  const [preset, setPreset] = useState<RangePreset>("month");
  const [typeFilter, setTypeFilter] = useState<FinanceEntryType | undefined>(
    undefined,
  );

  const range = useMemo(() => getRange(preset), [preset]);

  const { entries, totals, loading, error } = useFinanceEntries({
    from: range.from,
    to: range.to,
    type: typeFilter,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h1 className="text-2xl font-bold">Finance</h1>
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="inline-flex rounded-md border border-white/20 overflow-hidden">
            {(["week", "month", "year"] as RangePreset[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setPreset(value)}
                className={`px-3 py-1 ${
                  preset === value
                    ? "bg-white/20 text-white"
                    : "text-white/70"
                }`}
              >
                {value[0].toUpperCase() + value.slice(1)}
              </button>
            ))}
          </div>
          <div className="inline-flex rounded-md border border-white/20 overflow-hidden">
            <button
              type="button"
              onClick={() => setTypeFilter(undefined)}
              className={`px-3 py-1 ${
                !typeFilter ? "bg-white/20 text-white" : "text-white/70"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("revenue")}
              className={`px-3 py-1 ${
                typeFilter === "revenue"
                  ? "bg-white/20 text-white"
                  : "text-white/70"
              }`}
            >
              Revenue
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("expense")}
              className={`px-3 py-1 ${
                typeFilter === "expense"
                  ? "bg-white/20 text-white"
                  : "text-white/70"
              }`}
            >
              Expenses
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="border border-white/10 rounded-lg p-3 bg-white/5">
          <p className="text-xs text-white/60">Revenue</p>
          <p className="mt-1 text-xl font-semibold">
            ${totals.revenue.toFixed(2)}
          </p>
        </div>
        <div className="border border-white/10 rounded-lg p-3 bg-white/5">
          <p className="text-xs text-white/60">Expenses</p>
          <p className="mt-1 text-xl font-semibold">
            ${totals.expenses.toFixed(2)}
          </p>
        </div>
        <div className="border border-white/10 rounded-lg p-3 bg-white/5">
          <p className="text-xs text-white/60">Net Income</p>
          <p className="mt-1 text-xl font-semibold">
            ${totals.net.toFixed(2)}
          </p>
        </div>
      </div>

      {loading && (
        <div className="text-sm text-white/70">Loading finance entries...</div>
      )}

      {error && (
        <div className="text-sm text-red-400" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && !entries.length && (
        <div className="text-sm text-white/70">
          No finance entries for this period.
        </div>
      )}

      {!loading && !error && entries.length > 0 && (
        <>
          <div className="hidden md:block">
            <table className="w-full text-sm border border-white/10 rounded-lg overflow-hidden">
              <thead className="bg-white/5 text-left">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-t border-white/10">
                    <td className="px-3 py-2 text-xs text-white/70">
                      {e.entry_date}
                    </td>
                    <td className="px-3 py-2 capitalize">{e.type}</td>
                    <td className="px-3 py-2">{e.title}</td>
                    <td className="px-3 py-2">{e.category}</td>
                    <td className="px-3 py-2 text-right">
                      ${e.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-3 md:hidden">
            {entries.map((e) => (
              <div
                key={e.id}
                className="border border-white/10 rounded-lg p-3 bg-white/5"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-sm">{e.title}</span>
                  <span className="text-xs uppercase text-white/60">
                    {e.type}
                  </span>
                </div>
                <p className="text-xs text-white/70">
                  {e.entry_date} • ${e.amount.toFixed(2)}
                </p>
                {e.category && (
                  <p className="text-xs text-white/70 mt-1">
                    Category: {e.category}
                  </p>
                )}
                {e.notes && (
                  <p className="text-xs text-white/70 mt-1">{e.notes}</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

