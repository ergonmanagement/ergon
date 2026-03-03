"use client";

import { useCustomers } from "@/hooks/use-customers";

export function CustomersClient() {
  const { customers, loading, error } = useCustomers();

  if (loading) {
    return <div className="text-sm text-white/70">Loading customers...</div>;
  }

  if (error) {
    return (
      <div className="text-sm text-red-400" role="alert">
        {error}
      </div>
    );
  }

  if (!customers.length) {
    return (
      <div className="text-sm text-white/70">
        No customers yet. Add a job or customer to get started.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Customers</h1>
      <div className="hidden md:block">
        <table className="w-full text-sm border border-white/10 rounded-lg overflow-hidden">
          <thead className="bg-white/5 text-left">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Phone</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-t border-white/10">
                <td className="px-3 py-2">{c.name}</td>
                <td className="px-3 py-2 capitalize">{c.type}</td>
                <td className="px-3 py-2">{c.email}</td>
                <td className="px-3 py-2">{c.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-3 md:hidden">
        {customers.map((c) => (
          <div
            key={c.id}
            className="border border-white/10 rounded-lg p-3 bg-white/5"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold">{c.name}</span>
              <span className="text-xs uppercase text-white/60">
                {c.type}
              </span>
            </div>
            {c.email && (
              <p className="text-xs text-white/70">Email: {c.email}</p>
            )}
            {c.phone && (
              <p className="text-xs text-white/70">Phone: {c.phone}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

