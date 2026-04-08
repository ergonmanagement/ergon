"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function PublicPricingLink() {
  const pathname = usePathname();

  if (pathname === "/pricing") {
    return null;
  }

  return (
    <Link
      href="/pricing"
      className="text-sm text-ergon-cream/80 hover:text-ergon-primary transition-colors"
    >
      Pricing
    </Link>
  );
}

