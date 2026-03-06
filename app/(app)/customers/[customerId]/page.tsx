import { Suspense } from "react";
import { requireAuth } from "@/lib/auth";
import { CustomerDetailClient } from "./_components/customer-detail-client";

type PageProps = {
  params: { customerId: string };
};

async function CustomerDetailContent({ customerId }: { customerId: string }) {
  await requireAuth();
  return <CustomerDetailClient customerId={customerId} />;
}

export default function CustomerDetailPage({ params }: PageProps) {
  return (
    <Suspense fallback={<div className="p-4">Loading…</div>}>
      <CustomerDetailContent customerId={params.customerId} />
    </Suspense>
  );
}

