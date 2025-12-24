import React, { useEffect, useState } from "react";
import {
  Shield,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { rolesAPI } from "../api/roles";
import { clientsAPI } from "../api/clients";
import type { Role, CreateRoleDto, Client } from "../types";
import clsx from "clsx";

const allPermissions = [
  "manage users",
  "manage roles",
  "manage departments",
  "manage equipment",
  "manage settings",
  "submit form",
  "review form",
  "approve form",
  "create capa",
  "review capa",
  "close capa",
  "create document",
  "review document",
  "approve document",
  "archive document",
  "perform checklist",
  "create checklist template",
  "manage risks",
  "view training",
  "manage training",
  "view reports",
  "view dashboard",
];

export const Roles: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState<CreateRoleDto>({
    name: "",
    permissions: [],
    description: "",
    client: "",
  });

  const fetchData = async () => {
    try {
      const [rolesRes, clientsRes] = await Promise.all([
        rolesAPI.getAll({ limit: 100 }),
        clientsAPI.getAll(),
      ]);
      setRoles(rolesRes?.data || []);
      setClients(clientsRes || []);
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredRoles = roles.filter((role) =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRole) {
        await rolesAPI.update(editingRole._id, formData);
        toast.success("Role updated successfully");
      } else {
        await rolesAPI.create(formData);
        toast.success("Role created successfully");
      }
      closeModal();
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Operation failed");
    }
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      permissions: role.permissions,
      description: role.description || "",
      client: role.client || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this role?")) return;
    try {
      await rolesAPI.delete(id);
      toast.success("Role deleted successfully");
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete role");
    }
  };

  const togglePermission = (permission: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingRole(null);
    setFormData({ name: "", permissions: [], description: "", client: "" });
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
          <h1 className="text-3xl font-bold text-white mb-2">Roles</h1>
          <p className="text-secondary-400">Manage user roles and permissions</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Role
        </button>
      </div>

      {/* Search */}
      <div className="glass-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input
            type="text"
            placeholder="Search roles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoles.map((role, index) => (
          <div
            key={role._id}
            className="glass-card p-6 hover:border-primary-500/30 transition-all duration-300 animate-fadeIn"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20">
                <Shield className="w-6 h-6 text-amber-400" />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(role)}
                  className="p-2 rounded-lg hover:bg-secondary-700/50 text-secondary-400 hover:text-white transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(role._id)}
                  className="p-2 rounded-lg hover:bg-red-500/10 text-secondary-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-white mb-2">{role.name}</h3>
            {role.description && (
              <p className="text-sm text-secondary-400 mb-4">{role.description}</p>
            )}

            <div className="space-y-2">
              <p className="text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Permissions ({role.permissions.length})
              </p>
              <div className="flex flex-wrap gap-1">
                {role.permissions.slice(0, 4).map((perm) => (
                  <span key={perm} className="badge-info text-xs">
                    {perm}
                  </span>
                ))}
                {role.permissions.length > 4 && (
                  <span className="badge-info text-xs">
                    +{role.permissions.length - 4} more
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredRoles.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Shield className="w-12 h-12 text-secondary-600 mx-auto mb-4" />
            <p className="text-secondary-400">No roles found</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card w-full max-w-2xl p-6 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingRole ? "Edit Role" : "Add New Role"}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-secondary-700/50 text-secondary-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">
                  Role Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Quality Manager"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field min-h-[80px] resize-none"
                  placeholder="Role description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">
                  Client
                </label>
                <select
                  value={formData.client}
                  onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="" className="bg-secondary-800">Select a client</option>
                  {clients.map((client) => (
                    <option key={client._id} value={client._id} className="bg-secondary-800">
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-3">
                  Permissions
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 bg-secondary-800/50 rounded-xl">
                  {allPermissions.map((permission) => (
                    <button
                      key={permission}
                      type="button"
                      onClick={() => togglePermission(permission)}
                      className={clsx(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                        formData.permissions.includes(permission)
                          ? "bg-primary-500/20 text-primary-400 border border-primary-500/30"
                          : "bg-secondary-700/50 text-secondary-400 border border-secondary-600/30 hover:bg-secondary-700"
                      )}
                    >
                      <div
                        className={clsx(
                          "w-4 h-4 rounded border flex items-center justify-center transition-all",
                          formData.permissions.includes(permission)
                            ? "bg-primary-500 border-primary-500"
                            : "border-secondary-500"
                        )}
                      >
                        {formData.permissions.includes(permission) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <span className="truncate capitalize">{permission}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editingRole ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
