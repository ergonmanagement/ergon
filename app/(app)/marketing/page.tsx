import { requireAuth } from "@/lib/auth";
import { MarketingClient } from "./_components/marketing-client";

export default async function MarketingPage() {
  await requireAuth();
  return <MarketingClient />;
}

