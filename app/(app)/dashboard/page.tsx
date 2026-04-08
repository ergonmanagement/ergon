import { Suspense } from "react";
import { AppPageHeader } from "@/components/layout/app-page-header";
import { requireAuth } from "@/lib/auth";
import { DashboardClient } from "./_components/dashboard-client";

/**
 * Server Component that handles authentication and renders dashboard content
 * This component runs on the server and ensures user is authenticated before showing data
 */
export async function DashboardContent() {
  // Server-side authentication check - redirects if not authenticated
  const user = await requireAuth();

  return (
    <div className="space-y-8">
      <AppPageHeader
        title="Dashboard"
        description={`Welcome back, ${user.email}`}
      />

      {/* Main dashboard content - delegated to client component for interactivity */}
      <DashboardClient />
    </div>
  );
}

/**
 * Main Dashboard Page Component
 * Uses Suspense to handle loading state while server component resolves
 * This pattern allows for better user experience during authentication checks
 */
export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground text-sm">Loading dashboard…</div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}