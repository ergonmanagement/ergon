import { requireAuth } from "@/lib/auth";
import { CustomersClient } from "./_components/customers-client";

export default async function CustomersPage() {
  await requireAuth();
  return <CustomersClient />;
}


