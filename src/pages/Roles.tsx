import React, { useEffect, useState } from "react";
import { Shield, Plus, Edit, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import { rolesAPI } from "../api/roles";
import { clientsAPI } from "../api/clients";
import type { Role, CreateRoleDto, Client } from "../types";
import clsx from "clsx";
import { SlideInModal } from "../components/SlideInModal";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { GridSkeleton } from "../components/GridSkeleton";
import { FiltersBar } from "../components/FiltersBar";

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
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState<CreateRoleDto>({
    name: "",
    permissions: [],
    description: "",
    client: "",
  });

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const fetchData = async (
    pageNumber: number = 1,
    search: string = searchQuery,
  ) => {
    try {
      if (pageNumber === 1) {
        setLoading(true);
      } else {
        setLoadMoreLoading(true);
      }

      const [rolesRes, clientsRes] = await Promise.all([
        rolesAPI.getAll({
          page: pageNumber,
          limit: 9,
          search: search || undefined,
        }),
        // Only fetch clients on initial load or if not already fetched
        clients.length === 0 ? clientsAPI.getAll() : Promise.resolve(clients),
      ]);

      const newRoles = Array.isArray(rolesRes)
        ? rolesRes
        : rolesRes?.data || [];
      const totalPages = Array.isArray(rolesRes)
        ? 1
        : rolesRes?.totalPages || 1;

      if (pageNumber === 1) {
        setRoles(newRoles);
        setPage(1); // Reset page state to 1
      } else {
        setRoles((prev) => [...prev, ...newRoles]);
        setPage(pageNumber); // Update page state to current page
      }

      setHasMore(pageNumber < totalPages);
      setClients(clientsRes || []);
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
      setLoadMoreLoading(false);
    }
  };

  // Fetch on search change (debounce is handled inside FiltersBar)
  useEffect(() => {
    fetchData(1, searchQuery);
  }, [searchQuery]);

  const handleLoadMore = () => {
    fetchData(page + 1);
  };

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

  const openDeleteConfirm = (id: string, name: string) => {
    setRoleToDelete({ id, name });
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!roleToDelete) return;
    try {
      await rolesAPI.delete(roleToDelete.id);
      toast.success("Role deleted successfully");
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete role");
      throw error;
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

  return (
    <div className="space-y-6 animate-fadeIn min-h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Roles</h1>
          <p className="text-secondary-400">
            Manage user roles and permissions
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Role
        </button>
      </div>

      {/* Search */}
      <FiltersBar
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setPage(1);
        }}
        searchPlaceholder="Search roles..."
      />

      {/* Roles Grid */}
      {loading && roles.length === 0 ? (
        <GridSkeleton itemCount={6} hasHeader={false} hasFilters={false} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role, index) => (
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
                    onClick={() => openDeleteConfirm(role._id, role.name)}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-secondary-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-white mb-2">
                {role.name}
              </h3>
              {role.description && (
                <p className="text-sm text-secondary-400 mb-4">
                  {role.description}
                </p>
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

          {roles.length === 0 && (
            <div className="col-span-full text-center py-12 ">
              <Shield className="w-12 h-12 text-secondary-600 mx-auto mb-4" />
              <p className="text-secondary-400">No roles found</p>
            </div>
          )}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center mt-8 pb-12">
          <button
            onClick={handleLoadMore}
            disabled={loadMoreLoading}
            className="group relative px-8 py-3 bg-secondary-800 hover:bg-secondary-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all duration-300 border border-secondary-700 hover:border-primary-500/50 shadow-lg hover:shadow-primary-500/10 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-3">
              {loadMoreLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Shield className="w-5 h-5 text-primary-400 group-hover:scale-110 transition-transform" />
              )}
              <span>{loadMoreLoading ? "Loading..." : "Load More Roles"}</span>
            </div>
          </button>
        </div>
      )}

      {/* Modal - Slide-in Panel */}
      <SlideInModal
        isOpen={showModal}
        onClose={closeModal}
        title={editingRole ? "Edit Role" : "Add New Role"}
        icon={Shield}
        iconColor="amber"
        badges={
          editingRole
            ? [
                {
                  label: editingRole.name,
                  variant: "default",
                },
                {
                  label: `${formData.permissions.length} Permission${formData.permissions.length !== 1 ? "s" : ""}`,
                  variant: "primary",
                },
              ]
            : [
                {
                  label: `${formData.permissions.length} Permission${formData.permissions.length !== 1 ? "s" : ""}`,
                  variant: "primary",
                },
              ]
        }
        size="lg"
        footer={
          <div className="flex gap-3 w-full">
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
              {editingRole ? "Update Role" : "Create Role"}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">
              Basic Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">
                  Role Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
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
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value,
                    })
                  }
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
                  onChange={(e) =>
                    setFormData({ ...formData, client: e.target.value })
                  }
                  className="input-field"
                  required
                >
                  <option value="" className="bg-secondary-800">
                    Select a client
                  </option>
                  {clients.map((client) => (
                    <option
                      key={client._id}
                      value={client._id}
                      className="bg-secondary-800"
                    >
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">
              Permissions
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-96 overflow-y-auto p-2 bg-secondary-800/50 rounded-xl">
              {allPermissions.map((permission) => (
                <button
                  key={permission}
                  type="button"
                  onClick={() => togglePermission(permission)}
                  className={clsx(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-left",
                    formData.permissions.includes(permission)
                      ? "bg-primary-500/20 text-primary-400 border border-primary-500/30"
                      : "bg-secondary-700/50 text-secondary-400 border border-secondary-600/30 hover:bg-secondary-700",
                  )}
                >
                  <div
                    className={clsx(
                      "w-4 h-4 rounded border flex shrink-0 items-center justify-center transition-all",
                      formData.permissions.includes(permission)
                        ? "bg-primary-500 border-primary-500"
                        : "border-secondary-500",
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
        </form>
      </SlideInModal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Role"
        message="Are you sure you want to delete this role? This action cannot be undone."
        itemName={roleToDelete?.name}
        confirmText="Delete Role"
        variant="danger"
      />
    </div>
  );
};
