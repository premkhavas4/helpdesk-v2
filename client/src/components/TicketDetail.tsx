import React, { useState } from "react";
import axios from "axios";

export interface TicketDetailData {
  id: number;
  subject: string;
  body: string;
  senderEmail: string;
  senderName: string;
  createdAt: string;
  status?: string;
  category?: string | null;
  replies?: Array<{
    id: string;
    message: string;
    senderType?: string;
    sentAt: string;
  }>;
}

interface TicketDetailProps {
  ticket: TicketDetailData;
}

const API_URL = import.meta.env.VITE_API_URL || "";

export const TicketDetail: React.FC<TicketDetailProps> = ({ ticket }) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const handleSummarize = async () => {
    try {
      setIsSummarizing(true);
      const res = await axios.post(`${API_URL}/api/ai/summarize`, {
        ticketSubject: ticket.subject,
        ticketBody: ticket.body,
        replies: ticket.replies || [],
      });
      if (res.data?.summary) {
        setSummary(res.data.summary);
      }
    } catch (err) {
      console.error("Failed to summarize ticket:", err);
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm space-y-6">
      <div className="border-b border-gray-100 dark:border-slate-700 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-snug">{ticket.subject}</h1>
      </div>

      {/* Sender & Timestamp Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-gray-50 dark:bg-slate-900/60 p-4 rounded-lg border border-gray-100 dark:border-slate-700">
        <div>
          <span className="text-xs text-gray-500 dark:text-slate-400 font-semibold uppercase tracking-wider block">Sender Name</span>
          <span className="font-semibold text-gray-900 dark:text-slate-100 block mt-0.5">{ticket.senderName}</span>
        </div>
        <div>
          <span className="text-xs text-gray-500 dark:text-slate-400 font-semibold uppercase tracking-wider block">Sender Email</span>
          <span className="font-medium text-blue-600 dark:text-blue-400 select-all block mt-0.5">{ticket.senderEmail}</span>
        </div>
        <div className="sm:col-span-2 border-t border-gray-200/60 dark:border-slate-700 pt-3">
          <span className="text-xs text-gray-500 dark:text-slate-400 font-semibold uppercase tracking-wider block">Created Date</span>
          <span className="text-gray-700 dark:text-slate-300 text-xs font-medium block mt-0.5">
            {new Date(ticket.createdAt).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </span>
        </div>
      </div>

      {/* Ticket Message Body */}
      <div className="space-y-3">
        <h3 className="text-xs text-gray-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Message Body</h3>
        <div className="p-5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-800 dark:text-slate-200 text-sm whitespace-pre-wrap leading-relaxed shadow-inner">
          {ticket.body}
        </div>

        {/* Summarize Button with Sparkles Icon Below Message */}
        <div className="pt-1 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSummarize}
            disabled={isSummarizing}
            className="inline-flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold px-3.5 py-2 rounded-lg transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSummarizing ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-indigo-700 dark:text-indigo-300" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Summarizing...
              </>
            ) : (
              <>
                ✨ Summarize
              </>
            )}
          </button>
        </div>

        {/* Generated Summary Display Box */}
        {summary && (
          <div className="mt-3 p-4 bg-indigo-50/60 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-xl space-y-1.5 text-sm text-indigo-950 dark:text-indigo-200 shadow-sm animate-fade-in">
            <div className="flex items-center gap-1.5 text-indigo-800 dark:text-indigo-300 font-bold text-xs uppercase tracking-wider">
              <span>✨ Ticket & Conversation Summary</span>
            </div>
            <div className="whitespace-pre-wrap text-xs leading-relaxed text-indigo-900 dark:text-indigo-200 font-medium">
              {summary}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketDetail;
