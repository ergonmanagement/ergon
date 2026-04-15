"use client";

import { useEffect, useMemo, useState } from "react";
import { AppPageHeader } from "@/components/layout/app-page-header";
import { useSchedule } from "@/hooks/use-schedule";
import { useJobs } from "@/hooks/use-jobs";
import { useCustomers, type Customer } from "@/hooks/use-customers";
import {
  CALENDAR_COLOR_KEYS,
  calendarEventPillClassesMonth,
  calendarEventPillClassesWeek,
} from "@/lib/calendar-colors";
import { isoToDateTimeLocalValue } from "@/lib/datetime-local";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, ChevronDown } from "lucide-react";

type ViewMode = "week" | "month";

const CUSTOMER_NONE = "__none__";
const COLOR_DEFAULT = "__default__";

/** Scrollable, top-anchored on small viewports so the close control stays reachable. */
const SCHEDULE_DIALOG_CONTENT_CLASS =
  "max-h-[85vh] overflow-y-auto top-[6vh] translate-y-0 sm:top-[50%] sm:translate-y-[-50%] w-[calc(100vw-2rem)] sm:w-full";


// Generate calendar grid for the month
function generateCalendarDays(year: number, month: number) {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
  const daysInMonth = lastDayOfMonth.getDate();

  const days = [];

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push({ date: null, isCurrentMonth: false });
  }

  // Add all days of the current month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push({ date: new Date(year, month, day), isCurrentMonth: true });
  }

  // Add empty cells to complete the last week
  const remainingCells = 42 - days.length; // 6 rows × 7 days = 42 cells
  for (let i = 0; i < remainingCells; i++) {
    days.push({ date: null, isCurrentMonth: false });
  }

  return days;
}

// Helper to get events for a specific date
function getEventsForDate(events: any[], targetDate: Date) {
  return events.filter(event => {
    const eventDate = new Date(event.start_at);
    return eventDate.toDateString() === targetDate.toDateString();
  });
}

type DateTimeFieldProps = {
  id: string;
  label: string;
  value: string;
  onApply: (next: string) => void;
  required?: boolean;
};

function DateTimeField({ id, label, value, onApply, required }: DateTimeFieldProps) {
  const [draft, setDraft] = useState(() => isoToDateTimeLocalValue(value));

  useEffect(() => {
    setDraft(isoToDateTimeLocalValue(value));
  }, [value]);

  function applyDraft() {
    const baseline = isoToDateTimeLocalValue(value);
    if (draft !== baseline) onApply(draft);
  }

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="mt-1 flex items-center gap-2">
        <Input
          id={id}
          type="datetime-local"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={applyDraft}
          required={required}
        />
        <Button type="button" variant="outline" onClick={applyDraft}>
          Apply
        </Button>
      </div>
    </div>
  );
}

