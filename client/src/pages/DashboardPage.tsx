import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Link } from "react-router-dom";

export interface DailyTicketItem {
  date: string;
  label: string;
  count: number;
}

export interface TicketStats {
  totalTickets: number;
  openTickets: number;
  aiResolvedTickets: number;
  aiResolvedPercentage: number;
  avgResolutionTimeMs: number;
  formattedAvgResolutionTime: string;
  dailyTickets?: DailyTicketItem[];
}

const API_URL = import.meta.env.VITE_API_URL || "";

export default function DashboardPage() {
  const { data: stats, isLoading, error, refetch, isRefetching } = useQuery<TicketStats>({
    queryKey: ["ticketStats"],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/api/tickets/stats`, {
        withCredentials: true,
      });
      return res.data;
    },
    refetchInterval: 10000, // Auto-refresh stats every 10s
  });

  const total = stats?.totalTickets || 0;
  const open = stats?.openTickets || 0;
  const aiResolved = stats?.aiResolvedTickets || 0;
  const aiPercentage = stats?.aiResolvedPercentage || 0;
  const avgTime = stats?.formattedAvgResolutionTime || "0s";
  const dailyTickets = stats?.dailyTickets || [];

  const maxDailyCount = dailyTickets.reduce((max, d) => Math.max(max, d.count), 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] p-6 md:p-10 font-sans text-slate-800 dark:text-slate-100 transition-colors">
      {/* Header Bar */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-2.5 rounded-2xl shadow-md">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </span>
            Helpdesk Analytics Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time insights on ticket volume, AI auto-resolutions, and support performance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
          >
            <svg className={`w-4 h-4 ${isRefetching ? "animate-spin text-blue-600" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <Link
            to="/tickets"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-md hover:shadow-lg transition flex items-center gap-1.5"
          >
            View Ticket Queue <span>→</span>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-36 bg-slate-200 rounded-2xl"></div>
            ))}
          </div>
          <div className="h-64 bg-slate-200 rounded-3xl"></div>
        </div>
      ) : error ? (
        <div className="max-w-7xl mx-auto bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl">
          Failed to load dashboard statistics. Please make sure the backend server is running.
        </div>
      ) : (
        <div className="max-w-7xl mx-auto space-y-8">
          {/* SECTION 1: Top 5 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {/* Card 1: Total Tickets */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition"></div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Tickets</span>
                <span className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </span>
              </div>
              <div className="text-3xl font-extrabold text-slate-900">{total}</div>
              <p className="text-xs text-slate-500 mt-1">Total received tickets</p>
            </div>

            {/* Card 2: Open Tickets */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition"></div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Open Tickets</span>
                <span className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </span>
              </div>
              <div className="text-3xl font-extrabold text-amber-600">{open}</div>
              <p className="text-xs text-slate-500 mt-1">Awaiting human agent action</p>
            </div>

            {/* Card 3: AI Resolved Tickets */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition"></div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Resolved by AI</span>
                <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </span>
              </div>
              <div className="text-3xl font-extrabold text-emerald-600">{aiResolved}</div>
              <p className="text-xs text-slate-500 mt-1">Auto-resolved via KB</p>
            </div>

            {/* Card 4: % Resolved by AI */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition"></div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">AI Resolution %</span>
                <span className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </span>
              </div>
              <div className="text-3xl font-extrabold text-indigo-600">{aiPercentage}%</div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, aiPercentage))}%` }}
                ></div>
              </div>
            </div>

            {/* Card 5: Avg Resolution Time */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition"></div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Avg Resolution</span>
                <span className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </div>
              <div className="text-3xl font-extrabold text-slate-900">{avgTime}</div>
              <p className="text-xs text-slate-500 mt-1">Average time to resolve</p>
            </div>
          </div>

          {/* SECTION 2: Automated AI Agent Workflow & Quick Actions (Original Position) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Automation Highlights */}
            <div className="lg:col-span-2 bg-[#E8EEFF] border border-[#C9D7FF] rounded-3xl p-7 shadow-sm relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl"></div>
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 bg-blue-100 border border-blue-200 text-blue-700 text-xs px-3 py-1 rounded-full font-medium mb-4">
                  <span>✨</span> AI Automation Active
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Automated AI Agent Workflow</h2>
                <p className="text-slate-600 text-sm max-w-xl mb-6">
                  Every incoming ticket starts automatically assigned to the <strong className="text-slate-900 font-semibold">AI Agent</strong> upon arrival for instant Knowledge Base evaluation. If matched, tickets are auto-resolved with personalized answers. If unmatched, tickets are automatically unassigned and moved to the human agent queue.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-[#C9D7FF] pt-6">
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Initial Assignment</div>
                    <div className="text-base font-semibold text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span> AI Agent
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Unmatch Behavior</div>
                    <div className="text-base font-semibold text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span> Unassigned to Human Queue
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Queue Privacy</div>
                    <div className="text-base font-semibold text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Hidden from Main List
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions & Navigation */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Quick Actions
                </h3>

                <div className="space-y-3">
                  <Link
                    to="/tickets"
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-blue-50/50 border border-slate-200/60 transition group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="p-2 rounded-xl bg-blue-100 text-blue-700">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition">
                          Human Agent Queue
                        </div>
                        <div className="text-xs text-slate-500">{open} open tickets awaiting response</div>
                      </div>
                    </div>
                    <span className="text-slate-400 group-hover:translate-x-1 transition font-bold">→</span>
                  </Link>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center gap-3">
                    <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Knowledge Base Active</div>
                      <div className="text-xs text-slate-500">4 article topics loaded for auto-resolution</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-400 text-center">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>

          {/* SECTION 3: 30-Day Daily Ticket Volume Bar Chart (Shifted to Bottom) */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </span>
                  <h2 className="text-xl font-bold text-slate-900">Tickets per Day (Past 30 Days)</h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">Total tickets created per day over the last 30-day period</p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium">30-Day Total:</span>
                  <span className="font-bold text-slate-900">{dailyTickets.reduce((sum, d) => sum + d.count, 0)} tickets</span>
                </div>
                <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 text-blue-700">
                  <span className="font-medium">Peak Single Day:</span>
                  <span className="font-bold">{maxDailyCount} tickets</span>
                </div>
              </div>
            </div>

            {/* Bar Chart Canvas */}
            <div className="relative pt-6 pb-2">
              <div className="h-48 flex items-end justify-between gap-1.5 md:gap-2">
                {dailyTickets.map((d, idx) => {
                  const heightPercent = maxDailyCount > 0 ? Math.max(8, (d.count / maxDailyCount) * 100) : 8;
                  const isToday = idx === dailyTickets.length - 1;

                  return (
                    <div
                      key={d.date}
                      className="flex-1 flex flex-col items-center h-full justify-end group relative"
                    >
                      {/* Hover Tooltip */}
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-20 bg-slate-900 text-white text-xs py-1 px-2.5 rounded-lg shadow-xl whitespace-nowrap">
                        <span className="font-semibold text-blue-300">{d.label}:</span> {d.count} {d.count === 1 ? "ticket" : "tickets"}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                      </div>

                      {/* Count Badge on Top of Bar */}
                      {d.count > 0 && (
                        <span className="text-[10px] font-bold text-slate-500 mb-1 opacity-80 group-hover:opacity-100 group-hover:text-blue-600 transition">
                          {d.count}
                        </span>
                      )}

                      {/* Bar Fill */}
                      <div
                        className={`w-full rounded-t-lg transition-all duration-300 ${
                          isToday
                            ? "bg-gradient-to-t from-blue-600 to-indigo-500 shadow-md group-hover:from-blue-500 group-hover:to-indigo-400"
                            : d.count > 0
                            ? "bg-gradient-to-t from-blue-500/80 to-indigo-500/80 group-hover:from-blue-600 group-hover:to-indigo-600"
                            : "bg-slate-100 group-hover:bg-slate-200"
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      ></div>
                    </div>
                  );
                })}
              </div>

              {/* X-Axis Date Labels */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
                <span>{dailyTickets[0]?.label}</span>
                <span className="hidden sm:inline">{dailyTickets[7]?.label}</span>
                <span>{dailyTickets[15]?.label}</span>
                <span className="hidden sm:inline">{dailyTickets[22]?.label}</span>
                <span className="font-bold text-blue-600">{dailyTickets[29]?.label}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
