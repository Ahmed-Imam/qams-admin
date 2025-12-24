import React, { useEffect, useState } from "react";
import {
  Users as UsersIcon,
  Plus,
  Search,
  Edit,
  Trash2,
  Shield,
  X,
  Filter,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Building2
} from "lucide-react";
import { toast } from "sonner";
import { usersAPI } from "../api/users";
import { rolesAPI } from "../api/roles";
import { departmentsAPI } from "../api/departments";
import type { User, CreateUserDto, Role, Department, UserStatus } from "../types";
import clsx from "clsx";

const userStatuses: UserStatus[] = ["active", "invited", "inactive", "suspended"];

export const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
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
    role: "",
    department: "",
    status: "invited",
    isSuperAdmin: false,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes, deptsRes] = await Promise.all([
        usersAPI.getAll({ 
          page, 
          limit, 
          search: searchQuery, 
          status: statusFilter !== 'all' ? statusFilter : undefined 
        }),
        rolesAPI.getAll({ limit: 100 }),
        departmentsAPI.getAll({ limit: 100 }),
      ]);
      setUsers(usersRes.data || []);
      setTotalPages(usersRes.totalPages || 1);
      setTotalUsers(usersRes.total || 0);
      setRoles(rolesRes?.data || []);
      setDepartments(deptsRes?.data || []);
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
  }, [page, limit, searchQuery, statusFilter]);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const { password, ...updateData } = formData;
        await usersAPI.update(editingUser._id, updateData);
        toast.success("User updated successfully");
      } else {
        await usersAPI.create(formData);
        toast.success("User created successfully");
      }
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
      role: typeof user.role === "object" ? user.role._id : user.role,
      department: typeof user.department === "object" ? user.department._id : user.department,
      status: user.status,
      isSuperAdmin: user.isSuperAdmin || false,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await usersAPI.delete(id);
      toast.success("User deleted successfully");
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete user");
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
      role: "",
      department: "",
      status: "invited",
      isSuperAdmin: false,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Users</h1>
          <p className="text-secondary-400">Manage system users and super admins</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field pl-10 pr-8 min-w-[150px]"
          >
            <option value="all" className="bg-secondary-800">All Status</option>
            {userStatuses.map((status) => (
              <option key={status} value={status} className="bg-secondary-800 capitalize">
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-secondary-700/50">
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
                        {(user.firstName || "?")[0]}{(user.lastName || "?")[0]}
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
                      <span className="text-secondary-400">Standard User</span>
                    )}
                  </td>
                  <td className="table-cell">
                    <div className="flex flex-col">
                      <span className="text-primary-400 text-xs font-medium">
                        {user.role && typeof user.role === "object" ? user.role.name : "N/A"}
                      </span>
                      <span className="text-secondary-500 text-[10px]">
                        {user.department && typeof user.department === "object" ? user.department.name : "N/A"}
                      </span>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex flex-wrap gap-1">
                      {user.clients && user.clients.length > 0 ? (
                        user.clients.map((client: any, idx) => (
                          <span key={idx} className="px-2 py-1 rounded bg-secondary-800 text-xs text-secondary-300 flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {typeof client === 'object' ? client.name : 'Unknown Client'}
                          </span>
                        ))
                      ) : (
                        <span className="text-secondary-500 text-xs text-italic">No Clients</span>
                      )}
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className={getStatusBadge(user.status)}>{user.status}</span>
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
                        onClick={() => handleDelete(user._id)}
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
            <div className="text-center py-12">
              <UsersIcon className="w-12 h-12 text-secondary-600 mx-auto mb-4" />
              <p className="text-secondary-400">No users found</p>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-secondary-700/30 flex items-center justify-between">
          <p className="text-sm text-secondary-400">
            Showing <span className="font-medium text-white">{users.length > 0 ? (page - 1) * limit + 1 : 0}</span> to{" "}
            <span className="font-medium text-white">{Math.min(page * limit, totalUsers)}</span> of{" "}
            <span className="font-medium text-white">{totalUsers}</span> results
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
                        : "hover:bg-secondary-700 text-secondary-400 hover:text-white"
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card w-full max-w-lg p-6 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingUser ? "Edit User" : "Add New User"}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-secondary-700/50 text-secondary-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-300 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="input-field"
                    placeholder="Last name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input-field"
                    placeholder="Password"
                    required={!editingUser}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-300 mb-2">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="" className="bg-secondary-800">Select a role</option>
                    {roles.map((role) => (
                      <option key={role._id} value={role._id} className="bg-secondary-800">
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
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="" className="bg-secondary-800">Select a department</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id} className="bg-secondary-800">
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-300 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
                    className="input-field"
                  >
                    {userStatuses.map((status) => (
                      <option key={status} value={status} className="bg-secondary-800 capitalize">
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <div 
                    onClick={() => setFormData({ ...formData, isSuperAdmin: !formData.isSuperAdmin })}
                    className={clsx(
                      "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border cursor-pointer transition-all duration-200",
                      formData.isSuperAdmin 
                        ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                        : "bg-secondary-800/80 border-secondary-600/50 text-secondary-400 hover:bg-secondary-700"
                    )}
                  >
                    <Shield className={clsx("w-4 h-4", formData.isSuperAdmin && "animate-pulse")} />
                    <span className="text-sm font-medium">Super Admin</span>
                  </div>
                </div>
              </div>

              {formData.isSuperAdmin && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                  <p className="text-xs text-amber-300/80 leading-relaxed">
                    Warning: Super Admins have full access to the administration portal and all system data across all clients.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editingUser ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
