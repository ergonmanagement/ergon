"use client";

import { useState } from "react";
import { useFinanceEntries, FinanceEntryType } from "@/hooks/use-finance-entries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, TrendingUp, TrendingDown, DollarSign, Calendar, FileText } from "lucide-react";

type TimeFilter = "week" | "month" | "year";

export function FinanceClient() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("month");
  const [typeFilter, setTypeFilter] = useState<"all" | FinanceEntryType>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);

  // Form state for create/edit
  const [formData, setFormData] = useState({
    type: "revenue" as FinanceEntryType,
    amount: "",
    title: "",
    job_id: "",
    category: "",
    entry_date: "",
    notes: ""
  });

  // Helper function to get date range based on timeFilter
  const getDateRange = (timeFilter: TimeFilter) => {
    const now = new Date();
    let from: Date, to: Date;

    switch (timeFilter) {
      case "week":
        const day = now.getDay();
        const diff = now.getDate() - day;
        from = new Date(now.setDate(diff));
        from.setHours(0, 0, 0, 0);
        to = new Date(from);
        to.setDate(from.getDate() + 6);
        to.setHours(23, 59, 59, 999);
        break;
      case "month":
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case "year":
        from = new Date(now.getFullYear(), 0, 1);
        to = new Date(now.getFullYear(), 11, 31);
        to.setHours(23, 59, 59, 999);
        break;
    }

    return {
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0]
    };
  };

  const dateRange = getDateRange(timeFilter);
  const { entries, loading, error, upsertEntry, totals } = useFinanceEntries({
    from: dateRange.from,
    to: dateRange.to,
    type: typeFilter === "all" ? undefined : typeFilter
  });

  const resetForm = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      type: "revenue",
      amount: "",
      title: "",
      job_id: "",
      category: "",
      entry_date: today,
      notes: ""
    });
  };

  const handleCreate = () => {
    resetForm();
    setSelectedEntry(null);
    setShowCreateDialog(true);
  };

  const handleEdit = (entry: any) => {
    setFormData({
      type: entry.type || "revenue",
      amount: entry.amount?.toString() || "",
      title: entry.title || "",
      job_id: entry.job_id || "",
      category: entry.category || "",
      entry_date: entry.entry_date ? new Date(entry.entry_date).toISOString().split('T')[0] : "",
      notes: entry.notes || ""
    });
    setSelectedEntry(entry);
    setShowEditDialog(true);
  };

  const handleViewDetails = (entry: any) => {
    setSelectedEntry(entry);
    setShowDetailsDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await upsertEntry({
        id: selectedEntry?.id,
        type: formData.type,
        amount: parseFloat(formData.amount),
        title: formData.title,
        job_id: formData.job_id || null,
        category: formData.category || null,
        entry_date: formData.entry_date,
        notes: formData.notes || null
      });
      setShowCreateDialog(false);
      setShowEditDialog(false);
      resetForm();
    } catch (err) {
      console.error("Failed to save finance entry:", err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getTypeColor = (type: FinanceEntryType) => {
    return type === "revenue"
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-red-100 text-red-800 border-red-200";
  };

  const getTypeIcon = (type: FinanceEntryType) => {
    return type === "revenue" ? <TrendingUp size={16} /> : <TrendingDown size={16} />;
  };

  if (loading) {
    return <div className="text-sm text-gray-600">Loading finance data...</div>;
  }

  if (error) {
    return (
      <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg" role="alert">
        {error}
      </div>
    );
  }

  const revenue = totals?.revenue || 0;
  const expenses = totals?.expenses || 0;
  const profit = revenue - expenses;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus size={16} />
          Add Entry
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(revenue)}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Expenses</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(expenses)}</p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Profit</p>
              <p className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(profit)}
              </p>
            </div>
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${profit >= 0 ? 'bg-green-100' : 'bg-red-100'
              }`}>
              <DollarSign className={`h-6 w-6 ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Time Filter */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {[
            { key: "week", label: "This Week" },
            { key: "month", label: "This Month" },
            { key: "year", label: "This Year" }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTimeFilter(key as TimeFilter)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${timeFilter === key
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Type Filter */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {[
            { key: "all", label: "All" },
            { key: "revenue", label: "Revenue" },
            { key: "expense", label: "Expenses" }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTypeFilter(key as any)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${typeFilter === key
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Entries List */}
      {entries.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600 mb-4">
            No finance entries for this period.
          </p>
          <Button onClick={handleCreate} variant="outline">
            Add First Entry
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(entry.type)}
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(entry.type)}`}>
                          {entry.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-medium">
                        {entry.title || "—"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {entry.category || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${entry.type === 'revenue' ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {entry.type === 'expense' ? '-' : ''}{formatCurrency(entry.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {entry.entry_date ? new Date(entry.entry_date).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(entry)}
                      >
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(entry)}
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(entry.type)}
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(entry.type)}`}>
                      {entry.type}
                    </span>
                  </div>
                  <span className={`text-lg font-bold ${entry.type === 'revenue' ? 'text-green-600' : 'text-red-600'
                    }`}>
                    {entry.type === 'expense' ? '-' : ''}{formatCurrency(entry.amount)}
                  </span>
                </div>

                <div className="space-y-1 text-sm text-gray-600 mb-3">
                  <div className="font-medium text-gray-900">
                    {entry.title || "No title"}
                  </div>
                  {entry.category && (
                    <div>Category: {entry.category}</div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    {entry.entry_date ? new Date(entry.entry_date).toLocaleDateString() : "No date"}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewDetails(entry)}
                    className="flex-1"
                  >
                    View Details
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(entry)}
                    className="flex-1"
                  >
                    Edit
                  </Button>
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
            <DialogTitle>Add Finance Entry</DialogTitle>
            <DialogDescription>
              Record a new revenue or expense entry.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={formData.type} onValueChange={(value: FinanceEntryType) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, amount: e.target.value })}
                required
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="Brief description of the entry"
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Materials, Labor, Marketing"
              />
            </div>

            <div>
              <Label htmlFor="entry_date">Date *</Label>
              <Input
                id="entry_date"
                type="date"
                value={formData.entry_date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, entry_date: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes or details"
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">Add Entry</Button>
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
            <DialogTitle>Edit Finance Entry</DialogTitle>
            <DialogDescription>
              Update the finance entry details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit_type">Type</Label>
              <Select value={formData.type} onValueChange={(value: FinanceEntryType) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit_amount">Amount *</Label>
              <Input
                id="edit_amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="edit_title">Title *</Label>
              <Input
                id="edit_title"
                value={formData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="edit_category">Category</Label>
              <Input
                id="edit_category"
                value={formData.category}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="edit_entry_date">Date *</Label>
              <Input
                id="edit_entry_date"
                type="date"
                value={formData.entry_date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, entry_date: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="edit_notes">Notes</Label>
              <Textarea
                id="edit_notes"
                value={formData.notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes or details"
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

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Entry Details</DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getTypeIcon(selectedEntry.type)}
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(selectedEntry.type)}`}>
                    {selectedEntry.type}
                  </span>
                </div>
                <span className={`text-xl font-bold ${selectedEntry.type === 'revenue' ? 'text-green-600' : 'text-red-600'
                  }`}>
                  {selectedEntry.type === 'expense' ? '-' : ''}{formatCurrency(selectedEntry.amount)}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <h4 className="font-medium text-gray-900">Description</h4>
                  <p className="text-gray-600">{selectedEntry.description || "No description"}</p>
                </div>

                {selectedEntry.category && (
                  <div>
                    <h4 className="font-medium text-gray-900">Category</h4>
                    <p className="text-gray-600">{selectedEntry.category}</p>
                  </div>
                )}

                <div>
                  <h4 className="font-medium text-gray-900">Date</h4>
                  <p className="text-gray-600 flex items-center gap-1">
                    <Calendar size={12} />
                    {selectedEntry.date ? new Date(selectedEntry.date).toLocaleDateString() : "No date"}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={() => handleEdit(selectedEntry)} className="flex-1">
                  Edit Entry
                </Button>
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

