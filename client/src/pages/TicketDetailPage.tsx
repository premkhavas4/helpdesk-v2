import { useParams, Link, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TicketStatus, TicketCategory } from "../../../core/src/schemas/ticket";

export interface AgentUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface TicketDetail {
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
  assignedUser?: AgentUser | null;
  replies?: Array<{
    id: string;
    message: string;
    sentAt: string;
    agent?: {
      id: string;
      name: string;
      email: string;
    } | null;
  }>;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: ticket, isLoading, error } = useQuery<TicketDetail>({
    queryKey: ["ticket", id],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/api/tickets/${id}`, {
        withCredentials: true,
      });
      return res.data.ticket;
    },
    enabled: !!id,
  });

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
  const agents = useMemo(() => {
    const formattedMap = new Map<string, AgentUser>();
    for (const agent of rawAgentsList) {
      let displayName = agent.name;
      const lowerName = agent.name.toLowerCase();
      const lowerEmail = agent.email.toLowerCase();

      if (lowerName.includes("admin") || lowerEmail.includes("admin")) {
        displayName = "Admin";
      } else if (lowerName.includes("one") || lowerName.includes("1") || lowerEmail.includes("agent1")) {
        displayName = "Agent 1";
      } else if (lowerName.includes("two") || lowerName.includes("2") || lowerEmail.includes("agent2")) {
        displayName = "Agent 2";
      } else if (lowerName.includes("test") || lowerEmail.includes("test")) {
        displayName = "Test User";
      }

      if (!formattedMap.has(displayName)) {
        formattedMap.set(displayName, { ...agent, name: displayName });
      }
    }
    return Array.from(formattedMap.values());
  }, [rawAgentsList]);

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
      queryClient.invalidateQueries({ queryKey: ["ticket", id] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });

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
      queryClient.invalidateQueries({ queryKey: ["ticket", id] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
        <div className="h-8 bg-gray-200 rounded w-3/4"></div>
        <div className="h-64 bg-gray-100 rounded-xl"></div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center">
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-600 font-semibold text-lg">❌ Ticket not found</p>
          <p className="text-gray-600 text-sm mt-1">The requested ticket #{id} could not be found or failed to load.</p>
          <button
            onClick={() => navigate("/tickets")}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
          >
            ← Back to Tickets List
          </button>
        </div>
      </div>
    );
  }

  const currentStatus = ticket.status.toLowerCase();

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Back Button & Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/tickets"
          className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Tickets List
        </Link>
        <span className="text-xs text-gray-400 font-mono">Ticket #{ticket.id}</span>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Ticket Details & Main Content (col-span-2) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <h1 className="text-2xl font-bold text-gray-900 leading-snug">{ticket.subject}</h1>
            </div>

            {/* Sender & Timestamp Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div>
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block">Sender Name</span>
                <span className="font-semibold text-gray-900 block mt-0.5">{ticket.senderName}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block">Sender Email</span>
                <span className="font-medium text-blue-600 select-all block mt-0.5">{ticket.senderEmail}</span>
              </div>
              <div className="sm:col-span-2 border-t border-gray-200/60 pt-3">
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block">Created Date</span>
                <span className="text-gray-700 text-xs font-medium block mt-0.5">
                  {new Date(ticket.createdAt).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>
            </div>

            {/* Ticket Message Body */}
            <div>
              <h3 className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Message Body</h3>
              <div className="p-5 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm whitespace-pre-wrap leading-relaxed shadow-inner">
                {ticket.body}
              </div>
            </div>
          </div>

          {/* Ticket Replies Section if present */}
          {ticket.replies && ticket.replies.length > 0 && (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
                Replies ({ticket.replies.length})
              </h3>
              <div className="space-y-4">
                {ticket.replies.map((reply) => (
                  <div key={reply.id} className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span className="font-semibold text-gray-900">
                        {reply.agent?.name || "Agent Support"}
                      </span>
                      <span>{new Date(reply.sentAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{reply.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: All Drop-down Lists Sidebar (col-span-1) */}
        <div className="lg:col-span-1 space-y-6 sticky top-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Ticket Settings
            </h2>

            {/* Status Dropdown */}
            <div>
              <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-1.5">
                Status
              </label>
              <select
                value={currentStatus}
                onChange={(e) => {
                  const newStatus = e.target.value;
                  updateTicketMutation.mutate({ ticketId: ticket.id, status: newStatus });
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-xs font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm w-full"
              >
                <option value={TicketStatus.OPEN}>OPEN</option>
                <option value={TicketStatus.IN_PROGRESS}>IN_PROGRESS</option>
                <option value={TicketStatus.RESOLVED}>RESOLVED</option>
                <option value={TicketStatus.CLOSED}>CLOSED</option>
              </select>
            </div>

            {/* Category Dropdown */}
            <div>
              <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-1.5">
                Category
              </label>
              <select
                value={ticket.category || ""}
                onChange={(e) => {
                  const newCategory = e.target.value || null;
                  updateTicketMutation.mutate({ ticketId: ticket.id, category: newCategory });
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-xs font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer shadow-sm w-full"
              >
                <option value="">Uncategorized</option>
                <option value={TicketCategory.GENERAL_QUESTION}>{TicketCategory.GENERAL_QUESTION}</option>
                <option value={TicketCategory.TECHNICAL_QUESTION}>{TicketCategory.TECHNICAL_QUESTION}</option>
                <option value={TicketCategory.REFUND_REQUEST}>{TicketCategory.REFUND_REQUEST}</option>
              </select>
            </div>

            {/* Assigned Agent Dropdown */}
            <div>
              <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-1.5">
                Assigned Agent
              </label>
              <select
                value={ticket.assignedTo || ""}
                onChange={(e) => {
                  const newAgentId = e.target.value || null;
                  assignTicketMutation.mutate({ ticketId: ticket.id, assignedTo: newAgentId });
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-xs font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm w-full"
              >
                <option value="">Unassigned</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
