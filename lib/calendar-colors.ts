export const CALENDAR_COLOR_KEYS = [
  "sky",
  "emerald",
  "amber",
  "rose",
  "violet",
  "slate",
] as const;

export type CalendarColorKey = (typeof CALENDAR_COLOR_KEYS)[number];

export function isCalendarColorKey(value: string | null | undefined): value is CalendarColorKey {
  return value != null && (CALENDAR_COLOR_KEYS as readonly string[]).includes(value);
}

/** Month grid: compact pill */
export function calendarEventPillClassesMonth(
  colorKey: string | null | undefined,
  type: "event" | "task",
): string {
  if (isCalendarColorKey(colorKey)) {
    const byKey: Record<CalendarColorKey, string> = {
      sky: "bg-sky-500/15 text-foreground border border-sky-500/30 hover:bg-sky-500/25",
      emerald:
        "bg-emerald-500/15 text-foreground border border-emerald-500/30 hover:bg-emerald-500/25",
      amber:
        "bg-amber-500/15 text-foreground border border-amber-500/30 hover:bg-amber-500/25",
      rose: "bg-rose-500/15 text-foreground border border-rose-500/30 hover:bg-rose-500/25",
      violet:
        "bg-violet-500/15 text-foreground border border-violet-500/30 hover:bg-violet-500/25",
      slate:
        "bg-slate-500/15 text-foreground border border-slate-500/40 hover:bg-slate-500/25",
    };
    return byKey[colorKey];
  }
  if (type === "event") {
    return "bg-primary/15 text-foreground border border-primary/25 hover:bg-primary/25";
  }
  return "bg-violet-500/12 text-foreground border border-violet-500/25 hover:bg-violet-500/20";
}

/** Week grid: left accent bar */
export function calendarEventPillClassesWeek(
  colorKey: string | null | undefined,
  type: "event" | "task",
): string {
  if (isCalendarColorKey(colorKey)) {
    const byKey: Record<CalendarColorKey, string> = {
      sky: "bg-sky-500/15 text-foreground border-l-2 border-sky-500 hover:bg-sky-500/25",
      emerald:
        "bg-emerald-500/15 text-foreground border-l-2 border-emerald-500 hover:bg-emerald-500/25",
      amber:
        "bg-amber-500/15 text-foreground border-l-2 border-amber-500 hover:bg-amber-500/25",
      rose: "bg-rose-500/15 text-foreground border-l-2 border-rose-500 hover:bg-rose-500/25",
      violet:
        "bg-violet-500/15 text-foreground border-l-2 border-violet-500 hover:bg-violet-500/25",
      slate: "bg-slate-500/15 text-foreground border-l-2 border-slate-500 hover:bg-slate-500/25",
    };
    return byKey[colorKey];
  }
  if (type === "event") {
    return "bg-primary/15 text-foreground border-l-2 border-primary hover:bg-primary/25";
  }
  return "bg-violet-500/12 text-foreground border-l-2 border-violet-500 hover:bg-violet-500/20";
}
