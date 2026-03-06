import { requireAuth } from "@/lib/auth";
import { CustomerDetailClient } from "./_components/customer-detail-client";

type PageProps = {
  params: { customerId: string };
};

export default async function CustomerDetailPage({ params }: PageProps) {
  await requireAuth();
  return <CustomerDetailClient customerId={params.customerId} />;
}

