import React from "react";

export interface TicketDetailData {
  id: number;
  subject: string;
  body: string;
  senderEmail: string;
  senderName: string;
  createdAt: string;
  status?: string;
  category?: string | null;
}

interface TicketDetailProps {
  ticket: TicketDetailData;
}

export const TicketDetail: React.FC<TicketDetailProps> = ({ ticket }) => {
  return (
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
  );
};

export default TicketDetail;
