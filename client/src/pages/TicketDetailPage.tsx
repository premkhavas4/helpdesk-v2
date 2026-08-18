import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatAgents } from "../../../core/src/utils/formatAgents";
import { TicketDetail as TicketDetailCard } from "../components/TicketDetail";
import { UpdateTicket } from "../components/UpdateTicket";

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
    bodyHtml?: string | null;
    senderType?: string;
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
  const agents = useMemo(() => formatAgents(rawAgentsList), [rawAgentsList]);

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

  const [replyMessage, setReplyMessage] = useState("");
  const [senderType, setSenderType] = useState<"agent" | "customer">("agent");

  const addReplyMutation = useMutation({
    mutationFn: async ({ message, senderType }: { message: string; senderType: "agent" | "customer" }) => {
      const res = await axios.post(
        `${API_URL}/api/tickets/${id}/replies`,
        { message, senderType },
        { withCredentials: true }
      );
      return res.data;
    },
    onSuccess: () => {
      setReplyMessage("");
      queryClient.invalidateQueries({ queryKey: ["ticket", id] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;
    addReplyMutation.mutate({ message: replyMessage.trim(), senderType });
  };

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
          <TicketDetailCard ticket={ticket} />

          {/* Reply Thread & Reply Form */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center justify-between">
              <span>Reply Thread</span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                {ticket.replies?.length || 0} {ticket.replies?.length === 1 ? "Reply" : "Replies"}
              </span>
            </h2>

            {/* Existing Reply Thread List */}
            {ticket.replies && ticket.replies.length > 0 ? (
              <div className="space-y-4">
                {ticket.replies.map((reply) => {
                  const isCustomer = reply.senderType === "customer";
                  const senderDisplayName = isCustomer
                    ? ticket.senderName || "Customer"
                    : reply.agent?.name || "Support Agent";

                  return (
                    <div
                      key={reply.id}
                      className={`p-4 rounded-lg space-y-2 border-l-4 border ${
                        isCustomer
                          ? "bg-emerald-50/50 border-emerald-200 border-l-emerald-500"
                          : "bg-blue-50/50 border-blue-200 border-l-blue-500"
                      }`}
                    >
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                              isCustomer
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {senderDisplayName.charAt(0).toUpperCase()}
                          </span>
                          <span className="font-semibold text-gray-900">{senderDisplayName}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isCustomer
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {isCustomer ? "Customer" : "Agent"}
                          </span>
                        </div>
                        <span className="text-gray-500">
                          {reply.sentAt
                            ? new Date(reply.sentAt).toLocaleString(undefined, {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })
                            : ""}
                        </span>
                      </div>
                      {reply.bodyHtml ? (
                        <div
                          className="text-sm text-gray-800 pl-8 prose max-w-none"
                          dangerouslySetInnerHTML={{ __html: reply.bodyHtml }}
                        />
                      ) : (
                        <p className="text-sm text-gray-800 whitespace-pre-wrap pl-8">{reply.message}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-400 text-sm bg-gray-50 rounded-lg border border-dashed border-gray-200">
                No replies yet. Use the form below to post the first reply.
              </div>
            )}

            {/* Submit New Reply Form */}
            <form onSubmit={handleReplySubmit} className="pt-4 border-t border-gray-100 space-y-4">
              <div className="flex items-center justify-between">
                <label htmlFor="replyInput" className="text-xs text-gray-500 font-semibold uppercase tracking-wider block">
                  Add a Reply
                </label>

                {/* Sender Type Selector */}
                <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200">
                  <button
                    type="button"
                    onClick={() => setSenderType("agent")}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                      senderType === "agent"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Agent Reply
                  </button>
                  <button
                    type="button"
                    onClick={() => setSenderType("customer")}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                      senderType === "customer"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Customer Reply
                  </button>
                </div>
              </div>

              <textarea
                id="replyInput"
                rows={4}
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder={
                  senderType === "customer"
                    ? "Type customer response here..."
                    : "Type agent reply message here..."
                }
                className="w-full p-3 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y"
              ></textarea>

              {addReplyMutation.isError && (
                <div className="text-xs text-red-600 font-medium">
                  Failed to send reply. Please try again.
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!replyMessage.trim() || addReplyMutation.isPending}
                  className={`inline-flex items-center gap-2 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                    senderType === "customer"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {addReplyMutation.isPending
                    ? "Sending..."
                    : `Submit as ${senderType === "customer" ? "Customer" : "Agent"}`}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Ticket Settings Sidebar (col-span-1) */}
        <div className="lg:col-span-1 space-y-6 sticky top-6">
          <UpdateTicket
            ticket={ticket}
            agents={agents}
            onUpdateStatus={(newStatus) => updateTicketMutation.mutate({ ticketId: ticket.id, status: newStatus })}
            onUpdateCategory={(newCategory) => updateTicketMutation.mutate({ ticketId: ticket.id, category: newCategory })}
            onAssignAgent={(newAgentId) => assignTicketMutation.mutate({ ticketId: ticket.id, assignedTo: newAgentId })}
            isUpdating={updateTicketMutation.isPending || assignTicketMutation.isPending}
          />
        </div>
      </div>
    </div>
  );
}
