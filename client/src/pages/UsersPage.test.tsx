import { screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import UsersPage from "./UsersPage";
import { renderWithQuery } from "../test/test-utils";

// Mock axios
vi.mock("axios");
const mockedAxios = axios as vi.Mocked<typeof axios>;

// Mock useAuth context hook
vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "admin-id", email: "admin@example.com", name: "Admin User", role: "admin" },
    loading: false,
  }),
}));

const mockUsers = [
  { id: "1", email: "admin@example.com", name: "Admin User", role: "admin", createdAt: "2026-08-16T12:00:00Z" },
  { id: "2", email: "agent1@example.com", name: "Agent One", role: "agent", createdAt: "2026-08-16T12:05:00Z" },
];

describe("UsersPage Component Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the page header and summary stats cards", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { users: mockUsers } });
    renderWithQuery(<UsersPage />);

    // Verify header exists
    expect(screen.getByText("User Management")).toBeInTheDocument();
    expect(screen.getByText("Manage team members, roles, and platform permissions.")).toBeInTheDocument();

    // Wait for the data to resolve and skeleton to hide
    await waitFor(() => {
      expect(screen.getByText("admin@example.com")).toBeInTheDocument();
    });

    // Check stats calculations
    expect(screen.getByText("Total Members")).toBeInTheDocument();
    expect(screen.getByText("Administrators")).toBeInTheDocument();
    expect(screen.getByText("Agents")).toBeInTheDocument();
  });

  it("displays the skeleton loader while fetching users", () => {
    // Return a pending promise so loading remains true
    mockedAxios.get.mockReturnValueOnce(new Promise(() => {}));
    const { container } = renderWithQuery(<UsersPage />);

    // The component should display skeleton loader container with animate-pulse class
    const skeleton = container.querySelector(".animate-pulse");
    expect(skeleton).toBeInTheDocument();
  });

  it("displays an error message when the API request fails", async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error("API Error"));
    renderWithQuery(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText("❌ API Error")).toBeInTheDocument();
    });
  });

  it("renders all users in a list table", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { users: mockUsers } });
    renderWithQuery(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText("Admin User")).toBeInTheDocument();
      expect(screen.getByText("agent1@example.com")).toBeInTheDocument();
      expect(screen.getByText("Agent One")).toBeInTheDocument();
    });
  });

  it("toggles the 'Add User' form when clicking the button", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { users: [] } });
    renderWithQuery(<UsersPage />);

    const addButton = screen.getByRole("button", { name: /Add User/i });
    expect(screen.queryByText("Create New Team Member")).not.toBeInTheDocument();

    // Click to open form
    fireEvent.click(addButton);
    expect(screen.getByText("Create New Team Member")).toBeInTheDocument();

    // Click to close form modal
    fireEvent.click(screen.getByRole("button", { name: /Close Modal/i }));
    expect(screen.queryByText("Create New Team Member")).not.toBeInTheDocument();
  });
});
