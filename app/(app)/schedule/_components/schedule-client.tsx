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

  const { events, loading, error } = useSchedule({
    from: dateRange.from,
    to: dateRange.to,
  });

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                const newDate = new Date(currentDate);
                if (view === "month") {
                  newDate.setMonth(newDate.getMonth() - 1);
                } else {
                  newDate.setDate(newDate.getDate() - 7);
                }
                setCurrentDate(newDate);
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              ←
            </button>
            <h2 className="text-lg font-medium text-gray-700">
              {view === "month"
                ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                : `Week of ${currentDate.toLocaleDateString()}`
              }
            </h2>
            <button
              onClick={() => {
                const newDate = new Date(currentDate);
                if (view === "month") {
                  newDate.setMonth(newDate.getMonth() + 1);
                } else {
                  newDate.setDate(newDate.getDate() + 7);
                }
                setCurrentDate(newDate);
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              →
            </button>
          </div>
        </div>

        <div className="inline-flex rounded-md border border-gray-300 text-xs overflow-hidden bg-white">
          <button
            type="button"
            onClick={() => setView("week")}
            className={`px-3 py-1 ${view === "week" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-50"
              }`}
          >
            Week
          </button>
          <button
            type="button"
            onClick={() => setView("month")}
            className={`px-3 py-1 ${view === "month" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-50"
              }`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading schedule...</div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200" role="alert">
          {error}
        </div>
      )}

      {/* Calendar Views */}
      {!loading && !error && (
        <>
          {view === "month" ? (
            /* Calendar Grid View */
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Days of the week header */}
              <div className="grid grid-cols-7 border-b border-gray-200">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="bg-gray-50 px-3 py-2 text-center text-sm font-medium text-gray-700">
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
                      className={`min-h-[120px] border-r border-b border-gray-200 p-2 ${!day.isCurrentMonth ? "bg-gray-50" : "bg-white"
                        } ${isToday ? "bg-blue-50" : ""}`}
                    >
                      {day.date && (
                        <>
                          <div className={`text-sm mb-1 ${isToday
                              ? "bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold"
                              : "text-gray-900"
                            }`}>
                            {day.date.getDate()}
                          </div>
                          <div className="space-y-1">
                            {dayEvents.slice(0, 3).map((event, eventIndex) => (
                              <div
                                key={eventIndex}
                                className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded truncate"
                                title={event.title}
                              >
                                {event.title}
                              </div>
                            ))}
                            {dayEvents.length > 3 && (
                              <div className="text-xs text-gray-500">
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
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Days of the week header */}
              <div className="grid grid-cols-7 border-b border-gray-200">
                {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => (
                  <div key={day} className="bg-gray-50 px-3 py-2 text-center text-sm font-medium text-gray-700">
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
                        className={`min-h-[200px] border-r border-b border-gray-200 p-3 ${isToday ? "bg-blue-50" : "bg-white"
                          }`}
                      >
                        <div className={`text-lg mb-3 font-medium ${isToday
                            ? "bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center"
                            : "text-gray-900"
                          }`}>
                          {date.getDate()}
                        </div>
                        <div className="space-y-2">
                          {dayEvents.map((event, eventIndex) => (
                            <div
                              key={eventIndex}
                              className="text-xs bg-blue-100 text-blue-800 px-2 py-2 rounded border-l-2 border-blue-400"
                              title={`${event.title} - ${new Date(event.start_at).toLocaleTimeString()}`}
                            >
                              <div className="font-medium truncate">{event.title}</div>
                              <div className="text-blue-600 mt-1">
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
                <div className="text-center py-8 text-gray-500">
                  No events scheduled this week.
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

