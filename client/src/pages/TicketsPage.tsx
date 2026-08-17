import { useState, useMemo } from "react";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TicketStatus, TicketCategory } from "../../../core/src/schemas/ticket";

export interface TicketItem {
  id: number;
  subject: string;
  body: string;
  senderEmail: string;
  senderName: string;
  status: string;
  category?: string | null;
  assignedTo?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function TicketsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Fetch Tickets Query
  const { data: rawTickets = [], isLoading, error: queryError } = useQuery<TicketItem[]>({
    queryKey: ["tickets"],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/api/tickets`, {
        withCredentials: true,
      });
      return res.data.tickets || [];
    },
  });

  // Sort tickets by newest first (createdAt descending) & Apply Filters
  const filteredAndSortedTickets = useMemo(() => {
    // 1. Copy array and sort newest first (createdAt desc)
    const sorted = [...rawTickets].sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return timeB - timeA; // Newest first
    });

    // 2. Filter by search term and status
    return sorted.filter((ticket) => {
      const matchesSearch =
        ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.senderEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.body.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || ticket.status.toLowerCase() === statusFilter.toLowerCase();

      const matchesCategory =
        categoryFilter === "all" ||
        (ticket.category && ticket.category.toLowerCase() === categoryFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [rawTickets, searchTerm, statusFilter, categoryFilter]);

  // Statistics calculation
  const totalTicketsCount = rawTickets.length;
  const openCount = rawTickets.filter((t) => t.status.toLowerCase() === TicketStatus.OPEN).length;
  const resolvedCount = rawTickets.filter((t) => t.status.toLowerCase() === TicketStatus.RESOLVED).length;
  const closedCount = rawTickets.filter((t) => t.status.toLowerCase() === TicketStatus.CLOSED).length;

  const getStatusBadgeStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case TicketStatus.OPEN:
        return "bg-blue-100 text-blue-800 border-blue-200";
      case TicketStatus.IN_PROGRESS:
        return "bg-amber-100 text-amber-800 border-amber-200";
      case TicketStatus.RESOLVED:
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case TicketStatus.CLOSED:
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Support Tickets</h1>
          <p className="text-gray-500 mt-1">View, track, and manage incoming support tickets (sorted newest first).</p>
        </div>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ["tickets"] })}
          className="self-start md:self-auto bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm border border-gray-300"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh List
        </button>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Total Tickets</span>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalTicketsCount}</h3>
          </div>
          <div className="p-3 bg-gray-100 rounded-lg text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Open Tickets</span>
            <h3 className="text-2xl font-bold text-blue-900 mt-1">{openCount}</h3>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-600 font-semibold uppercase tracking-wider">Resolved</span>
            <h3 className="text-2xl font-bold text-emerald-900 mt-1">{resolvedCount}</h3>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Closed</span>
            <h3 className="text-2xl font-bold text-gray-700 mt-1">{closedCount}</h3>
          </div>
          <div className="p-3 bg-gray-100 rounded-lg text-gray-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search Bar */}
        <div className="relative w-full md:w-96">
          <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by subject, sender name, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div>
            <label className="text-xs text-gray-500 font-medium mr-2">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value={TicketStatus.OPEN}>Open</option>
              <option value={TicketStatus.IN_PROGRESS}>In Progress</option>
              <option value={TicketStatus.RESOLVED}>Resolved</option>
              <option value={TicketStatus.CLOSED}>Closed</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500 font-medium mr-2">Category:</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Categories</option>
              <option value={TicketCategory.GENERAL_QUESTION}>General question</option>
              <option value={TicketCategory.TECHNICAL_QUESTION}>Technical question</option>
              <option value={TicketCategory.REFUND_REQUEST}>Refund request</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Ticket Table Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="animate-pulse p-6 space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        ) : queryError ? (
          <div className="p-8 text-center">
            <p className="text-red-600 font-medium">❌ {queryError instanceof Error ? queryError.message : "Failed to load support tickets."}</p>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ["tickets"] })}
              className="mt-3 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm text-gray-700 transition-colors border border-gray-300"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Sender</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAndSortedTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                    {/* ID */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700">
                      #{ticket.id}
                    </td>

                    {/* Subject & Body snippet */}
                    <td className="px-6 py-4">
                      <div className="max-w-md">
                        <div className="text-sm font-semibold text-gray-900 truncate" title={ticket.subject}>
                          {ticket.subject}
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-0.5" title={ticket.body}>
                          {ticket.body}
                        </p>
                      </div>
                    </td>

                    {/* Sender Info */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{ticket.senderName}</div>
                      <div className="text-xs text-gray-500">{ticket.senderEmail}</div>
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4 whitespace-nowrap text-xs">
                      {ticket.category ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md font-medium bg-purple-50 text-purple-700 border border-purple-200">
                          {ticket.category}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Uncategorized</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4 whitespace-nowrap text-xs">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-semibold border ${getStatusBadgeStyle(ticket.status)}`}>
                        {ticket.status.toUpperCase()}
                      </span>
                    </td>

                    {/* Created Date (Newest First) */}
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 text-right">
                      {new Date(ticket.createdAt).toLocaleString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredAndSortedTickets.length === 0 && (
              <div className="p-8 text-center text-gray-500 text-sm">
                No support tickets found matching your filters.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
