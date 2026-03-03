import React, { useEffect, useState } from "react";
import {
  Users as UsersIcon,
  Plus,
  Edit,
  Trash2,
  Shield,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { usersAPI } from "../api/users";
import { rolesAPI } from "../api/roles";
import { departmentsAPI } from "../api/departments";
import { clientsAPI } from "../api/clients";
import type {
  User,
  CreateUserDto,
  Role,
  Department,
  Client,
  UserStatus,
} from "../types";
import clsx from "clsx";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { SlideInModal } from "../components/SlideInModal";
import { TableSkeleton } from "../components/TableSkeleton";
import { FiltersBar } from "../components/FiltersBar";
import { ModalSelectInput } from "../components/ModalSelectInput";

const userStatuses: UserStatus[] = [
  "active",
  "invited",
  "inactive",
  "suspended",
];

export const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<CreateUserDto>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    roleId: "",
    departmentId: "",
    status: "invited",
    isSuperAdmin: false,
    clientIds: [],
  });

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes, deptsRes, clientsRes] = await Promise.all([
        usersAPI.getAll({
          page,
          limit,
          search: searchQuery,
          status: statusFilter !== "all" ? statusFilter : undefined,
          clientId: clientFilter !== "all" ? clientFilter : undefined,
        }),
        rolesAPI.getAll({ limit: 100 }),
        departmentsAPI.getAll({ limit: 100 }),
        clientsAPI.getAll({ limit: 100 }),
      ]);
      setUsers(usersRes.data || []);
      setTotalPages(usersRes.totalPages || 1);
      setTotalUsers(usersRes.total || 0);
      setRoles(Array.isArray(rolesRes) ? rolesRes : rolesRes?.data || []);
      setDepartments(Array.isArray(deptsRes) ? deptsRes : deptsRes?.data || []);
      setClients(Array.isArray(clientsRes) ? clientsRes : []);
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [page, limit, searchQuery, statusFilter, clientFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let user: User;
      if (editingUser) {
        const { password, clientIds, ...updateData } = formData;
        user = await usersAPI.update(editingUser._id, updateData);
        toast.success("User updated successfully");
      } else {
        const { clientIds, ...createData } = formData;
        user = await usersAPI.create(createData);
        toast.success("User created successfully");
      }

      // Sync clients
      const userId = user._id;
      const currentClientIds = editingUser
        ? editingUser.clients?.map((c: any) =>
            typeof c === "object" ? c._id : c,
          ) || []
        : [];
      const selectedClientIds = formData.clientIds || [];

      const toAdd = selectedClientIds.filter(
        (id) => !currentClientIds.includes(id),
      );
      const toRemove = currentClientIds.filter(
        (id) => !selectedClientIds.includes(id),
      );

      await Promise.all([
        ...toAdd.map((id) => clientsAPI.addUser(id, userId)),
        ...toRemove.map((id) => clientsAPI.removeUser(id, userId)),
      ]);

      closeModal();
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Operation failed");
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: "",
      roleId: typeof user.role === "object" ? user.role._id : user.role,
      departmentId:
        typeof user.department === "object"
          ? user.department._id
          : user.department,
      status: user.status,
      isSuperAdmin: user.isSuperAdmin || false,
      clientIds:
        user.clients?.map((c: any) => (typeof c === "object" ? c._id : c)) ||
        [],
    });
    setShowModal(true);
  };

  const openDeleteConfirm = (id: string, name: string) => {
    setUserToDelete({ id, name });
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      await usersAPI.delete(userToDelete.id);
      toast.success("User deleted successfully");
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete user");
      throw error; // Re-throw to keep modal open on error
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      roleId: "",
      departmentId: "",
      status: "invited",
      isSuperAdmin: false,
      clientIds: [],
    });
  };

  const getStatusBadge = (status: UserStatus) => {
    const styles = {
      active: "badge-success",
      invited: "badge-info",
      inactive: "badge-warning",
      suspended: "badge-danger",
    };
    return styles[status] || "badge-info";
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Users</h1>
          <p className="text-secondary-400">
            Manage system users and super admins
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add User
        </button>
      </div>

      {/* Filters */}
      <FiltersBar
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setPage(1);
        }}
        searchPlaceholder="Search users..."
        filters={[
          {
            icon: Shield,
            value: statusFilter,
            onChange: (v) => {
              setStatusFilter(v);
              setPage(1);
            },
            options: [
              { value: "all", label: "All Status" },
              ...userStatuses.map((s) => ({
                value: s,
                label: s.charAt(0).toUpperCase() + s.slice(1),
              })),
            ],
          },
          {
            icon: Building2,
            value: clientFilter,
            onChange: (v) => {
              setClientFilter(v);
              setPage(1);
            },
            options: [
              { value: "all", label: "All Clients" },
              ...clients.map((c) => ({ value: c._id, label: c.name })),
            ],
          },
        ]}
        onResetAll={() => {
          setSearchQuery("");
          setStatusFilter("all");
          setClientFilter("all");
          setPage(1);
        }}
      />

      {/* Users Table */}
      <div className="glass-card flex flex-col h-[calc(100vh-16.5rem)]">
        {loading && users.length === 0 ? (
          <TableSkeleton
            columns={7}
            rows={9}
            hasHeader={false}
            hasFilters={false}
          />
        ) : (
          <>
            {loading && users.length > 0 && (
              <div className="absolute top-0 left-0 w-full h-1 bg-secondary-800 overflow-hidden z-20 rounded-t-xl">
                <div className="h-full bg-primary-500 w-1/3 animate-[slide_1.5s_ease-in-out_infinite]"></div>
              </div>
            )}
            <div className="overflow-x-auto flex-1 overflow-y-auto relative custom-scrollbar rounded-t-2xl">
              <table className="w-full relative">
                <thead className="sticky top-0 z-10 bg-secondary-900/95 backdrop-blur-sm shadow-[0_1px_0_0_rgba(255,255,255,0.05)]">
                  <tr>
                    <th className="table-header">User</th>
                    <th className="table-header">Email</th>
                    <th className="table-header">Type</th>
                    <th className="table-header">Role/Dept</th>
                    <th className="table-header">Clients</th>
                    <th className="table-header">Status</th>
                    <th className="table-header text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr
                      key={user._id}
                      className="border-b border-secondary-700/30 hover:bg-secondary-800/30 transition-colors animate-fadeIn"
                      style={{ animationDelay: `${index * 0.03}s` }}
                    >
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                            {(user.firstName || "?")[0]}
                            {(user.lastName || "?")[0]}
                          </div>
                          <span className="font-medium text-white">
                            {user.firstName} {user.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="table-cell">{user.email}</td>
                      <td className="table-cell">
                        {user.isSuperAdmin ? (
                          <span className="flex items-center gap-1.5 text-amber-400">
                            <Shield className="w-4 h-4" />
                            Super Admin
                          </span>
                        ) : (
                          <span className="text-secondary-400">
                            Standard User
                          </span>
                        )}
                      </td>
                      <td className="table-cell">
                        <div className="flex flex-col">
                          <span className="text-primary-400 text-xs font-medium">
                            {user.role && typeof user.role === "object"
                              ? user.role.name
                              : "N/A"}
                          </span>
                          <span className="text-secondary-500 text-[10px]">
                            {user.department &&
                            typeof user.department === "object"
                              ? user.department.name
                              : "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex flex-wrap gap-1">
                          {user.clients && user.clients.length > 0 ? (
                            user.clients.map((client: any, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 rounded bg-secondary-800 text-xs text-secondary-300 flex items-center gap-1"
                              >
                                <Building2 className="w-3 h-3" />
                                {typeof client === "object"
                                  ? client.name
                                  : "Unknown Client"}
                              </span>
                            ))
                          ) : (
                            <span className="text-secondary-500 text-xs text-italic">
                              No Clients
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className={getStatusBadge(user.status)}>
                          {user.status}
                        </span>
                      </td>
                      <td className="table-cell text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 rounded-lg hover:bg-secondary-700/50 text-secondary-400 hover:text-white transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              openDeleteConfirm(
                                user._id,
                                `${user.firstName} ${user.lastName}`,
                              )
                            }
                            className="p-2 rounded-lg hover:bg-red-500/10 text-secondary-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {users.length === 0 && !loading && (
                <div className="text-center py-12 ">
                  <UsersIcon className="w-12 h-12 text-secondary-600 mx-auto mb-4" />
                  <p className="text-secondary-400">No users found</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Pagination Controls */}
        <div className="p-4 border-t border-secondary-700/30 flex items-center justify-between shrink-0 bg-secondary-900/50">
          <p className="text-sm text-secondary-400">
            Showing{" "}
            <span className="font-medium text-white">
              {users.length > 0 ? (page - 1) * limit + 1 : 0}
            </span>{" "}
            to{" "}
            <span className="font-medium text-white">
              {Math.min(page * limit, totalUsers)}
            </span>{" "}
            of <span className="font-medium text-white">{totalUsers}</span>{" "}
            results
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="p-2 rounded-lg hover:bg-secondary-700 text-secondary-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p = i + 1;
                if (totalPages > 5) {
                  if (page > 3) p = page - 2 + i;
                  if (p > totalPages) p = totalPages - (4 - i);
                  // Create a valid range, ensuring we don't go below 1
                  if (p < 1) p = i + 1;
                }

                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={clsx(
                      "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
                      page === p
                        ? "bg-primary-600 text-white"
                        : "hover:bg-secondary-700 text-secondary-400 hover:text-white",
                    )}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="p-2 rounded-lg hover:bg-secondary-700 text-secondary-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal - Slide-in Panel */}
      <SlideInModal
        isOpen={showModal}
        onClose={closeModal}
        title={editingUser ? "Edit User" : "Add New User"}
        icon={UsersIcon}
        iconColor={editingUser ? "amber" : "primary"}
        badges={[
          ...(editingUser
            ? [
                {
                  label: editingUser.email || "No Email",
                  variant: "default" as const,
                },
              ]
            : []),
          { label: formData.status || "invited", variant: "default" as const },
          ...(formData.isSuperAdmin
            ? [{ label: "Super Admin", variant: "primary" as const }]
            : []),
        ]}
        size="md"
        footer={
          <div className="flex gap-3">
            <button
              type="button"
              onClick={closeModal}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="btn-primary flex-1"
            >
              {editingUser ? "Update User" : "Create User"}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Fields */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">
              Personal Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      firstName: e.target.value,
                    })
                  }
                  className="input-field"
                  placeholder="First name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  className="input-field"
                  placeholder="Last name"
                  required
                />
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">
              Account Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="input-field"
                  placeholder="Email address"
                  required
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-secondary-300 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        password: e.target.value,
                      })
                    }
                    className="input-field"
                    placeholder="Password"
                    required={!editingUser}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Role & Department */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">
              Organization
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">
                  Role
                </label>
                <select
                  value={formData.roleId}
                  onChange={(e) =>
                    setFormData({ ...formData, roleId: e.target.value })
                  }
                  className="input-field"
                  required
                >
                  <option value="" className="bg-secondary-800">
                    Select a role
                  </option>
                  {roles.map((role) => (
                    <option
                      key={role._id}
                      value={role._id}
                      className="bg-secondary-800"
                    >
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">
                  Department
                </label>
                <select
                  value={formData.departmentId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      departmentId: e.target.value,
                    })
                  }
                  className="input-field"
                  required
                >
                  <option value="" className="bg-secondary-800">
                    Select a department
                  </option>
                  {departments.map((dept) => (
                    <option
                      key={dept._id}
                      value={dept._id}
                      className="bg-secondary-800"
                    >
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Client Access */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">
              Client Access
            </h3>
            <ModalSelectInput
              label="Assigned Clients"
              placeholder="Select clients for this user..."
              value={formData.clientIds || []}
              onChange={(clientIds) => setFormData({ ...formData, clientIds })}
              options={clients.map((c) => ({ value: c._id, label: c.name }))}
            />
          </div>

          {/* Status & Permissions */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">
              Status & Permissions
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as UserStatus,
                    })
                  }
                  className="input-field"
                >
                  {userStatuses.map((status) => (
                    <option
                      key={status}
                      value={status}
                      className="bg-secondary-800 capitalize"
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <div
                  onClick={() =>
                    setFormData({
                      ...formData,
                      isSuperAdmin: !formData.isSuperAdmin,
                    })
                  }
                  className={clsx(
                    "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border cursor-pointer transition-all duration-200",
                    formData.isSuperAdmin
                      ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                      : "bg-secondary-800/80 border-secondary-600/50 text-secondary-400 hover:bg-secondary-700",
                  )}
                >
                  <Shield
                    className={clsx(
                      "w-4 h-4",
                      formData.isSuperAdmin && "animate-pulse",
                    )}
                  />
                  <span className="text-sm font-medium">Super Admin</span>
                </div>
              </div>
            </div>

            {formData.isSuperAdmin && (
              <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                <p className="text-xs text-amber-300/80 leading-relaxed">
                  Warning: Super Admins have full access to the administration
                  portal and all system data across all clients.
                </p>
              </div>
            )}
          </div>
        </form>
      </SlideInModal>
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        itemName={userToDelete?.name}
        confirmText="Delete User"
        variant="danger"
      />
    </div>
  );
};
