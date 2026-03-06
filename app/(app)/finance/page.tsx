import { requireAuth } from "@/lib/auth";
import { FinanceClient } from "./_components/finance-client";

export default async function FinancePage() {
  await requireAuth();
  return <FinanceClient />;
}

