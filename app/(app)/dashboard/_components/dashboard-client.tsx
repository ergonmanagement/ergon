"use client";

import Link from "next/link";
import { useDashboard } from "@/hooks/use-dashboard";

/**
 * Utility function to format currency values consistently across the dashboard
 * 
 * @param amount - The numeric amount to format
 * @returns Formatted currency string (e.g., "$1,234")
 */
function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Loading skeleton component to show while dashboard data is fetching
 * Provides visual feedback with animated placeholders that match the final layout
 */
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats cards skeleton - mirrors the 3-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="ergon-card p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-24 mb-2"></div>
              <div className="h-8 bg-muted rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Content cards skeleton - mirrors the 2-column layout on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="ergon-card p-6">
            <div className="animate-pulse">
              <div className="h-5 bg-muted rounded w-32 mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Main Dashboard Client Component
 * 
 * This client component handles the interactive dashboard interface including:
 * - Real-time data fetching and display
 * - Loading states with skeleton UI
 * - Error handling and user feedback
 * - Navigation links to detailed views
 * 
 * The component integrates with the useDashboard hook to fetch aggregated
 * business data including schedules, prospects, financial summaries, and more.
 */
export function DashboardClient() {
  // Fetch dashboard data using custom hook
  const { data, loading, error } = useDashboard();

  // Show loading skeleton while data is being fetched
  if (loading) {
    return <DashboardSkeleton />;
  }

  // Handle error states with user-friendly messaging
  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-red-400 text-xl">⚠️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Unable to load dashboard
            </h3>
            <p className="mt-2 text-sm text-red-700">
              {error ?? "Something went wrong. Please try refreshing the page."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Destructure dashboard data for easier access
  const { today_schedule, upcoming_jobs, new_prospects, finance_summary, marketing_reminders } = data;

  return (
    <div className="space-y-8">
      {/* Financial Overview Cards - Key Performance Indicators */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">Financial Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Revenue Card - Shows total income */}
          <div className="ergon-card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-success/15 rounded-lg flex items-center justify-center">
                  <span className="text-success text-xl">💰</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(finance_summary.revenue)}
                </p>
              </div>
            </div>
          </div>

          {/* Expenses Card - Shows total expenses */}
          <div className="ergon-card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-destructive/10 rounded-lg flex items-center justify-center">
                  <span className="text-destructive text-xl">📊</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Expenses</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(finance_summary.expenses)}
                </p>
              </div>
            </div>
          </div>

          <div className="ergon-card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${finance_summary.net >= 0 ? 'bg-primary/15' : 'bg-destructive/10'
                  }`}>
                  <span className={`text-xl ${finance_summary.net >= 0 ? 'text-primary' : 'text-destructive'
                    }`}>
                    {finance_summary.net >= 0 ? '📈' : '📉'}
                  </span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Net Income</p>
                <p className={`text-2xl font-bold ${finance_summary.net >= 0 ? 'text-success' : 'text-destructive'
                  }`}>
                  {formatCurrency(finance_summary.net)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <div className="ergon-card">
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Today's Schedule</h3>
              <Link
                href="/schedule"
                className="text-sm font-medium text-primary hover:text-primary/80"
              >
                View all →
              </Link>
            </div>
          </div>
          <div className="p-6">
            {today_schedule.events.length === 0 && today_schedule.jobs.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-muted-foreground/80 text-4xl mb-4 block">📅</span>
                <p className="text-muted-foreground">No events scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-4">
                {today_schedule.events.map((event: any) => (
                  <div key={event.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{event.title}</p>
                      <p className="text-xs text-muted-foreground uppercase">{event.type}</p>
                    </div>
                  </div>
                ))}
                {today_schedule.jobs.map((job: any) => (
                  <div key={job.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <Link
                        href={`/jobs/${job.id}`}
                        className="text-sm font-medium text-primary hover:text-primary/80"
                      >
                        {job.customer_name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{job.service_type}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Jobs */}
        <div className="ergon-card">
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Upcoming Jobs</h3>
              <Link
                href="/jobs"
                className="text-sm font-medium text-primary hover:text-primary/80"
              >
                View all →
              </Link>
            </div>
          </div>
          <div className="p-6">
            {upcoming_jobs.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-muted-foreground/80 text-4xl mb-4 block">🔧</span>
                <p className="text-muted-foreground">No upcoming jobs scheduled</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcoming_jobs.map((job: any) => (
                  <div key={job.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <Link
                        href={`/jobs/${job.id}`}
                        className="text-sm font-medium text-primary hover:text-primary/80"
                      >
                        {job.customer_name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{job.service_type}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {job.scheduled_start && new Date(job.scheduled_start).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* New Prospects */}
        <div className="ergon-card">
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">New Prospects</h3>
              <Link
                href="/customers"
                className="text-sm font-medium text-primary hover:text-primary/80"
              >
                View all →
              </Link>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
          </div>
          <div className="p-6">
            {new_prospects.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-muted-foreground/80 text-4xl mb-4 block">👥</span>
                <p className="text-muted-foreground">No new prospects this week</p>
              </div>
            ) : (
              <div className="space-y-3">
                {new_prospects.map((prospect: any) => (
                  <div key={prospect.id} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/15 rounded-full flex items-center justify-center">
                      <span className="text-primary text-xs font-medium">
                        {prospect.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{prospect.name}</p>
                      <p className="text-xs text-muted-foreground">{prospect.source || 'Unknown source'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Marketing Reminders */}
        <div className="ergon-card">
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Marketing</h3>
              <Link
                href="/marketing"
                className="text-sm font-medium text-primary hover:text-primary/80"
              >
                View all →
              </Link>
            </div>
          </div>
          <div className="p-6">
            {marketing_reminders.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-muted-foreground/80 text-4xl mb-4 block">📢</span>
                <p className="text-muted-foreground">Generate marketing content to see it here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {marketing_reminders.map((reminder: any) => (
                  <div key={reminder.id} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-xs bg-primary/15 text-foreground px-2 py-1 rounded-full uppercase font-medium">
                        {reminder.channel}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/90">
                      {reminder.content.slice(0, 120)}
                      {reminder.content.length > 120 ? '...' : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
