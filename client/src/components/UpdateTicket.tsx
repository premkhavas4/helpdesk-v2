import React from "react";
import { TicketStatus, TicketCategory } from "../../../core/src/schemas/ticket";

export interface AgentUser {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export interface UpdateTicketProps {
  ticket: {
    id: number;
    status: string;
    category?: string | null;
    assignedTo?: string | null;
  };
  agents: AgentUser[];
  onUpdateStatus: (status: string) => void;
  onUpdateCategory: (category: string | null) => void;
  onAssignAgent: (assignedTo: string | null) => void;
  isUpdating?: boolean;
}

export const UpdateTicket: React.FC<UpdateTicketProps> = ({
  ticket,
  agents,
  onUpdateStatus,
  onUpdateCategory,
  onAssignAgent,
  isUpdating = false,
}) => {
  const currentStatus = ticket.status.toLowerCase();

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
      <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
          />
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
          disabled={isUpdating}
          onChange={(e) => onUpdateStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-xs font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm w-full disabled:opacity-50"
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
          disabled={isUpdating}
          onChange={(e) => onUpdateCategory(e.target.value || null)}
          className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-xs font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer shadow-sm w-full disabled:opacity-50"
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
          disabled={isUpdating}
          onChange={(e) => onAssignAgent(e.target.value || null)}
          className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-xs font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm w-full disabled:opacity-50"
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
  );
};

export default UpdateTicket;
