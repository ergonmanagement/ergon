import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

// Determine the base URL for metadata - uses Vercel URL in production, localhost in development
const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

// SEO metadata configuration for the entire application
export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Ergon Management",
  description: "Multi-tenant SaaS OS for service businesses",
};

// Configure Google Fonts - using Geist Sans as the primary font
const geistSans = Geist({
  variable: "--font-geist-sans", // CSS variable for the font
  display: "swap", // Optimize font loading for better performance
  subsets: ["latin"], // Only load Latin character subset
});

/**
 * Root layout component - wraps the entire application
 * This is the highest level layout that applies to all pages
 * Includes global styles, fonts, and HTML structure
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.className} min-h-screen overflow-x-hidden`}>
        {/* All page content is rendered here through the children prop */}
        {children}
      </body>
    </html>
  );
}
