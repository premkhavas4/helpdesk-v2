import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { TicketStatus } from "../../../core/src/schemas/ticket";

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
  assignedUser?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
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

  let statusBadgeStyle = "bg-gray-100 text-gray-800 border-gray-200";
  switch (ticket.status.toLowerCase()) {
    case TicketStatus.OPEN:
      statusBadgeStyle = "bg-blue-100 text-blue-800 border-blue-200";
      break;
    case TicketStatus.IN_PROGRESS:
      statusBadgeStyle = "bg-amber-100 text-amber-800 border-amber-200";
      break;
    case TicketStatus.RESOLVED:
      statusBadgeStyle = "bg-emerald-100 text-emerald-800 border-emerald-200";
      break;
    case TicketStatus.CLOSED:
      statusBadgeStyle = "bg-gray-100 text-gray-700 border-gray-200";
      break;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
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

      {/* Main Ticket Header Card */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <h1 className="text-2xl font-bold text-gray-900 leading-snug">{ticket.subject}</h1>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusBadgeStyle}`}>
              {ticket.status.toUpperCase()}
            </span>
            {ticket.category && (
              <span className="px-3 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                {ticket.category}
              </span>
            )}
          </div>
        </div>

        {/* Sender & Timestamp Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm bg-gray-50 p-4 rounded-lg border border-gray-100">
          <div>
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block">Sender Name</span>
            <span className="font-semibold text-gray-900">{ticket.senderName}</span>
          </div>
          <div>
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block">Sender Email</span>
            <span className="font-medium text-blue-600 select-all">{ticket.senderEmail}</span>
          </div>
          <div>
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block">Created Date</span>
            <span className="text-gray-700">
              {new Date(ticket.createdAt).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          </div>
        </div>

        {/* Ticket Message Body */}
        <div className="pt-2">
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
  );
}
