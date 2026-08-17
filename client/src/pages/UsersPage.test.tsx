import { screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, type Mocked } from "vitest";
import axios from "axios";
import UsersPage from "./UsersPage";
import { renderWithQuery } from "../test/test-utils";

// Mock axios
vi.mock("axios");
const mockedAxios = axios as Mocked<typeof axios>;

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

  it("hides the modal dialog when clicking outside on the backdrop", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { users: [] } });
    renderWithQuery(<UsersPage />);

    // Open modal
    fireEvent.click(screen.getByRole("button", { name: /Add User/i }));
    expect(screen.getByText("Create New Team Member")).toBeInTheDocument();

    // Click outside on modal-backdrop
    const backdrop = screen.getByTestId("modal-backdrop");
    fireEvent.click(backdrop);

    // Verify dialog is hidden
    expect(screen.queryByText("Create New Team Member")).not.toBeInTheDocument();
  });

  it("hides the modal dialog when pressing the Escape key", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { users: [] } });
    renderWithQuery(<UsersPage />);

    // Open modal
    fireEvent.click(screen.getByRole("button", { name: /Add User/i }));
    expect(screen.getByText("Create New Team Member")).toBeInTheDocument();

    // Press ESC key
    fireEvent.keyDown(window, { key: "Escape", code: "Escape" });

    // Verify dialog is hidden
    expect(screen.queryByText("Create New Team Member")).not.toBeInTheDocument();
  });

  it("opens edit modal pre-populated with user data when edit button is clicked", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { users: mockUsers } });
    renderWithQuery(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText("Agent One")).toBeInTheDocument();
    });

    // Click edit button for Agent One
    const editButton = screen.getByRole("button", { name: "Edit Agent One" });
    fireEvent.click(editButton);

    // Verify modal title
    expect(screen.getByText("Edit Team Member")).toBeInTheDocument();

    // Verify form fields are pre-populated with user data
    expect(screen.getByDisplayValue("Agent One")).toBeInTheDocument();
    expect(screen.getByDisplayValue("agent1@example.com")).toBeInTheDocument();

    // Verify optional password label
    expect(screen.getByText("Password (leave blank to keep current)")).toBeInTheDocument();
  });

  it("disables delete button for admin users and current user", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { users: mockUsers } });
    renderWithQuery(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText("Admin User")).toBeInTheDocument();
    });

    const adminDeleteButton = screen.getByRole("button", { name: "Delete Admin User" });
    expect(adminDeleteButton).toBeDisabled();
  });

  it("opens delete confirmation modal and soft deletes agent on confirmation", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { users: mockUsers } });
    mockedAxios.delete.mockResolvedValueOnce({ data: { message: "User soft-deleted successfully" } });

    renderWithQuery(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText("Agent One")).toBeInTheDocument();
    });

    const agentDeleteButton = screen.getByRole("button", { name: "Delete Agent One" });
    expect(agentDeleteButton).not.toBeDisabled();

    // Click delete to open confirmation modal
    fireEvent.click(agentDeleteButton);

    expect(screen.getByText("Delete Team Member")).toBeInTheDocument();
    expect(screen.getByText(/This user will be soft-deleted/i)).toBeInTheDocument();

    // Click confirm delete
    const confirmButton = screen.getByRole("button", { name: "Confirm Delete" });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockedAxios.delete).toHaveBeenCalledWith("http://localhost:3000/api/users/2", {
        withCredentials: true,
      });
    });
  });
});
