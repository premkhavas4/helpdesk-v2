import { screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, type Mocked } from "vitest";
import axios from "axios";
import TicketsPage from "./TicketsPage";
import { renderWithQuery } from "../test/test-utils";

// Mock axios
vi.mock("axios");
const mockedAxios = axios as Mocked<typeof axios>;

const mockTickets = [
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
];

describe("TicketsPage Component Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the page header, TanStack table, and summary stats cards", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { tickets: mockTickets } });
    renderWithQuery(<TicketsPage />);

    expect(screen.getByText("Support Tickets")).toBeInTheDocument();
    expect(screen.getByText(/View, sort, and manage support tickets with TanStack Table/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Newer Ticket")).toBeInTheDocument();
    });

    expect(screen.getByText("Total Tickets")).toBeInTheDocument();
    expect(screen.getByText("Open Tickets")).toBeInTheDocument();
    expect(screen.getAllByText("Resolved")[0]).toBeInTheDocument();
  });

  it("fetches tickets with server-side sorting parameters (default: sortBy=createdAt&sortOrder=desc)", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { tickets: mockTickets } });
    renderWithQuery(<TicketsPage />);

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        "http://localhost:3000/api/tickets",
        expect.objectContaining({
          params: expect.objectContaining({
            sortBy: "createdAt",
            sortOrder: "desc",
          }),
        })
      );
    });
  });

  it("toggles column sorting and triggers server-side sort request", async () => {
    mockedAxios.get.mockResolvedValue({ data: { tickets: mockTickets } });
    renderWithQuery(<TicketsPage />);

    await waitFor(() => {
      expect(screen.getByText("Subject")).toBeInTheDocument();
    });

    // Click Subject column header to toggle sorting
    fireEvent.click(screen.getByText("Subject"));

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        "http://localhost:3000/api/tickets",
        expect.objectContaining({
          params: expect.objectContaining({
            sortBy: "subject",
            sortOrder: "asc",
          }),
        })
      );
    });
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
