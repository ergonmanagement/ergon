import type { ReactNode } from "react";
import Link from "next/link";
import { Suspense } from "react";
import { AuthButton } from "@/components/auth-button";
import { ProfileProvider } from "@/contexts/profile-context";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <ProfileProvider>
      <div className="min-h-svh flex flex-col bg-[#131B41] text-[#FFFFF6]">
        <nav className="w-full flex justify-center border-b border-white/10 h-16 bg-[#131B41]/90 backdrop-blur">
          <div className="w-full max-w-5xl flex justify-between items-center px-5 text-sm">
            <div className="flex gap-3 items-center font-semibold">
              <Link href="/" className="text-base">
                Ergon Management
              </Link>
              <span className="text-xs text-white/60 hidden sm:inline">
                One place to organize and grow your service business.
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/pricing" className="text-sm text-white/80 hover:text-white">
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

