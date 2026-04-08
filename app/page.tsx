import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function HomeContent() {
  const supabase = await createClient();
  let user: unknown = null;
  try {
    const { data } = await supabase.auth.getClaims();
    user = data?.claims;
  } catch {
    user = null;
  }

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
          <span className="text-lg font-semibold text-foreground">Ergon</span>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/pricing"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/auth/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/auth/sign-up"
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
            >
              Start free trial
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-16 md:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-primary mb-4">
            Multi-tenant · Secure · Built for service businesses
          </p>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground leading-tight">
            Run your business with{" "}
            <span className="text-primary">clarity</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            Customers, jobs, schedule, finance, and marketing—organized in one
            calm, professional workspace.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <Link
              href="/auth/sign-up"
              className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-base font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
            >
              Start free trial
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center rounded-md border border-border bg-card px-8 py-3 text-base font-medium text-foreground shadow-sm hover:bg-muted/50 transition-colors"
            >
              Sign in
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            No credit card required · Full access during your trial
          </p>
        </div>

        <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {[
            {
              icon: "📅",
              title: "Schedule",
              desc: "Week and month views with fast edits",
            },
            {
              icon: "🔧",
              title: "Jobs",
              desc: "From lead to paid, end to end",
            },
            {
              icon: "👥",
              title: "Customers",
              desc: "Prospects, notes, and contact info",
            },
            {
              icon: "💰",
              title: "Finance",
              desc: "Revenue and expense totals you can trust",
            },
            {
              icon: "📢",
              title: "Marketing",
              desc: "Generate copy fast and keep campaign history",
            },
          ].map((item) => (
            <div key={item.title} className="ergon-card p-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-md bg-accent text-lg">
                <span aria-hidden>{item.icon}</span>
              </div>
              <h3 className="font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-snug">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 ergon-card p-8 md:p-10 text-center max-w-3xl mx-auto">
          <h2 className="text-xl font-semibold text-foreground">
            Ready to organize your business?
          </h2>
          <p className="mt-3 text-muted-foreground text-sm md:text-base">
            Same tools serious operators use—without the clutter.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/auth/sign-up"
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Get started free
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-md border border-border bg-background px-6 py-3 text-sm font-medium hover:bg-muted/60 transition-colors"
            >
              View pricing
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground text-sm">
          Loading…
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
