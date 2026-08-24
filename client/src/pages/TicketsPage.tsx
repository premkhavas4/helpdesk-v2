import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type PaginationState,
} from "@tanstack/react-table";
import { TicketStatus, TicketCategory } from "../../../core/src/schemas/ticket";
import { formatAgents } from "../../../core/src/utils/formatAgents";

export interface AgentUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface TicketItem {
  id: number;
  subject: string;
  body: string;
  senderEmail: string;
  senderName: string;
  status: string;
  category?: string | null;
  assignedTo?: string | null;
  assignedUser?: AgentUser | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface TicketsApiResponse {
  tickets: TicketItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const API_URL = import.meta.env.VITE_API_URL || "";
const columnHelper = createColumnHelper<TicketItem>();

export default function TicketsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // TanStack Table Sorting state (default: highest ID first / id desc)
  const [sorting, setSorting] = useState<SortingState>([
    { id: "id", desc: true },
  ]);

  // TanStack Table Pagination state (default: pageIndex 0, pageSize 10)
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const pagination = useMemo(() => ({ pageIndex, pageSize }), [pageIndex, pageSize]);

  // Fetch active agents for assignment dropdowns
  const { data: agentsData } = useQuery<{ agents: AgentUser[] }>({
    queryKey: ["agents"],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/api/tickets/agents`, {
        withCredentials: true,
      });
      return res.data;
    },
  });

  const rawAgentsList = useMemo(() => agentsData?.agents || [], [agentsData]);
  const agents = useMemo(() => formatAgents(rawAgentsList), [rawAgentsList]);

  // Mutation to assign or unassign a ticket
  const assignTicketMutation = useMutation({
    mutationFn: async ({ ticketId, assignedTo }: { ticketId: number; assignedTo: string | null }) => {
      const res = await axios.patch(
        `${API_URL}/api/tickets/${ticketId}/assign`,
        { assignedTo },
        { withCredentials: true }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });

  // Mutation to update ticket status or category
  const updateTicketMutation = useMutation({
    mutationFn: async ({
      ticketId,
      status,
      category,
    }: {
      ticketId: number;
      status?: string;
      category?: string | null;
    }) => {
      const res = await axios.patch(
        `${API_URL}/api/tickets/${ticketId}`,
        { status, category },
        { withCredentials: true }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });

  // Extract active sort field and direction for server-side query
  const activeSort = sorting[0];
  const sortBy = activeSort ? activeSort.id : "id";
  const sortOrder = activeSort ? (activeSort.desc ? "desc" : "asc") : "desc";

  // Fetch Tickets Query with Server-Side Sorting, Filtering & Pagination
  const { data, isLoading, error: queryError } = useQuery<TicketsApiResponse>({
    queryKey: ["tickets", { sortBy, sortOrder, searchTerm, statusFilter, categoryFilter, pageIndex, pageSize }],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/api/tickets`, {
        params: {
          sortBy,
          sortOrder,
          search: searchTerm || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          category: categoryFilter !== "all" ? categoryFilter : undefined,
          page: pageIndex + 1,
          pageSize,
        },
        withCredentials: true,
      });
      return res.data || { tickets: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 };
    },
  });

  const tickets = data?.tickets || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = data?.totalPages || 0;

  // Handlers for search/filter input change (reset to page 0)
  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const handleStatusChange = (val: string) => {
    setStatusFilter(val);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const handleCategoryChange = (val: string) => {
    setCategoryFilter(val);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  // Define TanStack Table Columns
  const columns = [
    columnHelper.accessor("id", {
      header: "ID",
      cell: (info) => <span className="font-semibold text-gray-700">#{info.getValue()}</span>,
    }),
    columnHelper.accessor("subject", {
      header: "Subject",
      cell: (info) => {
        const ticket = info.row.original;
        return (
          <div className="max-w-md">
            <Link
              to={`/tickets/${ticket.id}`}
              className="text-sm font-semibold text-gray-900 hover:underline truncate block"
              title={ticket.subject}
            >
              {ticket.subject}
            </Link>
            <p className="text-xs text-gray-500 truncate mt-0.5" title={ticket.body}>
              {ticket.body}
            </p>
          </div>
        );
      },
    }),
    columnHelper.accessor("senderName", {
      header: "Sender",
      cell: (info) => {
        const ticket = info.row.original;
        return (
          <div>
            <div className="text-sm font-medium text-gray-900">{ticket.senderName}</div>
            <div className="text-xs text-gray-500">{ticket.senderEmail}</div>
          </div>
        );
      },
    }),
    columnHelper.accessor("category", {
      header: "Category",
      cell: (info) => {
        const ticket = info.row.original;
        const category = ticket.category || "";

        return (
          <select
            value={category}
            onChange={(e) => {
              const newCategory = e.target.value || null;
              updateTicketMutation.mutate({ ticketId: ticket.id, category: newCategory });
            }}
            className="border border-purple-200 rounded px-2.5 py-1 bg-purple-50 text-xs font-medium text-purple-700 outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer shadow-sm"
          >
            <option value="">Uncategorized</option>
            <option value={TicketCategory.GENERAL_QUESTION}>{TicketCategory.GENERAL_QUESTION}</option>
            <option value={TicketCategory.TECHNICAL_QUESTION}>{TicketCategory.TECHNICAL_QUESTION}</option>
            <option value={TicketCategory.REFUND_REQUEST}>{TicketCategory.REFUND_REQUEST}</option>
          </select>
        );
      },
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => {
        const ticket = info.row.original;
        const status = ticket.status.toLowerCase();

        let selectBadgeStyle = "bg-gray-100 text-gray-800 border-gray-200";
        switch (status) {
          case TicketStatus.OPEN:
            selectBadgeStyle = "bg-blue-100 text-blue-800 border-blue-200";
            break;
          case TicketStatus.IN_PROGRESS:
            selectBadgeStyle = "bg-amber-100 text-amber-800 border-amber-200";
            break;
          case TicketStatus.RESOLVED:
            selectBadgeStyle = "bg-emerald-100 text-emerald-800 border-emerald-200";
            break;
          case TicketStatus.CLOSED:
            selectBadgeStyle = "bg-gray-100 text-gray-700 border-gray-200";
            break;
        }

        return (
          <select
            value={status}
            onChange={(e) => {
              const newStatus = e.target.value;
              updateTicketMutation.mutate({ ticketId: ticket.id, status: newStatus });
            }}
            className={`border rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm ${selectBadgeStyle}`}
          >
            <option value={TicketStatus.OPEN}>OPEN</option>
            <option value={TicketStatus.IN_PROGRESS}>IN_PROGRESS</option>
            <option value={TicketStatus.RESOLVED}>RESOLVED</option>
            <option value={TicketStatus.CLOSED}>CLOSED</option>
          </select>
        );
      },
    }),
    columnHelper.accessor("assignedTo", {
      header: "Assigned Agent",
      cell: (info) => {
        const ticket = info.row.original;
        const currentAssignedId = ticket.assignedTo || "";

        return (
          <select
            value={currentAssignedId}
            onChange={(e) => {
              const newAgentId = e.target.value || null;
              assignTicketMutation.mutate({ ticketId: ticket.id, assignedTo: newAgentId });
            }}
            className="border border-gray-300 rounded px-2 py-1 bg-white text-xs font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
          >
            <option value="">Unassigned</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
        );
      },
    }),
    columnHelper.accessor("createdAt", {
      header: "Created At",
      cell: (info) => (
        <span className="text-xs text-gray-500">
          {new Date(info.getValue()).toLocaleString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    }),
  ];

  // TanStack Table Instance (manualSorting & manualPagination enabled for server-side control)
  const table = useReactTable({
    data: tickets,
    columns,
    pageCount: totalPages,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    enableSortingRemoval: false, // Prevent clearing sort state on 3rd click (only toggle ASC <-> DESC)
    manualSorting: true,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
  });

  // Calculate quick summary metrics
  const totalTicketsCount = totalCount;
  const openCount = tickets.filter((t) => t.status.toLowerCase() === TicketStatus.OPEN).length;
  const resolvedCount = tickets.filter((t) => t.status.toLowerCase() === TicketStatus.RESOLVED).length;
  const closedCount = tickets.filter((t) => t.status.toLowerCase() === TicketStatus.CLOSED).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Support Tickets</h1>
          <p className="text-gray-500 mt-1">View, sort, and manage support tickets with server-side pagination.</p>
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
            <span className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Open (Current Page)</span>
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
            <span className="text-xs text-emerald-600 font-semibold uppercase tracking-wider">Resolved (Current Page)</span>
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
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Closed (Current Page)</span>
            <h3 className="text-2xl font-bold text-gray-700 mt-1">{closedCount}</h3>
          </div>
          <div className="p-3 bg-gray-100 rounded-lg text-gray-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by subject, sender, body..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div>
            <label className="text-xs text-gray-500 font-medium mr-2">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">Active Queue (Open & In Progress)</option>
              <option value={TicketStatus.NEW}>New</option>
              <option value={TicketStatus.PROCESSING}>Processing</option>
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
              onChange={(e) => handleCategoryChange(e.target.value)}
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

      {/* TanStack Table View */}
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
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {headerGroup.headers.map((header) => {
                      const isSorted = header.column.getIsSorted();
                      return (
                        <th
                          key={header.id}
                          onClick={header.column.getToggleSortingHandler()}
                          className="px-6 py-4 cursor-pointer select-none hover:bg-gray-100 transition-colors"
                          title="Click to sort by this column"
                        >
                          <div className="flex items-center gap-1.5">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {/* Sorting Icon indicator */}
                            <span className="text-gray-400 font-normal">
                              {isSorted === "asc" ? "▲" : isSorted === "desc" ? "▼" : "↕"}
                            </span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-200">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {table.getRowModel().rows.length === 0 && (
              <div className="p-8 text-center text-gray-500 text-sm">
                No support tickets found matching your filters.
              </div>
            )}

            {/* Pagination Controls Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span>
                  Showing{" "}
                  <span className="font-semibold text-gray-900">
                    {totalCount === 0 ? 0 : pageIndex * pageSize + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-gray-900">
                    {Math.min((pageIndex + 1) * pageSize, totalCount)}
                  </span>{" "}
                  of <span className="font-semibold text-gray-900">{totalCount}</span> tickets
                </span>
                <span className="text-gray-300">|</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    table.setPageSize(Number(e.target.value));
                  }}
                  className="border border-gray-300 rounded px-2 py-1 bg-white text-xs text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[10, 20, 25, 50, 100].map((size) => (
                    <option key={size} value={size}>
                      Show {size}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                  className="px-2.5 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium transition-colors"
                  title="First Page"
                >
                  « First
                </button>
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="px-2.5 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium transition-colors"
                  title="Previous Page"
                >
                  ‹ Prev
                </button>

                <span className="px-3 text-xs font-medium text-gray-700">
                  Page <span className="font-bold text-gray-900">{pageIndex + 1}</span> of{" "}
                  <span className="font-bold text-gray-900">{totalPages || 1}</span>
                </span>

                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="px-2.5 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium transition-colors"
                  title="Next Page"
                >
                  Next ›
                </button>
                <button
                  onClick={() => table.setPageIndex(totalPages - 1)}
                  disabled={!table.getCanNextPage()}
                  className="px-2.5 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium transition-colors"
                  title="Last Page"
                >
                  Last »
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

