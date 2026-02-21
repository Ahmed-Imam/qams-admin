import {
  Edit,
  FileText,
  GripVertical,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type {
  CapaTrigger,
  Form,
  FormField,
  FormFieldType,
  FormType,
} from "../api/forms";
import { formsAPI } from "../api/forms";
import { SlideInModal } from "../components/SlideInModal";
import { ConfirmationModal } from "../components/ConfirmationModal";

const FIELD_TYPE_OPTIONS: { value: FormFieldType; label: string }[] = [
  { value: "text_input", label: "Text Input" },
  { value: "text_area", label: "Text Area" },
  { value: "dropdown", label: "Dropdown" },
  { value: "checkbox", label: "Checkbox" },
  { value: "date", label: "Date" },
  { value: "file_upload", label: "File Upload" },
];

/** Stable id for list key and lookups; does not change when user edits field name */
type FormFieldWithId = FormField & { _id: string };

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: Form | null;
  mode: "create" | "edit";
  formType: FormType;
  onSuccess: () => void;
}

const FormModal: React.FC<FormModalProps> = ({
  isOpen,
  onClose,
  form,
  mode,
  formType,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<"info" | "fields" | "advanced">(
    "info",
  );
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    formType: formType as FormType,
    capaRequired: false,
    formFields: [] as FormFieldWithId[],
    capaTriggers: [] as CapaTrigger[],
  });
  const [fieldOptionsText, setFieldOptionsText] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    if (form && mode === "edit") {
      const fields: FormFieldWithId[] = (form.formFields || []).map((f, i) => ({
        ...f,
        name: f.name || `field_${i}`,
        _id: `f_${i}_${Date.now()}`,
      }));
      setFormData({
        name: form.name || "",
        description: form.description || "",
        formType: (form.formType as FormType) || formType,
        capaRequired: form.capaRequired || false,
        formFields: fields,
        capaTriggers:
          form.capaTriggers?.map((t) => ({ field: t.field, value: t.value })) ||
          [],
      });
      const optionsText: Record<string, string> = {};
      fields.forEach((field) => {
        if (field.type === "dropdown" && field.options?.length) {
          optionsText[field._id] = field.options.join("\n");
        }
      });
      setFieldOptionsText(optionsText);
    } else {
      setFormData({
        name: "",
        description: "",
        formType: formType,
        capaRequired: false,
        formFields: [],
        capaTriggers: [],
      });
      setFieldOptionsText({});
    }
  }, [form, mode, formType, isOpen]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.warning("Form name is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        formType: formData.formType,
        capaRequired: formData.capaRequired,
        formFields: formData.formFields.map(({ _id, ...f }) => ({
          name: f.name,
          label: f.label,
          type: f.type,
          placeholder: f.placeholder || undefined,
          required: f.required ?? false,
          options: f.type === "dropdown" ? f.options || [] : undefined,
        })),
        capaTriggers: formData.capaTriggers?.length
          ? formData.capaTriggers
          : undefined,
      };
      if (mode === "edit" && form?._id) {
        await formsAPI.update(form._id, payload);
        toast.success("Form updated successfully");
      } else {
        await formsAPI.create(payload);
        toast.success("Form created successfully");
      }
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Operation failed";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const addField = useCallback(() => {
    const _id = `field_${Date.now()}`;
    setFormData((prev) => ({
      ...prev,
      formFields: [
        ...prev.formFields,
        {
          _id,
          name: _id,
          label: "New Field",
          type: "text_input" as FormFieldType,
          required: false,
        },
      ],
    }));
  }, []);

  const updateField = useCallback(
    (fieldId: string, updates: Partial<FormField>) => {
      setFormData((prev) => {
        const idx = prev.formFields.findIndex((f) => f._id === fieldId);
        if (idx === -1) return prev;
        const next = [...prev.formFields];

        let newUpdates = { ...updates };
        if (newUpdates.label !== undefined) {
          const timestamp = Date.now();
          const labelForId =
            newUpdates.label.replace(/\s+/g, "_").toLowerCase() || "field";
          newUpdates.name = `${labelForId}_${timestamp}`;
        }

        if (
          newUpdates.type &&
          next[idx].type !== newUpdates.type &&
          newUpdates.type !== "dropdown"
        ) {
          const u = { ...next[idx], ...newUpdates };
          delete (u as Partial<FormField>).options;
          next[idx] = u;
        } else {
          next[idx] = { ...next[idx], ...newUpdates };
        }
        return { ...prev, formFields: next };
      });
    },
    [],
  );

  const removeField = useCallback((fieldId: string) => {
    setFormData((prev) => ({
      ...prev,
      formFields: prev.formFields.filter((f) => f._id !== fieldId),
    }));
    setFieldOptionsText((prev) => {
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  }, []);

  const moveField = useCallback((fieldId: string, direction: "up" | "down") => {
    setFormData((prev) => {
      const fields = [...prev.formFields];
      const idx = fields.findIndex((f) => f._id === fieldId);
      if (idx === -1) return prev;
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= fields.length) return prev;
      [fields[idx], fields[newIdx]] = [fields[newIdx], fields[idx]];
      return { ...prev, formFields: fields };
    });
  }, []);

  if (!isOpen) return null;

  return (
    <SlideInModal
      isOpen={isOpen}
      onClose={() => {
        setActiveTab("info");
        onClose();
      }}
      title={
        (mode === "edit" ? "Edit Form" : "Add Form") +
        (formType === "incident" ? " (Incident Report)" : "")
      }
      icon={FileText}
      iconColor={mode === "edit" ? "amber" : "primary"}
      badges={[
        {
          label: mode === "edit" ? "Editing" : "New",
          variant: mode === "edit" ? "primary" : "default",
        },
      ]}
      size="lg"
      footer={
        <div className="flex gap-3 w-full">
          <button
            type="button"
            onClick={() => {
              setActiveTab("info");
              onClose();
            }}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === "edit" ? "Update" : "Create"}
          </button>
        </div>
      }
    >
      <div className="flex gap-1 pb-4 border-b border-secondary-700/30 mb-6 shrink-0">
        {(["info", "fields", "advanced"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-primary-500/30 text-primary-300 border border-primary-500/50"
                : "text-secondary-400 hover:text-white border border-transparent hover:bg-secondary-700/30"
            }`}
          >
            {tab === "info" ? "Info" : tab === "fields" ? "Fields" : "CAPA"}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {activeTab === "info" && (
          <>
            <div>
              <label className="block text-sm font-medium text-secondary-300 mb-2">
                Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="input-field"
                placeholder="e.g. Risk Assessment Form"
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
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="input-field min-h-[80px] resize-none"
                placeholder="Describe the purpose of this form"
              />
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary-800/50 border border-secondary-700/50">
              <input
                type="checkbox"
                id="capaRequired"
                checked={formData.capaRequired}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    capaRequired: e.target.checked,
                  }))
                }
                className="w-4 h-4 rounded border-secondary-600 text-primary-500 focus:ring-primary-500"
              />
              <label
                htmlFor="capaRequired"
                className="text-sm font-medium text-secondary-300 cursor-pointer"
              >
                CAPA required after form submission
              </label>
            </div>
          </>
        )}

        {activeTab === "fields" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">Form Fields</h3>
              <button
                type="button"
                onClick={addField}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Field
              </button>
            </div>
            {formData.formFields.length === 0 ? (
              <div className="text-center py-8 text-secondary-500">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No fields yet. Add fields to build your form.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.formFields.map((field, index) => (
                  <div
                    key={field._id}
                    className="glass-card p-4 border border-secondary-700/50"
                  >
                    <div className="flex items-start gap-2 mb-3">
                      <div className="flex items-center gap-1 pt-1">
                        <button
                          type="button"
                          onClick={() => moveField(field._id, "up")}
                          disabled={index === 0}
                          className="p-1.5 text-secondary-400 hover:text-white disabled:opacity-30 rounded"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveField(field._id, "down")}
                          disabled={index === formData.formFields.length - 1}
                          className="p-1.5 text-secondary-400 hover:text-white disabled:opacity-30 rounded"
                        >
                          ↓
                        </button>
                      </div>
                      <GripVertical className="w-4 h-4 text-secondary-500 flex-shrink-0 mt-1" />
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-secondary-400 mb-1">
                            Label
                          </label>
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) =>
                              updateField(field._id, {
                                label: e.target.value,
                              })
                            }
                            className="input-field text-sm"
                            placeholder="e.g. Full Name"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-secondary-400 mb-1">
                            Field Id
                          </label>
                          <input
                            type="text"
                            value={field.name}
                            readOnly
                            className="input-field text-sm bg-secondary-800/50 cursor-not-allowed opacity-70"
                            placeholder="Auto-generated"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <label className="flex items-center gap-2 text-sm text-secondary-400">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) =>
                              updateField(field._id, {
                                required: e.target.checked,
                              })
                            }
                            className="w-4 h-4 rounded border-secondary-600 text-primary-500"
                          />
                          Required
                        </label>
                        <button
                          type="button"
                          onClick={() => removeField(field._id)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-secondary-400 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <div>
                        <label className="block text-xs font-medium text-secondary-400 mb-1">
                          Type
                        </label>
                        <select
                          value={field.type}
                          onChange={(e) =>
                            updateField(field._id, {
                              type: e.target.value as FormFieldType,
                            })
                          }
                          className="input-field text-sm"
                        >
                          {FIELD_TYPE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-secondary-400 mb-1">
                          Placeholder
                        </label>
                        <input
                          type="text"
                          value={field.placeholder || ""}
                          onChange={(e) =>
                            updateField(field._id, {
                              placeholder: e.target.value,
                            })
                          }
                          className="input-field text-sm"
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                    {field.type === "dropdown" && (
                      <div className="mt-3">
                        <label className="block text-xs font-medium text-secondary-400 mb-1">
                          Options (one per line)
                        </label>
                        <textarea
                          value={
                            fieldOptionsText[field._id] ??
                            field.options?.join("\n") ??
                            ""
                          }
                          onChange={(e) => {
                            const text = e.target.value;
                            setFieldOptionsText((prev) => ({
                              ...prev,
                              [field._id]: text,
                            }));
                            const options = text
                              .split("\n")
                              .map((o) => o.trim())
                              .filter(Boolean);
                            updateField(field._id, { options });
                          }}
                          className="input-field text-sm min-h-[80px] resize-y"
                          placeholder="Option 1&#10;Option 2"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "advanced" && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">CAPA Triggers</h3>
            <p className="text-sm text-secondary-400">
              Configure automatic CAPA creation based on field responses.
            </p>
            <div className="space-y-3">
              {formData.capaTriggers.map((trigger, index) => (
                <div
                  key={index}
                  className="glass-card p-4 flex items-center gap-3 flex-wrap"
                >
                  <select
                    value={trigger.field}
                    onChange={(e) => {
                      const next = [...formData.capaTriggers];
                      next[index] = { ...next[index], field: e.target.value };
                      setFormData((prev) => ({
                        ...prev,
                        capaTriggers: next,
                      }));
                    }}
                    className="input-field flex-1 min-w-[120px]"
                  >
                    <option value="">Select field</option>
                    {formData.formFields.map((f) => (
                      <option key={f.name} value={f.name}>
                        {f.label || f.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={trigger.value}
                    onChange={(e) => {
                      const next = [...formData.capaTriggers];
                      next[index] = { ...next[index], value: e.target.value };
                      setFormData((prev) => ({
                        ...prev,
                        capaTriggers: next,
                      }));
                    }}
                    className="input-field flex-1 min-w-[120px]"
                    placeholder="Value that triggers CAPA"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        capaTriggers: prev.capaTriggers.filter(
                          (_, i) => i !== index,
                        ),
                      }))
                    }
                    className="p-2 rounded-lg hover:bg-red-500/10 text-secondary-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    capaTriggers: [
                      ...prev.capaTriggers,
                      { field: "", value: "" },
                    ],
                  }))
                }
                className="w-full py-3 rounded-lg border-2 border-dashed border-secondary-600 text-secondary-400 hover:border-primary-500/50 hover:text-primary-400 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add CAPA Trigger
              </button>
            </div>
          </div>
        )}
      </div>
    </SlideInModal>
  );
};

type TabKind = "forms" | "incidents";

export const Forms: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKind>("forms");
  const [forms, setForms] = useState<Form[]>([]);
  const [incidents, setIncidents] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingForm, setEditingForm] = useState<Form | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [formToDelete, setFormToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const formType: FormType = activeTab === "incidents" ? "incident" : "normal";
  const list = activeTab === "forms" ? forms : incidents;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [formsRes, incidentsRes] = await Promise.all([
        formsAPI.getCommon({ formType: "normal" }),
        formsAPI.getCommon({ formType: "incident" }),
      ]);
      setForms(Array.isArray(formsRes) ? formsRes : []);
      setIncidents(Array.isArray(incidentsRes) ? incidentsRes : []);
    } catch {
      toast.error("Failed to fetch forms");
      setForms([]);
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const filteredList = list.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.description || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleAdd = () => {
    setEditingForm(null);
    setModalMode("create");
    setShowModal(true);
  };

  const handleEdit = (form: Form) => {
    setEditingForm(form);
    setModalMode("edit");
    setShowModal(true);
  };

  const openDeleteConfirm = (form: Form) => {
    setFormToDelete({ id: form._id, name: form.name });
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!formToDelete) return;
    try {
      await formsAPI.delete(formToDelete.id);
      toast.success("Form deleted");
      fetchAll();
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to delete";
      toast.error(msg);
      throw error;
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingForm(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Forms</h1>
          <p className="text-secondary-400">
            Manage common forms and incident reports (not tied to any client)
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add {activeTab === "incidents" ? "Incident Report" : "Form"}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 flex-shrink-0">
        <div className="flex rounded-xl overflow-hidden border border-secondary-700/50 bg-secondary-900/50 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("forms")}
            className={`px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
              activeTab === "forms"
                ? "bg-primary-500/30 text-primary-300"
                : "text-secondary-400 hover:text-white"
            }`}
          >
            Forms
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("incidents")}
            className={`px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
              activeTab === "incidents"
                ? "bg-primary-500/30 text-primary-300"
                : "text-secondary-400 hover:text-white"
            }`}
          >
            Incident Reports
          </button>
        </div>
        <div className="flex-1 glass-card p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
            <input
              type="text"
              placeholder="Search by name or description..."
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
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-4">
          {filteredList.map((form, index) => (
            <div
              key={form._id}
              className="glass-card p-6 hover:border-primary-500/30 transition-all duration-300 animate-fadeIn"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/10 border border-primary-500/20">
                  <FileText className="w-6 h-6 text-primary-400" />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(form)}
                    className="p-2 rounded-lg hover:bg-secondary-700/50 text-secondary-400 hover:text-white transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openDeleteConfirm(form)}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-secondary-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {form.name}
              </h3>
              {form.description && (
                <p className="text-sm text-secondary-400 line-clamp-2 mb-3">
                  {form.description}
                </p>
              )}
              <div className="text-xs text-secondary-500 space-y-1">
                <p>{form.formFields?.length ?? 0} fields</p>
                {form.capaRequired && (
                  <span className="inline-block px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
                    CAPA required
                  </span>
                )}
                {form.createdAt && (
                  <p>
                    Created: {new Date(form.createdAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          ))}
          {filteredList.length === 0 && (
            <div className="col-span-full text-center py-12">
              <FileText className="w-12 h-12 text-secondary-600 mx-auto mb-4" />
              <p className="text-secondary-400">
                No {activeTab === "incidents" ? "incident reports" : "forms"}{" "}
                found
              </p>
            </div>
          )}
        </div>
      </div>

      <FormModal
        isOpen={showModal}
        onClose={closeModal}
        form={editingForm}
        mode={modalMode}
        formType={formType}
        onSuccess={fetchAll}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Form"
        message="Are you sure you want to delete this form? This action cannot be undone."
        itemName={formToDelete?.name}
        confirmText="Delete Form"
        variant="danger"
      />
    </div>
  );
};
