import { Award, Edit, Plus, Trash2, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  accreditationsAPI,
  type Accreditation,
  type CreateAccreditationDto,
} from "../api/accreditations";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { FiltersBar } from "../components/FiltersBar";
import { GridSkeleton } from "../components/GridSkeleton";
import { SlideInModal } from "../components/SlideInModal";

const TYPE_OPTIONS = [
  { value: "general", label: "General" },
  { value: "laboratory", label: "Laboratory" },
  { value: "hospital", label: "Hospital" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  inactive: "bg-secondary-700/50 text-secondary-400 border border-secondary-600",
};

const TYPE_COLORS: Record<string, string> = {
  general: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  laboratory: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
  hospital: "bg-rose-500/20 text-rose-400 border border-rose-500/30",
};

const getInitialFormData = (): CreateAccreditationDto => ({
  name: "",
  code: "",
  description: "",
  type: "general",
  status: "active",
  authority: "",
  country: "",
  validityPeriod: 36,
  website: "",
  email: "",
  requirements: [],
});

export const Accreditations: React.FC = () => {
  const [accreditations, setAccreditations] = useState<Accreditation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Accreditation | null>(null);
  const [formData, setFormData] =
    useState<CreateAccreditationDto>(getInitialFormData());
  const [newRequirement, setNewRequirement] = useState("");

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string } | null>(null);

  const fetchData = async () => {
    try {
      const data = await accreditationsAPI.getAll();
      setAccreditations(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to fetch accreditations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = accreditations.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.authority.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: CreateAccreditationDto = {
        ...formData,
        website: formData.website || undefined,
        email: formData.email || undefined,
        description: formData.description || undefined,
        requirements: formData.requirements?.filter(Boolean),
      };

      if (editingItem) {
        await accreditationsAPI.update(editingItem._id, payload);
        toast.success("Accreditation updated successfully");
      } else {
        await accreditationsAPI.create(payload);
        toast.success("Accreditation created successfully");
      }
      closeModal();
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Operation failed");
    }
  };

  const handleEdit = (item: Accreditation) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      code: item.code,
      description: item.description ?? "",
      type: item.type,
      status: item.status,
      authority: item.authority,
      country: item.country,
      validityPeriod: item.validityPeriod,
      website: item.website ?? "",
      email: item.email ?? "",
      requirements: item.requirements ?? [],
    });
    setShowModal(true);
  };

  const openDeleteConfirm = (id: string) => {
    setItemToDelete({ id });
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await accreditationsAPI.delete(itemToDelete.id);
      toast.success("Accreditation deleted successfully");
      fetchData();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to delete accreditation",
      );
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData(getInitialFormData());
    setNewRequirement("");
  };

  const addRequirement = () => {
    const trimmed = newRequirement.trim();
    if (!trimmed) return;
    setFormData({
      ...formData,
      requirements: [...(formData.requirements ?? []), trimmed],
    });
    setNewRequirement("");
  };

  const removeRequirement = (index: number) => {
    setFormData({
      ...formData,
      requirements: (formData.requirements ?? []).filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn min-h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Accreditations</h1>
          <p className="text-secondary-400">
            Manage common accreditations (not tied to any client)
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Accreditation
        </button>
      </div>

      {/* Search */}
      <FiltersBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by name, code or authority..."
      />

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
        {loading && accreditations.length > 0 && (
          <div className="absolute -top-6 left-0 w-full h-1 bg-secondary-800 overflow-hidden z-20 rounded-full">
            <div className="h-full bg-primary-500 w-1/3 animate-[slide_1.5s_ease-in-out_infinite]" />
          </div>
        )}

        {loading && accreditations.length === 0 ? (
          <div className="col-span-full">
            <GridSkeleton itemCount={6} hasHeader={false} hasFilters={false} />
          </div>
        ) : (
          <>
            {filtered.map((item) => (
              <div
                key={item._id}
                className="glass-card p-6 hover:border-primary-500/30 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/10 border border-primary-500/20">
                    <Award className="w-6 h-6 text-primary-400" />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-2 rounded-lg hover:bg-secondary-700/50 text-secondary-400 hover:text-white transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openDeleteConfirm(item._id)}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-secondary-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h3 className="text-lg font-semibold text-white">
                    {item.name}
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-secondary-700 text-secondary-300">
                    {item.code}
                  </span>
                </div>

                {item.description && (
                  <p className="text-sm text-secondary-400 line-clamp-2 mb-3">
                    {item.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mb-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full capitalize ${TYPE_COLORS[item.type] ?? "bg-secondary-700/50 text-secondary-400"}`}
                  >
                    {item.type}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[item.status] ?? "bg-secondary-700/50 text-secondary-400"}`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="text-xs text-secondary-500 space-y-1">
                  <p>Authority: {item.authority}</p>
                  <p>Country: {item.country}</p>
                  <p>Validity: {item.validityPeriod} months</p>
                  {item.createdAt && (
                    <p>
                      Created: {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="col-span-full text-center py-12 min-h-[70vh]">
                <Award className="w-12 h-12 text-secondary-600 mx-auto mb-4" />
                <p className="text-secondary-400">No accreditations found</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      <SlideInModal
        isOpen={showModal}
        onClose={closeModal}
        title={editingItem ? "Edit Accreditation" : "Add New Accreditation"}
        icon={Award}
        iconColor="emerald"
        badges={
          editingItem ? [{ label: editingItem.code, variant: "default" }] : []
        }
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
              form="accreditation-form"
              className="btn-primary flex-1"
            >
              {editingItem ? "Update Accreditation" : "Create Accreditation"}
            </button>
          </div>
        }
      >
        <form
          id="accreditation-form"
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Basic Information */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">
              Basic Information
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
                  placeholder="e.g. ISO 9001:2015"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">
                  Code
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  className="input-field"
                  placeholder="e.g. ISO9001"
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
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="input-field min-h-[80px] resize-none"
                  placeholder="Brief description of this accreditation"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-300 mb-2">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="input-field"
                    required
                  >
                    {TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-300 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="input-field"
                    required
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Authority & Location */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">
              Authority & Location
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">
                  Authority
                </label>
                <input
                  type="text"
                  value={formData.authority}
                  onChange={(e) =>
                    setFormData({ ...formData, authority: e.target.value })
                  }
                  className="input-field"
                  placeholder="e.g. International Organization for Standardization"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-300 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) =>
                      setFormData({ ...formData, country: e.target.value })
                    }
                    className="input-field"
                    placeholder="e.g. Switzerland"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-300 mb-2">
                    Validity Period (months)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.validityPeriod}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        validityPeriod: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  className="input-field"
                  placeholder="https://www.example.org"
                />
              </div>

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
                  placeholder="contact@example.org"
                />
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">
              Requirements
            </h3>

            {(formData.requirements ?? []).length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {(formData.requirements ?? []).map((req, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-secondary-700/50 text-secondary-300 text-sm border border-secondary-600"
                  >
                    {req}
                    <button
                      type="button"
                      onClick={() => removeRequirement(i)}
                      className="ml-1 text-secondary-500 hover:text-red-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={newRequirement}
                onChange={(e) => setNewRequirement(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addRequirement();
                  }
                }}
                className="input-field flex-1"
                placeholder="Add a requirement and press Enter"
              />
              <button
                type="button"
                onClick={addRequirement}
                className="btn-secondary px-4"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      </SlideInModal>

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Accreditation"
        message="Are you sure you want to delete this accreditation? This action cannot be undone."
        confirmText="Delete Accreditation"
        variant="danger"
      />
    </div>
  );
};
