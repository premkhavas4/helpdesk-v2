import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { createUserSchema, updateUserSchema, UserRole, type CreateUserInput } from "../../../core/src/schemas/user";

interface UserItem {
  id: string;
  email: string;
  name?: string;
  role: string;
  createdAt: string;
}

const API_URL = import.meta.env.VITE_API_URL || "";

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  // Form & Modal state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // React Hook Form initialization
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(editingUser ? updateUserSchema : createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: UserRole.AGENT,
    },
  });

  const handleCloseModal = useCallback(() => {
    setShowAddForm(false);
    setEditingUser(null);
    setFormError(null);
    reset({
      name: "",
      email: "",
      password: "",
      role: UserRole.AGENT,
    });
  }, [reset]);

  const handleCloseDeleteModal = useCallback(() => {
    setUserToDelete(null);
    setDeleteError(null);
  }, []);

  // Handle ESC key press to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showAddForm) handleCloseModal();
        if (userToDelete) handleCloseDeleteModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showAddForm, userToDelete, handleCloseModal, handleCloseDeleteModal]);

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormError(null);
    reset({
      name: "",
      email: "",
      password: "",
      role: UserRole.AGENT,
    });
    setShowAddForm(true);
  };

  const handleOpenEditModal = (userToEdit: UserItem) => {
    setEditingUser(userToEdit);
    setFormError(null);
    reset({
      name: userToEdit.name || "",
      email: userToEdit.email,
      password: "",
      role: (userToEdit.role.toLowerCase() as UserRole) || UserRole.AGENT,
    });
    setShowAddForm(true);
  };

  // 1. Fetch Users Query
  const { data: users = [], isLoading, error: queryError } = useQuery<UserItem[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/api/users`, {
        withCredentials: true,
      });
      return res.data.users || [];
    },
  });

  // 2. Create User Mutation
  const createUserMutation = useMutation({
    mutationFn: async (newUser: CreateUserInput) => {
      const res = await axios.post(`${API_URL}/api/users`, newUser, {
        withCredentials: true,
      });
      return res.data;
    },
    onSuccess: () => {
      handleCloseModal();
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.error || err.message || "Failed to create user.");
    },
  });

  // 3. Update User Mutation (full user edit: name, email, role, optional password)
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateUserInput> }) => {
      const res = await axios.put(`${API_URL}/api/users/${id}`, data, {
        withCredentials: true,
      });
      return res.data;
    },
    onSuccess: () => {
      handleCloseModal();
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.error || err.message || "Failed to update user.");
    },
  });

  // 4. Delete User Mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await axios.delete(`${API_URL}/api/users/${id}`, {
        withCredentials: true,
      });
      return res.data;
    },
    onSuccess: () => {
      handleCloseDeleteModal();
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => {
      setDeleteError(err.response?.data?.error || err.message || "Failed to delete user.");
    },
  });

  const handleFormSubmit = (data: CreateUserInput) => {
    setFormError(null);
    if (editingUser) {
      updateUserMutation.mutate({
        id: editingUser.id,
        data,
      });
    } else {
      createUserMutation.mutate(data);
    }
  };

  const handleConfirmDelete = () => {
    if (!userToDelete) return;
    deleteUserMutation.mutate(userToDelete.id);
  };

  // Stats calculation
  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role.toLowerCase() === "admin").length;
  const agentCount = users.filter((u) => u.role.toLowerCase() === "agent").length;

  const isSubmitting = createUserMutation.isPending || updateUserMutation.isPending;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">User Management</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">Manage team members, roles, and platform permissions.</p>
        </div>
        <button
          onClick={showAddForm ? handleCloseModal : handleOpenAddModal}
          className="self-start sm:self-auto bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-sm whitespace-nowrap"
        >
          {showAddForm ? (
            "Close Form"
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add User
            </>
          )}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-500 font-medium">Total Members</span>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalUsers}</h3>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-500 font-medium">Administrators</span>
            <h3 className="text-2xl font-bold text-purple-900 mt-1">{adminCount}</h3>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-500 font-medium">Agents</span>
            <h3 className="text-2xl font-bold text-green-900 mt-1">{agentCount}</h3>
          </div>
          <div className="p-3 bg-green-50 rounded-lg text-green-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
      </div>

      {/* User Modal Overlay (Create & Edit) */}
      {showAddForm && (
        <div
          data-testid="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseModal();
            }
          }}
          className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity"
        >
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xl max-w-lg w-full mx-4 transition-transform scale-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingUser ? "Edit Team Member" : "Create New Team Member"}
              </h2>
              <button
                type="button"
                aria-label="Close Modal"
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {formError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm font-medium">
                ⚠️ {formError}
              </div>
            )}
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  {...register("name")}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1 font-medium">⚠️ {errors.name.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  placeholder="john.doe@company.com"
                  {...register("email")}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1 font-medium">⚠️ {errors.email.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {editingUser ? "Password (leave blank to keep current)" : "Password *"}
                </label>
                <input
                  type="password"
                  placeholder={editingUser ? "•••••••• (unchanged)" : "••••••••"}
                  {...register("password")}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1 font-medium">⚠️ {errors.password.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Role *</label>
                <select
                  {...register("role")}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value={UserRole.AGENT}>Agent (Support Staff)</option>
                  <option value={UserRole.ADMIN}>Administrator (Full Access)</option>
                </select>
                {errors.role && (
                  <p className="text-red-500 text-xs mt-1 font-medium">⚠️ {errors.role.message}</p>
                )}
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting
                    ? editingUser
                      ? "Updating..."
                      : "Creating..."
                    : editingUser
                    ? "Update Member"
                    : "Save Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div
          data-testid="delete-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseDeleteModal();
            }
          }}
          className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity"
        >
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xl max-w-md w-full mx-4 transition-transform scale-100">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="p-2 bg-red-100 rounded-full">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Delete Team Member</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete <span className="font-semibold text-gray-900">{userToDelete.name || userToDelete.email}</span> ({userToDelete.email})? This user will be soft-deleted.
            </p>
            {deleteError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm font-medium">
                ⚠️ {deleteError}
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                disabled={deleteUserMutation.isPending}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteUserMutation.isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {deleteUserMutation.isPending ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="animate-pulse p-6 space-y-4">
            {/* Table Header skeleton */}
            <div className="grid grid-cols-5 gap-4 border-b border-gray-100 pb-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/6"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-12 justify-self-end"></div>
            </div>
            {/* Table Rows skeleton */}
            {[...Array(5)].map((_, i) => (
              <div key={i} className="grid grid-cols-5 gap-4 py-3 items-center border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-44"></div>
                <div className="h-5 bg-gray-200 rounded-full w-14"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-10 justify-self-end"></div>
              </div>
            ))}
          </div>
        ) : queryError ? (
          <div className="p-6 text-center">
            <p className="text-red-600 font-medium">❌ {queryError instanceof Error ? queryError.message : "Failed to load user list"}</p>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ["users"] })}
              className="mt-3 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm text-gray-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((u) => {
                  const isAdminUser = u.role.toLowerCase() === "admin";
                  const isSelf = currentUser?.id === u.id;
                  const isDeleteDisabled = isAdminUser || isSelf;

                  return (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      {/* Name */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                            {u.name ? u.name.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{u.name || "—"}</span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{u.email}</td>

                      {/* Role */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${
                            u.role.toLowerCase() === "admin"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      {/* Created Date */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(u.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(u)}
                            title="Edit User"
                            aria-label={`Edit ${u.name || u.email}`}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 font-medium text-xs border border-blue-200"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (isDeleteDisabled) return;
                              setDeleteError(null);
                              setUserToDelete(u);
                            }}
                            disabled={isDeleteDisabled || deleteUserMutation.isPending}
                            title={
                              isSelf
                                ? "You cannot delete your own account"
                                : isAdminUser
                                ? "Admin users cannot be deleted"
                                : "Delete User"
                            }
                            aria-label={`Delete ${u.name || u.email}`}
                            className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 font-medium text-xs border border-red-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-red-600"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="p-8 text-center text-gray-500 text-sm">No registered team members found.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