function CustomerLinkSelect({
  id,
  label,
  value,
  onChange,
  customers,
  disabled,
}: {
  id: string;
  label: string;
  value: string | null;
  onChange: (customerId: string | null) => void;
  customers: Customer[];
  disabled?: boolean;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value ?? CUSTOMER_NONE}
        onValueChange={(v) => onChange(v === CUSTOMER_NONE ? null : v)}
        disabled={disabled}
      >
        <SelectTrigger id={id} className="mt-1">
          <SelectValue placeholder="No linked customer" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={CUSTOMER_NONE}>No linked customer</SelectItem>
          {customers.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
              {c.company_name ? ` · ${c.company_name}` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ColorPresetSelect({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value || COLOR_DEFAULT}
        onValueChange={(v) => onChange(v === COLOR_DEFAULT ? "" : v)}
      >
        <SelectTrigger id={id} className="mt-1">
          <SelectValue placeholder="Default (by type)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={COLOR_DEFAULT}>Default (by type)</SelectItem>
          {CALENDAR_COLOR_KEYS.map((k) => (
            <SelectItem key={k} value={k}>
              {k.slice(0, 1).toUpperCase() + k.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function ScheduleClient() {
  const [view, setView] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCreateDropdown, setShowCreateDropdown] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showJobDialog, setShowJobDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  // Form state for different types
  const [eventFormData, setEventFormData] = useState({
    title: "",
    start_at: "",
    end_at: "",
    location: "",
    notes: "",
    category: "",
    color_key: "",
    customer_id: null as string | null,
  });

  const [taskFormData, setTaskFormData] = useState({
    title: "",
    start_at: "",
    end_at: "",
    notes: "",
    category: "",
    color_key: "",
    customer_id: null as string | null,
  });

  const [jobFormData, setJobFormData] = useState({
    customer_id: null as string | null,
    customer_name: "",
    company_name: "",
    service_type: "",
    scheduled_start: "",
    scheduled_end: "",
    address: "",
    price: "",
    notes: "",
  });

  // Calculate date range based on current view and date
  const dateRange = useMemo(() => {
    if (view === "week") {
      // Get the week that contains the current date
      const now = currentDate;
      const day = now.getDay(); // 0 = Sunday
      const diffToSunday = day; // Days from Sunday
      const sunday = new Date(now);
      sunday.setDate(now.getDate() - diffToSunday);
      sunday.setHours(0, 0, 0, 0);

      const saturday = new Date(sunday);
      saturday.setDate(sunday.getDate() + 6);
      saturday.setHours(23, 59, 59, 999);

      return { from: sunday.toISOString(), to: saturday.toISOString() };
    } else {
      // Month view
      const first = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1, 0, 0, 0, 0);
      const last = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);
      return { from: first.toISOString(), to: last.toISOString() };
    }
  }, [view, currentDate]);

  const { events, loading, error, upsertEvent } = useSchedule({
    from: dateRange.from,
    to: dateRange.to,
  });

  const { upsertJob } = useJobs({});

  const { customers } = useCustomers({ page: 1, pageSize: 300 });

  // Form handlers
  const resetEventForm = () => {
    setEventFormData({
      title: "",
      start_at: "",
      end_at: "",
      location: "",
      notes: "",
      category: "",
      color_key: "",
      customer_id: null,
    });
  };

  const resetTaskForm = () => {
    setTaskFormData({
      title: "",
      start_at: "",
      end_at: "",
      notes: "",
      category: "",
      color_key: "",
      customer_id: null,
    });
  };

  const resetJobForm = () => {
    setJobFormData({
      customer_id: null,
      customer_name: "",
      company_name: "",
      service_type: "",
      scheduled_start: "",
      scheduled_end: "",
      address: "",
      price: "",
      notes: "",
    });
  };

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await upsertEvent({
        type: "event",
        title: eventFormData.title,
        start_at: eventFormData.start_at,
        end_at: eventFormData.end_at,
        location: eventFormData.location || null,
        notes: eventFormData.notes || null,
        category: eventFormData.category.trim() || null,
        color_key: eventFormData.color_key || null,
        customer_id: eventFormData.customer_id,
      });
      setShowEventDialog(false);
      resetEventForm();
    } catch (err) {
      console.error("Error creating event:", err);
    }
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await upsertEvent({
        type: "task",
        title: taskFormData.title,
        start_at: taskFormData.start_at,
        end_at: taskFormData.end_at,
        location: null,
        notes: taskFormData.notes || null,
        category: taskFormData.category.trim() || null,
        color_key: taskFormData.color_key || null,
        customer_id: taskFormData.customer_id,
      });
      setShowTaskDialog(false);
      resetTaskForm();
    } catch (err) {
      console.error("Error creating task:", err);
    }
  };

  const handleJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await upsertJob({
        customer_name: jobFormData.customer_name,
        company_name: jobFormData.company_name,
        service_type: jobFormData.service_type,
        status: "scheduled",
        scheduled_start: jobFormData.scheduled_start,
        scheduled_end: jobFormData.scheduled_end,
        address: jobFormData.address,
        price: jobFormData.price ? parseFloat(jobFormData.price) : null,
        notes: jobFormData.notes,
        customer_id: jobFormData.customer_id,
        source: "schedule",
      });
      setShowJobDialog(false);
      resetJobForm();
    } catch (err) {
      console.error("Error creating job:", err);
    }
  };

  const handleOpenEdit = (event: any) => {
    setSelectedEvent(event);
    setShowEditDialog(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    try {
      await upsertEvent({
        id: selectedEvent.id,
        type: selectedEvent.type,
        title: selectedEvent.title,
        start_at: selectedEvent.start_at,
        end_at: selectedEvent.end_at,
        location: selectedEvent.location ?? null,
        notes: selectedEvent.notes ?? null,
        category: selectedEvent.category ?? null,
        color_key: selectedEvent.color_key ?? null,
        customer_id: selectedEvent.customer_id ?? null,
      });
      setShowEditDialog(false);
      setSelectedEvent(null);
    } catch (err) {
      console.error("Error updating schedule item:", err);
    }
  };

  const calendarDays = useMemo(() => {
    if (view === "month") {
      return generateCalendarDays(currentDate.getFullYear(), currentDate.getMonth());
    }
    return [];
  }, [view, currentDate]);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const today = new Date();

  return (
    <div className="space-y-6">
      <AppPageHeader
        title="Schedule"
        toolbar={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const newDate = new Date(currentDate);
                if (view === "month") {
                  newDate.setMonth(newDate.getMonth() - 1);
                } else {
                  newDate.setDate(newDate.getDate() - 7);
                }
                setCurrentDate(newDate);
              }}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
              aria-label="Previous period"
            >
              ←
            </button>
            <p className="text-base font-medium text-foreground tabular-nums min-w-[10rem] text-center sm:min-w-[14rem]">
              {view === "month"
                ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                : `Week of ${currentDate.toLocaleDateString()}`}
            </p>
            <button
              type="button"
              onClick={() => {
                const newDate = new Date(currentDate);
                if (view === "month") {
                  newDate.setMonth(newDate.getMonth() + 1);
                } else {
                  newDate.setDate(newDate.getDate() + 7);
                }
                setCurrentDate(newDate);
              }}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
              aria-label="Next period"
            >
              →
            </button>
          </div>
        }
        actions={
          <>
            <div className="relative">
              <Button
                onClick={() => setShowCreateDropdown(!showCreateDropdown)}
                className="flex items-center gap-2"
              >
                <Plus size={16} />
                Add new
                <ChevronDown size={14} />
              </Button>

              {showCreateDropdown && (
                <div className="absolute right-0 mt-2 w-52 rounded-lg border border-border bg-card py-1 shadow-md z-50">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEventDialog(true);
                      setShowCreateDropdown(false);
                      resetEventForm();
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-muted/50"
                  >
                    📅 Event
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTaskDialog(true);
                      setShowCreateDropdown(false);
                      resetTaskForm();
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-muted/50"
                  >
                    ✓ Task
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowJobDialog(true);
                      setShowCreateDropdown(false);
                      resetJobForm();
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-muted/50"
                  >
                    🔧 Job
                  </button>
                </div>
              )}
            </div>

            <div className="inline-flex overflow-hidden rounded-md border border-border bg-card text-xs shadow-sm">
              <button
                type="button"
                onClick={() => setView("week")}
                className={`px-3 py-2 font-medium transition-colors ${view === "week" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/50"}`}
              >
                Week
              </button>
              <button
                type="button"
                onClick={() => setView("month")}
                className={`px-3 py-2 font-medium transition-colors ${view === "month" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/50"}`}
              >
                Month
              </button>
            </div>
          </>
        }
      />

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground text-sm">Loading schedule…</div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div
          className="text-sm text-destructive bg-destructive/5 p-3 rounded-lg border border-destructive/20"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Calendar Views */}
      {!loading && !error && (
        <>
          {view === "month" ? (
            /* Calendar Grid View */
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              {/* Days of the week header */}
              <div className="grid grid-cols-7 border-b border-border">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="bg-muted/50 px-3 py-2 text-center text-sm font-medium text-foreground">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7">
                {calendarDays.map((day, index) => {
                  const isToday = day.date?.toDateString() === today.toDateString();
                  const dayEvents = day.date ? getEventsForDate(events, day.date) : [];

                  return (
                    <div
                      key={index}
                      className={`min-h-[120px] border-r border-b border-border p-2 ${!day.isCurrentMonth ? "bg-muted/50" : "bg-card"
                        } ${isToday ? "bg-primary/10" : ""}`}
                    >
                      {day.date && (
                        <>
                          <div className={`text-sm mb-1 ${isToday
                            ? "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center font-bold"
                            : "text-foreground"
                            }`}>
                            {day.date.getDate()}
                          </div>
                          <div className="space-y-1">
                            {dayEvents.slice(0, 3).map((event, eventIndex) => (
                              <button
                                type="button"
                                key={event.id ?? eventIndex}
                                onClick={() => handleOpenEdit(event)}
                                className={cn(
                                  "block w-full text-left text-xs px-2 py-1 rounded truncate",
                                  calendarEventPillClassesMonth(event.color_key, event.type),
                                )}
                                title={
                                  [event.category, event.title].filter(Boolean).join(" · ") ||
                                  event.title
                                }
                              >
                                {event.title}
                              </button>
                            ))}
                            {dayEvents.length > 3 && (
                              <div className="text-xs text-muted-foreground">
                                +{dayEvents.length - 3} more
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Week Grid View */
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              {/* Days of the week header */}
              <div className="grid grid-cols-7 border-b border-border">
                {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => (
                  <div key={day} className="bg-muted/50 px-3 py-2 text-center text-sm font-medium text-foreground">
                    {day}
                  </div>
                ))}
              </div>

              {/* Week grid */}
              <div className="grid grid-cols-7">
                {(() => {
                  const weekStart = new Date(currentDate);
                  const day = weekStart.getDay(); // 0 = Sunday
                  weekStart.setDate(weekStart.getDate() - day);

                  const weekDays = [];
                  for (let i = 0; i < 7; i++) {
                    const date = new Date(weekStart);
                    date.setDate(weekStart.getDate() + i);
                    weekDays.push(date);
                  }

                  return weekDays.map((date, index) => {
                    const isToday = date.toDateString() === today.toDateString();
                    const dayEvents = getEventsForDate(events, date);

                    return (
                      <div
                        key={index}
                        className={`min-h-[200px] border-r border-b border-border p-3 ${isToday ? "bg-primary/10" : "bg-card"
                          }`}
                      >
                        <div className={`text-lg mb-3 font-medium ${isToday
                          ? "bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center"
                          : "text-foreground"
                          }`}>
                          {date.getDate()}
                        </div>
                        <div className="space-y-2">
                          {dayEvents.map((event, eventIndex) => (
                            <button
                              type="button"
                              key={event.id ?? eventIndex}
                              onClick={() => handleOpenEdit(event)}
                              className={cn(
                                "block w-full text-left text-xs px-2 py-2 rounded hover:opacity-95",
                                calendarEventPillClassesWeek(event.color_key, event.type),
                              )}
                              title={`${event.title} - ${new Date(event.start_at).toLocaleTimeString()}`}
                            >
                              <div className="font-medium truncate">{event.title}</div>
                              <div className="text-primary mt-1">
                                {new Date(event.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {events.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No events scheduled this week.
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Create Event Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className={cn("max-w-md", SCHEDULE_DIALOG_CONTENT_CLASS)}>
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
            <DialogDescription>
              Add a new event to your schedule.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEventSubmit} className="space-y-4">
            <div>
              <Label htmlFor="event-title">Title *</Label>
              <Input
                id="event-title"
                value={eventFormData.title}
                onChange={(e) => setEventFormData({ ...eventFormData, title: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="event-category">Category</Label>
              <Input
                id="event-category"
                value={eventFormData.category}
                onChange={(e) =>
                  setEventFormData({ ...eventFormData, category: e.target.value })
                }
                placeholder="e.g. Sales, Personal"
              />
            </div>
            <ColorPresetSelect
              id="event-color"
              label="Calendar color"
              value={eventFormData.color_key}
              onChange={(next) => setEventFormData({ ...eventFormData, color_key: next })}
            />
            <CustomerLinkSelect
              id="event-customer"
              label="Link customer (optional)"
              value={eventFormData.customer_id}
              onChange={(customerId) =>
                setEventFormData({ ...eventFormData, customer_id: customerId })
              }
              customers={customers}
            />
            <div>
              <DateTimeField
                id="event-start"
                label="Start Date & Time *"
                value={eventFormData.start_at}
                onApply={(next) => setEventFormData({ ...eventFormData, start_at: next })}
                required
              />
            </div>
            <div>
              <DateTimeField
                id="event-end"
                label="End Date & Time *"
                value={eventFormData.end_at}
                onApply={(next) => setEventFormData({ ...eventFormData, end_at: next })}
                required
              />
            </div>
            <div>
              <Label htmlFor="event-location">Location</Label>
              <Input
                id="event-location"
                value={eventFormData.location}
                onChange={(e) => setEventFormData({ ...eventFormData, location: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="event-notes">Notes</Label>
              <Textarea
                id="event-notes"
                value={eventFormData.notes}
                onChange={(e) => setEventFormData({ ...eventFormData, notes: e.target.value })}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">Create Event</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEventDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Task Dialog */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className={cn("max-w-md", SCHEDULE_DIALOG_CONTENT_CLASS)}>
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Add a new task to your schedule.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTaskSubmit} className="space-y-4">
            <div>
              <Label htmlFor="task-title">Title *</Label>
              <Input
                id="task-title"
                value={taskFormData.title}
                onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="task-category">Category</Label>
              <Input
                id="task-category"
                value={taskFormData.category}
                onChange={(e) =>
                  setTaskFormData({ ...taskFormData, category: e.target.value })
                }
                placeholder="e.g. Admin, Follow-up"
              />
            </div>
            <ColorPresetSelect
              id="task-color"
              label="Calendar color"
              value={taskFormData.color_key}
              onChange={(next) => setTaskFormData({ ...taskFormData, color_key: next })}
            />
            <CustomerLinkSelect
              id="task-customer"
              label="Link customer (optional)"
              value={taskFormData.customer_id}
              onChange={(customerId) =>
                setTaskFormData({ ...taskFormData, customer_id: customerId })
              }
              customers={customers}
            />
            <div>
              <DateTimeField
                id="task-start"
                label="Start Date & Time *"
                value={taskFormData.start_at}
                onApply={(next) => setTaskFormData({ ...taskFormData, start_at: next })}
                required
              />
            </div>
            <div>
              <DateTimeField
                id="task-end"
                label="End Date & Time *"
                value={taskFormData.end_at}
                onApply={(next) => setTaskFormData({ ...taskFormData, end_at: next })}
                required
              />
            </div>
            <div>
              <Label htmlFor="task-notes">Notes</Label>
              <Textarea
                id="task-notes"
                value={taskFormData.notes}
                onChange={(e) => setTaskFormData({ ...taskFormData, notes: e.target.value })}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">Create Task</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowTaskDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Job Dialog */}
      <Dialog open={showJobDialog} onOpenChange={setShowJobDialog}>
        <DialogContent className={cn("max-w-md", SCHEDULE_DIALOG_CONTENT_CLASS)}>
          <DialogHeader>
            <DialogTitle>Create New Job</DialogTitle>
            <DialogDescription>
              Schedule a new service job.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleJobSubmit} className="space-y-4">
            <CustomerLinkSelect
              id="job-customer-link"
              label="Link existing customer (optional)"
              value={jobFormData.customer_id}
              onChange={(customerId) => {
                if (!customerId) {
                  setJobFormData((p) => ({ ...p, customer_id: null }));
                  return;
                }
                const c = customers.find((x) => x.id === customerId);
                if (!c) return;
                setJobFormData((p) => ({
                  ...p,
                  customer_id: customerId,
                  customer_name: c.name,
                  company_name: c.company_name ?? "",
                }));
              }}
              customers={customers}
            />
            <div>
              <Label htmlFor="job-customer">Customer Name *</Label>
              <Input
                id="job-customer"
                value={jobFormData.customer_name}
                onChange={(e) =>
                  setJobFormData({
                    ...jobFormData,
                    customer_name: e.target.value,
                    customer_id: null,
                  })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="job-company">Company Name</Label>
              <Input
                id="job-company"
                value={jobFormData.company_name}
                onChange={(e) => setJobFormData({ ...jobFormData, company_name: e.target.value })}
                placeholder="Enter company name"
              />
            </div>
            <div>
              <Label htmlFor="job-service">Service Type *</Label>
              <Input
                id="job-service"
                value={jobFormData.service_type}
                onChange={(e) => setJobFormData({ ...jobFormData, service_type: e.target.value })}
                required
              />
            </div>
            <div>
              <DateTimeField
                id="job-start"
                label="Start Date & Time *"
                value={jobFormData.scheduled_start}
                onApply={(next) => setJobFormData({ ...jobFormData, scheduled_start: next })}
                required
              />
            </div>
            <div>
              <DateTimeField
                id="job-end"
                label="End Date & Time *"
                value={jobFormData.scheduled_end}
                onApply={(next) => setJobFormData({ ...jobFormData, scheduled_end: next })}
                required
              />
            </div>
            <div>
              <Label htmlFor="job-address">Address</Label>
              <Input
                id="job-address"
                value={jobFormData.address}
                onChange={(e) => setJobFormData({ ...jobFormData, address: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="job-price">Price ($)</Label>
              <Input
                id="job-price"
                type="number"
                step="0.01"
                value={jobFormData.price}
                onChange={(e) => setJobFormData({ ...jobFormData, price: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="job-notes">Notes</Label>
              <Textarea
                id="job-notes"
                value={jobFormData.notes}
                onChange={(e) => setJobFormData({ ...jobFormData, notes: e.target.value })}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">Create Job</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowJobDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Existing Calendar Item Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className={cn("max-w-md", SCHEDULE_DIALOG_CONTENT_CLASS)}>
          <DialogHeader>
            <DialogTitle>Edit schedule item</DialogTitle>
            <DialogDescription>
              Update title, time, and details to edit or move this item.
            </DialogDescription>
          </DialogHeader>
          {selectedEvent ? (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <Label htmlFor="edit-event-title">Title *</Label>
                <Input
                  id="edit-event-title"
                  value={selectedEvent.title}
                  onChange={(e) =>
                    setSelectedEvent({ ...selectedEvent, title: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-event-category">Category</Label>
                <Input
                  id="edit-event-category"
                  value={selectedEvent.category ?? ""}
                  onChange={(e) =>
                    setSelectedEvent({
                      ...selectedEvent,
                      category: e.target.value.trim() ? e.target.value : null,
                    })
                  }
                  placeholder="e.g. Sales, Personal"
                />
              </div>
              <ColorPresetSelect
                id="edit-event-color"
                label="Calendar color"
                value={selectedEvent.color_key ?? ""}
                onChange={(next) =>
                  setSelectedEvent({
                    ...selectedEvent,
                    color_key: next ? next : null,
                  })
                }
              />
              <CustomerLinkSelect
                id="edit-event-customer"
                label="Link customer (optional)"
                value={selectedEvent.customer_id ?? null}
                onChange={(customerId) =>
                  setSelectedEvent({ ...selectedEvent, customer_id: customerId })
                }
                customers={customers}
              />
              <DateTimeField
                id="edit-event-start"
                label="Start Date & Time *"
                value={selectedEvent.start_at}
                onApply={(next) =>
                  setSelectedEvent({ ...selectedEvent, start_at: next })
                }
                required
              />
              <DateTimeField
                id="edit-event-end"
                label="End Date & Time *"
                value={selectedEvent.end_at}
                onApply={(next) =>
                  setSelectedEvent({ ...selectedEvent, end_at: next })
                }
                required
              />
              {selectedEvent.type === "event" ? (
                <div>
                  <Label htmlFor="edit-event-location">Location</Label>
                  <Input
                    id="edit-event-location"
                    value={selectedEvent.location ?? ""}
                    onChange={(e) =>
                      setSelectedEvent({
                        ...selectedEvent,
                        location: e.target.value || null,
                      })
                    }
                  />
                </div>
              ) : null}
              <div>
                <Label htmlFor="edit-event-notes">Notes</Label>
                <Textarea
                  id="edit-event-notes"
                  value={selectedEvent.notes ?? ""}
                  onChange={(e) =>
                    setSelectedEvent({
                      ...selectedEvent,
                      notes: e.target.value || null,
                    })
                  }
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  Save changes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditDialog(false);
                    setSelectedEvent(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
