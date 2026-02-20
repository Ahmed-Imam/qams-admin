import React, { useEffect, useState } from "react";
import { FolderTree, Plus, Search, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { departmentsAPI } from "../api/departments";
import { clientsAPI } from "../api/clients";
import type { Department, CreateDepartmentDto, Client } from "../types";
import { SlideInModal } from "../components/SlideInModal";

export const Departments: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState<CreateDepartmentDto>({
    name: "",
    description: "",
    client: "",
  });

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

      const [deptsRes, clientsRes] = await Promise.all([
        departmentsAPI.getAll({
          page: pageNumber,
          limit: 9,
          search: search || undefined,
        }),
        // Only fetch clients on initial load or if not already fetched
        clients.length === 0 ? clientsAPI.getAll() : Promise.resolve(clients),
      ]);

      const newDeps = Array.isArray(deptsRes) ? deptsRes : deptsRes?.data || [];
      const totalPages = Array.isArray(deptsRes)
        ? 1
        : deptsRes?.totalPages || 1;

      if (pageNumber === 1) {
        setDepartments(newDeps);
        setPage(1);
      } else {
        setDepartments((prev) => [...prev, ...newDeps]);
        setPage(pageNumber);
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

  // Initial fetch
  useEffect(() => {
    fetchData(1, "");
  }, []);

  // Handle Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Effect for debounced search
  useEffect(() => {
    // Skip if it's the initial empty search or if we're just setting it back to ""
    fetchData(1, debouncedSearch);
  }, [debouncedSearch]);

  const handleLoadMore = () => {
    if (!loadMoreLoading && hasMore) {
      fetchData(page + 1, debouncedSearch);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDept) {
        await departmentsAPI.update(editingDept._id, formData);
        toast.success("Department updated successfully");
      } else {
        await departmentsAPI.create(formData);
        toast.success("Department created successfully");
      }
      closeModal();
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Operation failed");
    }
  };

  const handleEdit = (dept: Department) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      description: dept.description || "",
      client: dept.client || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this department?")) return;
    try {
      await departmentsAPI.delete(id);
      toast.success("Department deleted successfully");
      fetchData();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to delete department",
      );
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingDept(null);
    setFormData({ name: "", description: "", client: "" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn min-h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Departments</h1>
          <p className="text-secondary-400">
            Manage organizational departments
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Department
        </button>
      </div>

      {/* Search */}
      <div className="glass-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input
            type="text"
            placeholder="Search departments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept, index) => (
          <div
            key={dept._id}
            className="glass-card p-6 hover:border-primary-500/30 transition-all duration-300 animate-fadeIn"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20">
                <FolderTree className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(dept)}
                  className="p-2 rounded-lg hover:bg-secondary-700/50 text-secondary-400 hover:text-white transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(dept._id)}
                  className="p-2 rounded-lg hover:bg-red-500/10 text-secondary-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-white mb-2">
              {dept.name}
            </h3>
            {dept.description && (
              <p className="text-sm text-secondary-400 line-clamp-2">
                {dept.description}
              </p>
            )}

            {dept.createdAt && (
              <div className="mt-4 pt-4 border-t border-secondary-700/50">
                <p className="text-xs text-secondary-500">
                  Created: {new Date(dept.createdAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        ))}

        {departments.length === 0 && (
          <div className="col-span-full text-center py-12 ">
            <FolderTree className="w-12 h-12 text-secondary-600 mx-auto mb-4" />
            <p className="text-secondary-400">No departments found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {hasMore && (
        <div className="flex justify-center pt-8">
          <button
            onClick={handleLoadMore}
            disabled={loadMoreLoading}
            className="btn-secondary min-w-[200px] flex items-center justify-center gap-2"
          >
            {loadMoreLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-secondary-400 border-t-transparent rounded-full animate-spin" />
                Loading...
              </>
            ) : (
              "Load More Departments"
            )}
          </button>
        </div>
      )}

      {/* Modal - Slide-in Panel */}
      <SlideInModal
        isOpen={showModal}
        onClose={closeModal}
        title={editingDept ? "Edit Department" : "Add New Department"}
        icon={FolderTree}
        iconColor="emerald"
        badges={
          editingDept
            ? [
                {
                  label: editingDept.name,
                  variant: "default",
                },
              ]
            : []
        }
        size="md"
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
              {editingDept ? "Update Department" : "Create Department"}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">
              Department Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="input-field"
                  placeholder="Department name"
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
                  placeholder="Department description"
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
        </form>
      </SlideInModal>
    </div>
  );
};
