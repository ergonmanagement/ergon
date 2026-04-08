"use client";

import { useState } from "react";
import { AppPageHeader } from "@/components/layout/app-page-header";
import { useJobs, JobStatus, type Job } from "@/hooks/use-jobs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search } from "lucide-react";

type JobsSortColumn =
  | "customer"
  | "address"
  | "date_scheduled"
  | "date_created"
  | "status";

function compareJobs(
  a: Job,
  b: Job,
  sortBy: JobsSortColumn,
  sortOrder: "asc" | "desc",
): number {
  let cmp = 0;
  switch (sortBy) {
    case "customer":
      cmp = a.customer_name.localeCompare(b.customer_name, undefined, {
        sensitivity: "base",
      });
      break;
    case "address":
      cmp = (a.address ?? "").localeCompare(b.address ?? "", undefined, {
        sensitivity: "base",
      });
      break;
    case "status":
      cmp = a.status.localeCompare(b.status);
      break;
    case "date_created": {
      const ta = a.created_at
        ? new Date(a.created_at).getTime()
        : 0;
      const tb = b.created_at
        ? new Date(b.created_at).getTime()
        : 0;
      cmp = ta - tb;
      break;
    }
    case "date_scheduled": {
      const aN = a.scheduled_start
        ? new Date(a.scheduled_start).getTime()
        : null;
      const bN = b.scheduled_start
        ? new Date(b.scheduled_start).getTime()
        : null;
      if (aN === null && bN === null) cmp = 0;
      else if (aN === null) cmp = 1;
      else if (bN === null) cmp = -1;
      else cmp = aN - bN;
      break;
    }
    default:
      cmp = 0;
  }
  return sortOrder === "asc" ? cmp : -cmp;
}

