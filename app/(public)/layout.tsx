import type { ReactNode } from "react";
import Link from "next/link";
import { Suspense } from "react";
import { AuthButton } from "@/components/auth-button";
import { ProfileProvider } from "@/contexts/profile-context";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <ProfileProvider>
      <div className="min-h-svh flex flex-col bg-ergon-navy text-ergon-cream">
        <nav className="w-full flex justify-center border-b border-white/10 h-14 bg-ergon-navy/95 backdrop-blur-sm">
          <div className="w-full max-w-5xl flex justify-between items-center px-5 text-sm">
            <div className="flex gap-3 items-center font-semibold">
              <Link
                href="/"
                className="text-base text-ergon-cream hover:text-ergon-primary transition-colors"
              >
                Ergon Management
              </Link>
              <span className="text-xs text-ergon-cream/55 hidden sm:inline font-normal">
                One place to organize and grow your service business.
              </span>
            </div>
            <div className="flex items-center gap-5">
              <Link
                href="/pricing"
                className="text-sm text-ergon-cream/80 hover:text-ergon-primary transition-colors"
              >
                Pricing
              </Link>
              <Suspense>
                <AuthButton />
              </Suspense>
            </div>
          </div>
        </nav>
        <main className="flex-1 flex flex-col items-center px-4 py-10">
          {children}
        </main>
      </div>
    </ProfileProvider>
  );
}

