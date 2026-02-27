import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AuthButton } from "@/components/auth-button";
import { ProfileProvider } from "@/contexts/profile-context";
import Link from "next/link";
import { Suspense } from "react";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Next.js and Supabase Starter Kit",
  description: "The fastest way to build apps with Next.js and Supabase",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.className} antialiased`}>
        <ProfileProvider>
          <nav className="w-full flex justify-center border-b h-16">
            <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
              <div className="flex gap-5 items-center font-semibold">
                <Link href={"/"}>Next.js Supabase Starter - Testing Workflow!</Link>
              </div>
              <Suspense>
                <AuthButton />
              </Suspense>
            </div>
          </nav>
          <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        </ProfileProvider>
      </body>
    </html>
  );
}