export function JobsClient() {
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<JobsSortColumn>("date_created");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  // Form state for create/edit
  const [formData, setFormData] = useState({
    customer_name: "",
    service_type: "",
    status: "lead" as JobStatus,
    scheduled_start: "",
    scheduled_end: "",
    address: "",
    price: "",
    notes: ""
  });

  const { jobs, loading, error, upsertJob } = useJobs({
    status: filter === "all" ? undefined : (filter === "upcoming" ? "scheduled" : "completed"),
  });

  const filteredJobs = jobs.filter(job =>
    job.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    job.service_type.toLowerCase().includes(search.toLowerCase()) ||
    job.address?.toLowerCase().includes(search.toLowerCase())
  );

  const sortedJobs = [...filteredJobs].sort((a, b) =>
    compareJobs(a, b, sortBy, sortOrder),
  );

  const resetForm = () => {
    setFormData({
      customer_name: "",
      service_type: "",
      status: "lead",
      scheduled_start: "",
      scheduled_end: "",
      address: "",
      price: "",
      notes: ""
    });
  };

  const handleCreate = () => {
    resetForm();
    setSelectedJob(null);
    setShowCreateDialog(true);
  };

  const handleEdit = (job: any) => {
    setFormData({
      customer_name: job.customer_name || "",
      service_type: job.service_type || "",
      status: job.status || "lead",
      scheduled_start: job.scheduled_start ? job.scheduled_start.split('T')[0] : "",
      scheduled_end: job.scheduled_end ? job.scheduled_end.split('T')[0] : "",
      address: job.address || "",
      price: job.price?.toString() || "",
      notes: job.notes || ""
    });
    setSelectedJob(job);
    setShowEditDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await upsertJob({
        id: selectedJob?.id,
        customer_name: formData.customer_name,
        service_type: formData.service_type,
        status: formData.status,
        scheduled_start: formData.scheduled_start || null,
        scheduled_end: formData.scheduled_end || null,
        address: formData.address || null,
        price: formData.price ? parseFloat(formData.price) : null,
        notes: formData.notes || null,
        customer_id: null,
        source: null
      });
      setShowCreateDialog(false);
      setShowEditDialog(false);
      resetForm();
    } catch (err) {
      console.error("Failed to save job:", err);
    }
  };

  const handleSort = (column: JobsSortColumn) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder(
        column === "date_created" || column === "date_scheduled"
          ? "desc"
          : "asc",
      );
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading jobs...</div>;
  }

  if (error) {
    return (
      <div className="text-sm text-destructive bg-destructive/5 border border-destructive/20 p-3 rounded-lg" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AppPageHeader
        title="Jobs"
        actions={
          <Button onClick={handleCreate} className="flex items-center gap-2">
            <Plus size={16} />
            Add Job
          </Button>
        }
      />

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Filter Tabs */}
        <div className="flex rounded-lg border border-border bg-muted/60 p-1">
          {[
            { key: "all", label: "All" },
            { key: "upcoming", label: "Upcoming" },
            { key: "past", label: "Past" }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${filter === key
                  ? "bg-card text-primary shadow-sm ring-1 ring-border"
                  : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Jobs Table/List */}
      {sortedJobs.length === 0 ? (
        <div className="text-center py-12 bg-muted/40 rounded-lg border border-dashed border-border">
          <p className="text-muted-foreground mb-4">
            {search || filter !== "all"
              ? "No jobs match your current filters."
              : "No jobs yet. Create your first job to get started."
            }
          </p>
          {!search && filter === "all" && (
            <Button onClick={handleCreate} variant="outline">
              Create First Job
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block ergon-card overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  {(
                    [
                      { key: "customer", label: "Customer" },
                      { key: "address", label: "Address" },
                      { key: "date_scheduled", label: "Date scheduled" },
                      { key: "date_created", label: "Date created" },
                      { key: "status", label: "Status" },
                    ] as const
                  ).map(({ key, label }) => (
                    <th
                      key={key}
                      className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/80"
                      onClick={() => handleSort(key)}
                    >
                      <div className="flex items-center gap-1">
                        {label}
                        {sortBy === key && (
                          <span className="text-primary">
                            {sortOrder === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Service
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedJobs.map((job) => (
                  <tr
                    key={job.id}
                    className="hover:bg-muted/40 cursor-pointer"
                    onClick={() => handleEdit(job)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-foreground">
                        {job.customer_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground max-w-[200px]">
                      {job.address?.trim() ? job.address : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {job.scheduled_start
                        ? new Date(job.scheduled_start).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {job.created_at
                        ? new Date(job.created_at).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${job.status === "completed"
                          ? "bg-success/15 text-success"
                          : job.status === "scheduled"
                            ? "bg-primary/15 text-foreground"
                            : job.status === "paid"
                              ? "bg-accent text-accent-foreground"
                              : "bg-warning/20 text-foreground"
                          }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {job.service_type}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {sortedJobs.map((job) => (
              <div
                key={job.id}
                className="ergon-card p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => handleEdit(job)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium text-foreground">{job.customer_name}</div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${job.status === "completed" ? "bg-success/15 text-success" :
                      job.status === "scheduled" ? "bg-primary/15 text-foreground" :
                        job.status === "paid" ? "bg-accent text-accent-foreground" :
                          "bg-warning/20 text-foreground"
                    }`}>
                    {job.status}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>{job.service_type}</div>
                  {job.address?.trim() ? <div>{job.address}</div> : null}
                  <div>
                    {job.scheduled_start
                      ? `Scheduled: ${new Date(job.scheduled_start).toLocaleDateString()}`
                      : "Not scheduled"}
                  </div>
                  {job.created_at ? (
                    <div>
                      Created:{" "}
                      {new Date(job.created_at).toLocaleDateString()}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Job</DialogTitle>
            <DialogDescription>
              Add a new job to your system. If the customer doesn't exist, they'll be created automatically.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="customer_name">Customer Name *</Label>
              <Input
                id="customer_name"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="service_type">Service Type *</Label>
              <Input
                id="service_type"
                value={formData.service_type}
                onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                placeholder="e.g., Auto Detailing, Window Washing"
                required
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: JobStatus) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="scheduled_start">Start Date</Label>
                <Input
                  id="scheduled_start"
                  type="date"
                  value={formData.scheduled_start}
                  onChange={(e) => setFormData({ ...formData, scheduled_start: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">Create Job</Button>
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Job</DialogTitle>
            <DialogDescription>
              Update job details and status.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit_customer_name">Customer Name *</Label>
              <Input
                id="edit_customer_name"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit_service_type">Service Type *</Label>
              <Input
                id="edit_service_type"
                value={formData.service_type}
                onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit_status">Status</Label>
              <Select value={formData.status} onValueChange={(value: JobStatus) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit_address">Address</Label>
              <Input
                id="edit_address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_scheduled_start">Start Date</Label>
                <Input
                  id="edit_scheduled_start"
                  type="date"
                  value={formData.scheduled_start}
                  onChange={(e) => setFormData({ ...formData, scheduled_start: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit_price">Price</Label>
                <Input
                  id="edit_price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit_notes">Notes</Label>
              <Textarea
                id="edit_notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">Save Changes</Button>
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

