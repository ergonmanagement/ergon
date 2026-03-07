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
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Content cards skeleton - mirrors the 2-column layout on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-32 mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Revenue Card - Shows total income */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 text-xl">💰</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(finance_summary.revenue)}
                </p>
              </div>
            </div>
          </div>

          {/* Expenses Card - Shows total expenses */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-red-600 text-xl">📊</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Expenses</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(finance_summary.expenses)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${finance_summary.net >= 0 ? 'bg-blue-100' : 'bg-red-100'
                  }`}>
                  <span className={`text-xl ${finance_summary.net >= 0 ? 'text-blue-600' : 'text-red-600'
                    }`}>
                    {finance_summary.net >= 0 ? '📈' : '📉'}
                  </span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Net Income</p>
                <p className={`text-2xl font-bold ${finance_summary.net >= 0 ? 'text-green-600' : 'text-red-600'
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
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Today's Schedule</h3>
              <Link
                href="/schedule"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                View all →
              </Link>
            </div>
          </div>
          <div className="p-6">
            {today_schedule.events.length === 0 && today_schedule.jobs.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-gray-400 text-4xl mb-4 block">📅</span>
                <p className="text-gray-500">No events scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-4">
                {today_schedule.events.map((event: any) => (
                  <div key={event.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{event.title}</p>
                      <p className="text-xs text-gray-500 uppercase">{event.type}</p>
                    </div>
                  </div>
                ))}
                {today_schedule.jobs.map((job: any) => (
                  <div key={job.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <Link
                        href={`/jobs/${job.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-500"
                      >
                        {job.customer_name}
                      </Link>
                      <p className="text-xs text-gray-500">{job.service_type}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Jobs */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Jobs</h3>
              <Link
                href="/jobs"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                View all →
              </Link>
            </div>
          </div>
          <div className="p-6">
            {upcoming_jobs.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-gray-400 text-4xl mb-4 block">🔧</span>
                <p className="text-gray-500">No upcoming jobs scheduled</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcoming_jobs.map((job: any) => (
                  <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <Link
                        href={`/jobs/${job.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-500"
                      >
                        {job.customer_name}
                      </Link>
                      <p className="text-xs text-gray-500">{job.service_type}</p>
                    </div>
                    <div className="text-xs text-gray-500">
                      {job.scheduled_start && new Date(job.scheduled_start).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* New Prospects */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">New Prospects</h3>
              <Link
                href="/customers"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                View all →
              </Link>
            </div>
            <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
          </div>
          <div className="p-6">
            {new_prospects.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-gray-400 text-4xl mb-4 block">👥</span>
                <p className="text-gray-500">No new prospects this week</p>
              </div>
            ) : (
              <div className="space-y-3">
                {new_prospects.map((prospect: any) => (
                  <div key={prospect.id} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-xs font-medium">
                        {prospect.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{prospect.name}</p>
                      <p className="text-xs text-gray-500">{prospect.source || 'Unknown source'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Marketing Reminders */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Marketing</h3>
              <Link
                href="/marketing"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                View all →
              </Link>
            </div>
          </div>
          <div className="p-6">
            {marketing_reminders.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-gray-400 text-4xl mb-4 block">📢</span>
                <p className="text-gray-500">Generate marketing content to see it here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {marketing_reminders.map((reminder: any) => (
                  <div key={reminder.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full uppercase font-medium">
                        {reminder.channel}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">
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
