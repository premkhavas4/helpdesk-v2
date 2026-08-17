import { useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { createUserSchema, type CreateUserInput } from "../../../core/src/schemas/user";

interface UserItem {
  id: string;
  email: string;
  name?: string;
  role: string;
  createdAt: string;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  // Form toggle state
  const [showAddForm, setShowAddForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // React Hook Form initialization
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "agent",
    },
  });

  // Edit inline states
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState("agent");

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
      reset();
      setShowAddForm(false);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.error || err.message || "Failed to create user.");
    },
  });

  // 3. Update User Role Mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const res = await axios.put(
        `${API_URL}/api/users/${id}`,
        { role },
        { withCredentials: true }
      );
      return res.data;
    },
    onSuccess: () => {
      setEditingUserId(null);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || err.message || "Failed to update role.");
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
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || err.message || "Failed to delete user.");
    },
  });

  const handleCreateUser = (data: CreateUserInput) => {
    setFormError(null);
    createUserMutation.mutate(data);
  };

  const handleDeleteUser = (id: string) => {
    if (currentUser?.id === id) {
      alert("You cannot delete your own account.");
      return;
    }

    if (!confirm("Are you sure you want to delete this user?")) {
      return;
    }

    deleteUserMutation.mutate(id);
  };

  const handleRoleUpdate = (id: string) => {
    updateRoleMutation.mutate({ id, role: editRole });
  };

  // Stats calculation
  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role.toLowerCase() === "admin").length;
  const agentCount = users.filter((u) => u.role.toLowerCase() === "agent").length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">User Management</h1>
          <p className="text-gray-500 mt-1">Manage team members, roles, and platform permissions.</p>
        </div>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setFormError(null);
            reset(); // Clear form values and errors
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
        >
          {showAddForm ? (
            <>Close Form</>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
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

      {/* Add User Modal Overlay */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xl max-w-lg w-full mx-4 transition-transform scale-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Create New Team Member</h2>
              <button
                type="button"
                aria-label="Close Modal"
                onClick={() => {
                  setShowAddForm(false);
                  reset();
                }}
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
            <form onSubmit={handleSubmit(handleCreateUser)} className="space-y-4">
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
                <label className="block text-sm font-semibold text-gray-700 mb-1">Password *</label>
                <input
                  type="password"
                  placeholder="••••••••"
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
                  <option value="agent">Agent (Support Staff)</option>
                  <option value="admin">Administrator (Full Access)</option>
                </select>
                {errors.role && (
                  <p className="text-red-500 text-xs mt-1 font-medium">⚠️ {errors.role.message}</p>
                )}
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    reset();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {createUserMutation.isPending ? "Creating..." : "Save Member"}
                </button>
              </div>
            </form>
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
                {users.map((u) => (
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
                      {editingUserId === u.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 outline-none text-sm"
                          >
                            <option value="agent">agent</option>
                            <option value="admin">admin</option>
                          </select>
                          <button
                            onClick={() => handleRoleUpdate(u.id)}
                            disabled={updateRoleMutation.isPending}
                            className="bg-green-600 hover:bg-green-700 text-white rounded px-2 py-1 text-xs font-medium transition-colors"
                          >
                            {updateRoleMutation.isPending ? "..." : "Save"}
                          </button>
                          <button
                            onClick={() => setEditingUserId(null)}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded px-2 py-1 text-xs font-medium transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${
                            u.role.toLowerCase() === "admin"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {u.role}
                        </span>
                      )}
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
                      {currentUser?.id !== u.id && (
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => {
                              setEditingUserId(u.id);
                              setEditRole(u.role);
                            }}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                          >
                            Edit Role
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            disabled={deleteUserMutation.isPending}
                            className="text-red-600 hover:text-red-900 transition-colors disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
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
