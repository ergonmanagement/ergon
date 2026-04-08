"use client";

import { useMemo, useState } from "react";
import { AppPageHeader } from "@/components/layout/app-page-header";
import { useSchedule } from "@/hooks/use-schedule";
import { useJobs } from "@/hooks/use-jobs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, ChevronDown } from "lucide-react";

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

export function ScheduleClient() {
  const [view, setView] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCreateDropdown, setShowCreateDropdown] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showJobDialog, setShowJobDialog] = useState(false);

  // Form state for different types
  const [eventFormData, setEventFormData] = useState({
    title: "",
    start_at: "",
    end_at: "",
    location: "",
    notes: ""
  });

  const [taskFormData, setTaskFormData] = useState({
    title: "",
    start_at: "",
    end_at: "",
    notes: ""
  });

  const [jobFormData, setJobFormData] = useState({
    customer_name: "",
    company_name: "",
    service_type: "",
    scheduled_start: "",
    scheduled_end: "",
    address: "",
    price: "",
    notes: ""
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

  // Form handlers
  const resetEventForm = () => {
    setEventFormData({
      title: "",
      start_at: "",
      end_at: "",
      location: "",
      notes: ""
    });
  };

  const resetTaskForm = () => {
    setTaskFormData({
      title: "",
      start_at: "",
      end_at: "",
      notes: ""
    });
  };

  const resetJobForm = () => {
    setJobFormData({
      customer_name: "",
      company_name: "",
      service_type: "",
      scheduled_start: "",
      scheduled_end: "",
      address: "",
      price: "",
      notes: ""
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
        location: eventFormData.location,
        notes: eventFormData.notes,
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
        notes: taskFormData.notes,
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
        customer_id: null,
        source: "schedule"
      });
      setShowJobDialog(false);
      resetJobForm();
    } catch (err) {
      console.error("Error creating job:", err);
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
                              <div
                                key={eventIndex}
                                className="text-xs bg-primary/15 text-foreground px-2 py-1 rounded truncate"
                                title={event.title}
                              >
                                {event.title}
                              </div>
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
                            <div
                              key={eventIndex}
                              className="text-xs bg-primary/15 text-foreground px-2 py-2 rounded border-l-2 border-primary"
                              title={`${event.title} - ${new Date(event.start_at).toLocaleTimeString()}`}
                            >
                              <div className="font-medium truncate">{event.title}</div>
                              <div className="text-primary mt-1">
                                {new Date(event.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
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
        <DialogContent className="max-w-md">
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
              <Label htmlFor="event-start">Start Date & Time *</Label>
              <Input
                id="event-start"
                type="datetime-local"
                value={eventFormData.start_at}
                onChange={(e) => setEventFormData({ ...eventFormData, start_at: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="event-end">End Date & Time *</Label>
              <Input
                id="event-end"
                type="datetime-local"
                value={eventFormData.end_at}
                onChange={(e) => setEventFormData({ ...eventFormData, end_at: e.target.value })}
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
        <DialogContent className="max-w-md">
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
              <Label htmlFor="task-start">Start Date & Time *</Label>
              <Input
                id="task-start"
                type="datetime-local"
                value={taskFormData.start_at}
                onChange={(e) => setTaskFormData({ ...taskFormData, start_at: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="task-end">End Date & Time *</Label>
              <Input
                id="task-end"
                type="datetime-local"
                value={taskFormData.end_at}
                onChange={(e) => setTaskFormData({ ...taskFormData, end_at: e.target.value })}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Job</DialogTitle>
            <DialogDescription>
              Schedule a new service job.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleJobSubmit} className="space-y-4">
            <div>
              <Label htmlFor="job-customer">Customer Name *</Label>
              <Input
                id="job-customer"
                value={jobFormData.customer_name}
                onChange={(e) => setJobFormData({ ...jobFormData, customer_name: e.target.value })}
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
              <Label htmlFor="job-start">Start Date & Time *</Label>
              <Input
                id="job-start"
                type="datetime-local"
                value={jobFormData.scheduled_start}
                onChange={(e) => setJobFormData({ ...jobFormData, scheduled_start: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="job-end">End Date & Time *</Label>
              <Input
                id="job-end"
                type="datetime-local"
                value={jobFormData.scheduled_end}
                onChange={(e) => setJobFormData({ ...jobFormData, scheduled_end: e.target.value })}
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
    </div>
  );
}
