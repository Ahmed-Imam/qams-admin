import { Edit, FileStack, Plus, Search, Trash2, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { documentTypesAPI } from "../api/documentTypes";
import { workflowsAPI } from "../api/workflows";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { SlideInModal } from "../components/SlideInModal";
import type { CreateDocumentTypeDto, DocumentType, Workflow } from "../types";
import { DocumentTypeIntegration, DocumentTypeRule } from "../types";
import { GridSkeleton } from "../components/GridSkeleton";

const RULE_LABELS: Record<string, string> = {
  require_approval: "Require approval",
  require_training: "Require training",
  require_versioning: "Require versioning",
  appears_in_training: "Appears in training",
  editable_after_approval: "Editable after approval",
  auto_publish_on_approval: "Auto publish on approval",
};

const INTEGRATION_LABELS: Record<string, string> = {
  forms: "Forms",
  checklists: "Checklists",
  risk_assessments: "Risk assessments",
  equipment: "Equipment",
};

const RULE_OPTIONS = Object.values(DocumentTypeRule);
const INTEGRATION_OPTIONS = Object.values(DocumentTypeIntegration);

const getInitialFormData = (): CreateDocumentTypeDto => ({
  name: "",
  code: "",
  description: "",
  visibility: [],
  rules: [],
  integrationSettings: [],
  reviewCycle: 12,
  workflow: "",
});

export const DocumentTypes: React.FC = () => {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DocumentType | null>(null);
  const [formData, setFormData] =
    useState<CreateDocumentTypeDto>(getInitialFormData());

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<{ id: string } | null>(null);

  const fetchData = async () => {
    try {
      const [typesRes, workflowsRes] = await Promise.all([
        documentTypesAPI.getAllCommon(),
        workflowsAPI.getAllCommon(),
      ]);
      setDocumentTypes(Array.isArray(typesRes) ? typesRes : []);
      setWorkflows(Array.isArray(workflowsRes) ? workflowsRes : []);
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredDocumentTypes = documentTypes.filter(
    (dt) =>
      dt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dt.code.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDoc) {
        await documentTypesAPI.update(editingDoc._id, {
          name: formData.name,
          code: formData.code,
          description: formData.description,
          rules: formData.rules,
          integrationSettings: formData.integrationSettings,
          reviewCycle: formData.reviewCycle,
          workflow: formData.workflow || undefined,
        });
        toast.success("Document type updated successfully");
      } else {
        await documentTypesAPI.create({
          name: formData.name,
          code: formData.code,
          description: formData.description,
          visibility: [],
          rules: formData.rules,
          integrationSettings: formData.integrationSettings,
          reviewCycle: formData.reviewCycle,
          workflow: formData.workflow || undefined,
        } as unknown as CreateDocumentTypeDto);
        toast.success("Document type created successfully");
      }
      closeModal();
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Operation failed");
    }
  };

  const handleEdit = (doc: DocumentType) => {
    setEditingDoc(doc);
    const workflowId =
      typeof doc.workflow === "string"
        ? doc.workflow
        : (doc.workflow?._id ?? "");
    setFormData({
      ...getInitialFormData(),
      name: doc.name,
      code: doc.code,
      description: doc.description,
      rules: doc.rules || [],
      integrationSettings: doc.integrationSettings || [],
      reviewCycle: doc.reviewCycle ?? 12,
      workflow: workflowId,
    });
    setShowModal(true);
  };

  const openDeleteConfirm = (id: string) => {
    setDocToDelete({ id });
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!docToDelete) return;
    try {
      await documentTypesAPI.delete(docToDelete.id);
      toast.success("Document type deleted successfully");
      fetchData();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to delete document type",
      );
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingDoc(null);
    setFormData(getInitialFormData());
  };

  const toggleArray = <T,>(arr: T[], value: T, setter: (v: T[]) => void) => {
    if (arr.includes(value)) {
      setter(arr.filter((x) => x !== value));
    } else {
      setter([...arr, value]);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn min-h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Document Types</h1>
          <p className="text-secondary-400">
            Manage common document types (not tied to any client)
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Document Type
        </button>
      </div>

      {/* Search */}
      <div className="glass-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input
            type="text"
            placeholder="Search by name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-secondary-500 hover:text-white hover:bg-secondary-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Document Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
        {loading && documentTypes.length > 0 && (
          <div className="absolute -top-6 left-0 w-full h-1 bg-secondary-800 overflow-hidden z-20 rounded-full">
            <div className="h-full bg-primary-500 w-1/3 animate-[slide_1.5s_ease-in-out_infinite]"></div>
          </div>
        )}

        {loading && documentTypes.length === 0 ? (
          <div className="col-span-full">
            <GridSkeleton itemCount={6} hasHeader={false} hasFilters={false} />
          </div>
        ) : (
          <>
            {filteredDocumentTypes.map((doc) => (
              <div
                key={doc._id}
                className="glass-card p-6 hover:border-primary-500/30 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/10 border border-primary-500/20">
                    <FileStack className="w-6 h-6 text-primary-400" />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(doc)}
                      className="p-2 rounded-lg hover:bg-secondary-700/50 text-secondary-400 hover:text-white transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openDeleteConfirm(doc._id)}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-secondary-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-white">
                    {doc.name}
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-secondary-700 text-secondary-300">
                    {doc.code}
                  </span>
                </div>
                {doc.description && (
                  <p className="text-sm text-secondary-400 line-clamp-2 mb-3">
                    {doc.description}
                  </p>
                )}
                <div className="text-xs text-secondary-500 space-y-1">
                  <p>Review cycle: {doc.reviewCycle} months</p>
                  {doc.createdAt && (
                    <p>
                      Created: {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {filteredDocumentTypes.length === 0 && (
              <div className="col-span-full text-center py-12 min-h-[70vh]">
                <FileStack className="w-12 h-12 text-secondary-600 mx-auto mb-4" />
                <p className="text-secondary-400">No document types found</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      <SlideInModal
        isOpen={showModal}
        onClose={closeModal}
        title={editingDoc ? "Edit Document Type" : "Add New Document Type"}
        icon={FileStack}
        iconColor="emerald"
        badges={
          editingDoc ? [{ label: editingDoc.code, variant: "default" }] : []
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
              form="doctype-form"
              className="btn-primary flex-1"
            >
              {editingDoc ? "Update Document Type" : "Create Document Type"}
            </button>
          </div>
        }
      >
        <form id="doctype-form" onSubmit={handleSubmit} className="space-y-6">
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
                  placeholder="e.g. Standard Operating Procedure"
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
                  placeholder="e.g. SOP"
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
                  placeholder="Description of this document type"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">
                  Review cycle (months)
                </label>
                <input
                  type="number"
                  min={1}
                  value={formData.reviewCycle}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reviewCycle: parseInt(e.target.value, 10) || 1,
                    })
                  }
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">
                  Workflow
                </label>
                <select
                  value={formData.workflow ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, workflow: e.target.value })
                  }
                  className="input-field"
                >
                  <option value="">No workflow</option>
                  {workflows.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.name}
                    </option>
                  ))}
                </select>
                {workflows.length === 0 && (
                  <p className="text-xs text-secondary-500 mt-1">
                    No common workflows. Add them in Workflows first.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="glass-card p-4">
            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">
              Rules
            </h3>
            <div className="flex flex-wrap gap-2">
              {RULE_OPTIONS.map((rule) => (
                <button
                  key={rule}
                  type="button"
                  onClick={() =>
                    toggleArray(formData.rules || [], rule, (v) =>
                      setFormData({ ...formData, rules: v }),
                    )
                  }
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    (formData.rules || []).includes(rule)
                      ? "bg-primary-500/30 text-primary-300 border border-primary-500/50"
                      : "bg-secondary-700/50 text-secondary-400 border border-secondary-600 hover:border-secondary-500"
                  }`}
                >
                  {RULE_LABELS[rule] ?? rule}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card p-4">
            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">
              Integration Settings
            </h3>
            <div className="flex flex-wrap gap-2">
              {INTEGRATION_OPTIONS.map((intg) => (
                <button
                  key={intg}
                  type="button"
                  onClick={() =>
                    toggleArray(formData.integrationSettings || [], intg, (v) =>
                      setFormData({
                        ...formData,
                        integrationSettings: v,
                      }),
                    )
                  }
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    (formData.integrationSettings || []).includes(intg)
                      ? "bg-primary-500/30 text-primary-300 border border-primary-500/50"
                      : "bg-secondary-700/50 text-secondary-400 border border-secondary-600 hover:border-secondary-500"
                  }`}
                >
                  {INTEGRATION_LABELS[intg] ?? intg}
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
        title="Delete Document Type"
        message="Are you sure you want to delete this document type? This action cannot be undone."
        confirmText="Delete Document Type"
        variant="danger"
      />
    </div>
  );
};
