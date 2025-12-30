import clsx from "clsx";
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  FileText,
  Filter,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Accreditation } from "../api/accreditations";
import { accreditationsAPI } from "../api/accreditations";
import { questionsAPI } from "../api/questions";
import { templatesAPI } from "../api/templates";
import type { CreateTemplateDto, OnboardingTemplate, Question } from "../types";

// Autocomplete component for facilityType and triggerIds
interface AutocompleteInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: string[];
  placeholder?: string;
  label: string;
}

const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  value,
  onChange,
  options,
  placeholder = "Type to search...",
  label,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    const term = searchTerm.toLowerCase();
    return options.filter((opt) => opt.toLowerCase().includes(term));
  }, [options, searchTerm]);

  const handleSelect = (option: string) => {
    if (!value.includes(option)) {
      onChange([...value, option]);
    }
    setSearchTerm("");
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleRemove = (option: string) => {
    onChange(value.filter((v) => v !== option));
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-secondary-300 mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          className="input-field"
          placeholder={placeholder}
        />
        {isOpen && filteredOptions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-secondary-800 border border-secondary-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredOptions
              .filter((opt) => !value.includes(opt))
              .slice(0, 10)
              .map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className="w-full text-left px-4 py-2 hover:bg-secondary-700 text-white transition-colors"
                >
                  {option}
                </button>
              ))}
          </div>
        )}
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {value.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary-500/20 text-primary-300 text-sm"
            >
              {item}
              <button
                type="button"
                onClick={() => handleRemove(item)}
                className="hover:text-primary-200"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const templateTypes: Array<{ value: string; label: string }> = [
  { value: "document", label: "Document" },
  { value: "form_and_logs", label: "Form and Logs" },
  { value: "incident_report", label: "Incident Report" },
  { value: "capa", label: "CAPA" },
];

export const Templates: React.FC = () => {
  const [templates, setTemplates] = useState<OnboardingTemplate[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [accreditations, setAccreditations] = useState<Accreditation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [templateTypeFilter, setTemplateTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTemplates, setTotalTemplates] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<OnboardingTemplate | null>(null);
  const [formData, setFormData] = useState<CreateTemplateDto>({
    id: "",
    name: "",
    templateType: "document",
    type: "",
    accreditation: [],
    facilityType: [],
    triggerIds: [],
    relatedDocuments: [],
    content: "",
  });

  // Build autocomplete options from questions
  const autocompleteOptions = useMemo(() => {
    const options = new Set<string>();
    questions.forEach((q) => {
      // Add question ID
      options.add(q.questionId);
      // Add all option IDs
      q.options.forEach((opt) => {
        options.add(opt.id);
      });
    });
    return Array.from(options).sort();
  }, [questions]);

  // Get accreditation options from API (accreditations without client)
  const accreditationOptions = useMemo(() => {
    return accreditations.map((acc) => acc.name || acc.code).filter(Boolean);
  }, [accreditations]);

  const fetchQuestions = async () => {
    try {
      const response = await questionsAPI.getAll({ limit: 1000 });
      setQuestions(response.data || []);
    } catch (error) {
      console.error("Failed to fetch questions:", error);
    }
  };

  const fetchAccreditations = async () => {
    try {
      // Fetch accreditations without client (no clientId parameter)
      const accreditationsList = await accreditationsAPI.getAll();
      setAccreditations(accreditationsList || []);
    } catch (error) {
      console.error("Failed to fetch accreditations:", error);
      toast.error("Failed to load accreditations");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const query: any = {
        page,
        limit,
      };
      if (searchQuery) query.search = searchQuery;
      if (templateTypeFilter !== "all") query.templateType = templateTypeFilter;

      const response = await templatesAPI.getAll(query);
      setTemplates(response.data || []);
      setTotalPages(response.totalPages || 1);
      setTotalTemplates(response.total || 0);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to fetch templates"
      );
    } finally {
      setLoading(false);
    }
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, templateTypeFilter]);

  useEffect(() => {
    fetchQuestions();
    fetchAccreditations();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [page, limit, searchQuery, templateTypeFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.accreditation.length === 0) {
      toast.error("At least one accreditation is required");
      return;
    }

    if (formData.triggerIds.length === 0) {
      toast.error("At least one trigger ID is required");
      return;
    }

    try {
      if (editingTemplate) {
        await templatesAPI.update(editingTemplate._id, formData);
        toast.success("Template updated successfully");
      } else {
        await templatesAPI.create(formData);
        toast.success("Template created successfully");
      }
      closeModal();
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Operation failed");
    }
  };

  const handleEdit = (template: OnboardingTemplate) => {
    setEditingTemplate(template);
    setFormData({
      id: template.id,
      name: template.name,
      templateType: template.templateType,
      type: template.type,
      accreditation: template.accreditation || [],
      facilityType: template.facilityType || [],
      triggerIds: template.triggerIds || [],
      relatedDocuments: template.relatedDocuments || [],
      content: template.content || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      await templatesAPI.delete(id);
      toast.success("Template deleted successfully");
      fetchData();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to delete template"
      );
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTemplate(null);
    setFormData({
      id: "",
      name: "",
      templateType: "document",
      type: "",
      accreditation: [],
      facilityType: [],
      triggerIds: [],
      relatedDocuments: [],
      content: "",
    });
  };

  if (loading && templates.length === 0) {
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
          <h1 className="text-3xl font-bold text-white mb-2">Templates</h1>
          <p className="text-secondary-400">
            Manage onboarding templates for documents, forms, and reports
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Template
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <select
            value={templateTypeFilter}
            onChange={(e) => setTemplateTypeFilter(e.target.value)}
            className="input-field pl-10 pr-8 min-w-[150px]"
          >
            <option value="all" className="bg-secondary-800">
              All Types
            </option>
            {templateTypes.map((tt) => (
              <option
                key={tt.value}
                value={tt.value}
                className="bg-secondary-800"
              >
                {tt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Templates Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-secondary-700/50">
                <th className="table-header">Template ID</th>
                <th className="table-header max-w-xs">Name</th>
                <th className="table-header">Type</th>
                <th className="table-header">Doc Type</th>
                <th className="table-header">Accreditations</th>
                <th className="table-header">Facility Types</th>
                <th className="table-header">Trigger IDs</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template, index) => (
                <tr
                  key={template._id}
                  className="border-b border-secondary-700/30 hover:bg-secondary-800/30 transition-colors animate-fadeIn"
                  style={{ animationDelay: `${index * 0.03}s` }}
                >
                  <td className="table-cell">
                    <span className="font-mono text-sm text-primary-400">
                      {template.id}
                    </span>
                  </td>
                  <td className="table-cell max-w-xs">
                    <div className="min-w-0">
                      <p
                        className="font-medium text-white truncate"
                        title={template.name}
                      >
                        {template.name}
                      </p>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400 capitalize">
                      {template.templateType.replace("_", " ")}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className="text-secondary-300">{template.type}</span>
                  </td>
                  <td className="table-cell">
                    <div className="flex flex-wrap gap-1">
                      {template.accreditation?.slice(0, 2).map((acc) => (
                        <span
                          key={acc}
                          className="px-2 py-0.5 rounded bg-secondary-800 text-xs text-secondary-300"
                        >
                          {acc}
                        </span>
                      ))}
                      {template.accreditation &&
                        template.accreditation.length > 2 && (
                          <span className="text-xs text-secondary-500">
                            +{template.accreditation.length - 2}
                          </span>
                        )}
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className="text-secondary-300 text-xs">
                      {template.facilityType?.length || 0} type
                      {template.facilityType?.length !== 1 ? "s" : ""}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className="text-secondary-300 text-xs">
                      {template.triggerIds?.length || 0} trigger
                      {template.triggerIds?.length !== 1 ? "s" : ""}
                    </span>
                  </td>
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(template)}
                        className="p-2 rounded-lg hover:bg-secondary-700/50 text-secondary-400 hover:text-white transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(template._id)}
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

          {templates.length === 0 && !loading && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-secondary-600 mx-auto mb-4" />
              <p className="text-secondary-400">No templates found</p>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-secondary-700/30 flex items-center justify-between">
          <p className="text-sm text-secondary-400">
            Showing{" "}
            <span className="font-medium text-white">
              {templates.length > 0 ? (page - 1) * limit + 1 : 0}
            </span>{" "}
            to{" "}
            <span className="font-medium text-white">
              {Math.min(page * limit, totalTemplates)}
            </span>{" "}
            of <span className="font-medium text-white">{totalTemplates}</span>{" "}
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
          <div className="glass-card w-full max-w-3xl p-6 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingTemplate ? "Edit Template" : "Add New Template"}
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
                    Template ID *
                  </label>
                  <input
                    type="text"
                    value={formData.id}
                    onChange={(e) =>
                      setFormData({ ...formData, id: e.target.value })
                    }
                    className="input-field"
                    placeholder="e.g., DOC-QUALITY-POLICY"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-300 mb-2">
                    Template Type *
                  </label>
                  <select
                    value={formData.templateType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        templateType: e.target.value as any,
                      })
                    }
                    className="input-field"
                    required
                  >
                    {templateTypes.map((tt) => (
                      <option
                        key={tt.value}
                        value={tt.value}
                        className="bg-secondary-800"
                      >
                        {tt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="input-field"
                  placeholder="Template name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">
                  Document Type *
                </label>
                <input
                  type="text"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="input-field"
                  placeholder="e.g., Policy, Manual, SOP"
                  required
                />
              </div>

              <AutocompleteInput
                value={formData.accreditation}
                onChange={(value) =>
                  setFormData({ ...formData, accreditation: value })
                }
                options={accreditationOptions}
                placeholder="Search accreditations..."
                label="Accreditations *"
              />

              <AutocompleteInput
                value={formData.facilityType || []}
                onChange={(value) =>
                  setFormData({ ...formData, facilityType: value })
                }
                options={autocompleteOptions.filter((opt) =>
                  opt.startsWith("FT_")
                )}
                placeholder="Search Option IDs..."
                label="Facility Types (optional)"
              />

              <AutocompleteInput
                value={formData.triggerIds}
                onChange={(value) =>
                  setFormData({ ...formData, triggerIds: value })
                }
                options={autocompleteOptions}
                placeholder="Search Option IDs..."
                label="Trigger IDs *"
              />

              {formData.templateType === "document" && (
                <div>
                  <label className="block text-sm font-medium text-secondary-300 mb-2">
                    Content (HTML)
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    className="input-field min-h-[200px] resize-none font-mono text-sm"
                    placeholder="HTML content for document template"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editingTemplate ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
