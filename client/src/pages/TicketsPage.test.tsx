import { screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, type Mocked } from "vitest";
import axios from "axios";
import TicketsPage from "./TicketsPage";
import { renderWithQuery } from "../test/test-utils";

// Mock axios
vi.mock("axios");
const mockedAxios = axios as Mocked<typeof axios>;

const mockTickets = [
  {
    id: 1,
    subject: "Older Ticket",
    body: "First ticket body",
    senderName: "User One",
    senderEmail: "user1@example.com",
    status: "open",
    category: "General question",
    createdAt: "2026-08-16T10:00:00Z",
  },
  {
    id: 2,
    subject: "Newer Ticket",
    body: "Second ticket body",
    senderName: "User Two",
    senderEmail: "user2@example.com",
    status: "open",
    category: "Technical question",
    createdAt: "2026-08-17T12:00:00Z",
  },
];

describe("TicketsPage Component Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the page header and summary stats cards", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { tickets: mockTickets } });
    renderWithQuery(<TicketsPage />);

    expect(screen.getByText("Support Tickets")).toBeInTheDocument();
    expect(screen.getByText("View, track, and manage incoming support tickets (sorted newest first).")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Newer Ticket")).toBeInTheDocument();
    });

    expect(screen.getByText("Total Tickets")).toBeInTheDocument();
    expect(screen.getByText("Open Tickets")).toBeInTheDocument();
    expect(screen.getAllByText("Resolved")[0]).toBeInTheDocument();
  });

  it("sorts tickets by newest first (createdAt descending)", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { tickets: mockTickets } });
    renderWithQuery(<TicketsPage />);

    await waitFor(() => {
      expect(screen.getByText("Newer Ticket")).toBeInTheDocument();
    });

    const rows = screen.getAllByRole("row");
    // Row 0 is the table header, Row 1 should be the newest ticket (#2), Row 2 should be older ticket (#1)
    expect(rows[1]).toHaveTextContent("Newer Ticket");
    expect(rows[2]).toHaveTextContent("Older Ticket");
  });

  it("displays loading skeleton state", () => {
    mockedAxios.get.mockReturnValueOnce(new Promise(() => {}));
    const { container } = renderWithQuery(<TicketsPage />);

    const skeleton = container.querySelector(".animate-pulse");
    expect(skeleton).toBeInTheDocument();
  });

  it("displays error state on query failure", async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error("Network Error"));
    renderWithQuery(<TicketsPage />);

    await waitFor(() => {
      expect(screen.getByText("❌ Network Error")).toBeInTheDocument();
    });
  });
});
