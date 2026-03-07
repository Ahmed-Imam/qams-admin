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
import { SlideInModal } from "../components/SlideInModal";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { TableSkeleton } from "../components/TableSkeleton";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Accreditation } from "../api/accreditations";
import { accreditationsAPI } from "../api/accreditations";
import { checklistV2API, type CommonChecklist } from "../api/checklistV2";
import { documentTypesAPI } from "../api/documentTypes";
import { formsAPI, type Form } from "../api/forms";
import { questionsAPI } from "../api/questions";
import { templatesAPI } from "../api/templates";
import type {
  CreateTemplateDto,
  DocumentType,
  OnboardingTemplate,
  Question,
} from "../types";

import { ModalSelectInput } from "../components/ModalSelectInput";
import type { SelectOption } from "../components/MultiSelectModal";

const templateTypes: Array<{ value: string; label: string }> = [
  { value: "document", label: "Document" },
  { value: "form_and_logs", label: "Form and Logs" },
  { value: "incident_report", label: "Incident Report" },
  { value: "capa", label: "CAPA" },
  { value: "checklist", label: "Checklist" },
];

export const Templates: React.FC = () => {
  const [templates, setTemplates] = useState<OnboardingTemplate[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [accreditations, setAccreditations] = useState<Accreditation[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [templateTypeFilter, setTemplateTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTemplates, setTotalTemplates] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "content">("details");
  const [editingTemplate, setEditingTemplate] =
    useState<OnboardingTemplate | null>(null);

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<{
    id: string;
  } | null>(null);
  const [commonForms, setCommonForms] = useState<Form[]>([]);
  const [commonIncidents, setCommonIncidents] = useState<Form[]>([]);
  const [commonChecklists, setCommonChecklists] = useState<CommonChecklist[]>(
    [],
  );
  const [formsLoading, setFormsLoading] = useState(false);
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
    form: undefined,
    checklist: undefined,
  });

  // Build autocomplete options from questions
  const triggerOptions = useMemo(() => {
    const optionsMap = new Map<string, SelectOption>();
    questions.forEach((q) => {
      // Add question ID
      if (!optionsMap.has(q.questionId)) {
        optionsMap.set(q.questionId, {
          value: q.questionId,
          label: q.questionId,
          description: `Question: ${q.questionTitle}`,
        });
      }
      // Add all option IDs
      q.options.forEach((opt) => {
        if (!optionsMap.has(opt.id)) {
          optionsMap.set(opt.id, {
            value: opt.id,
            label: `${opt.id} (${opt.label})`,
            description: `Option for: ${q.questionTitle}`,
          });
        }
      });
    });
    return Array.from(optionsMap.values()).sort((a, b) =>
      a.value.localeCompare(b.value),
    );
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

  const fetchDocumentTypes = async () => {
    try {
      const types = await documentTypesAPI.getAllCommon();
      setDocumentTypes(Array.isArray(types) ? types : []);
    } catch (error) {
      console.error("Failed to fetch document types:", error);
      toast.error("Failed to load document types");
    }
  };

  const fetchCommonFormsAndIncidents = async () => {
    setFormsLoading(true);
    try {
      const [forms, incidents, checklistsRes] = await Promise.all([
        formsAPI.getCommon({ formType: "normal" }),
        formsAPI.getCommon({ formType: "incident" }),
        checklistV2API.getCommon({ pageSize: 500 }),
      ]);
      setCommonForms(Array.isArray(forms) ? forms : []);
      setCommonIncidents(Array.isArray(incidents) ? incidents : []);
      setCommonChecklists(
        Array.isArray(checklistsRes?.items) ? checklistsRes.items : [],
      );
    } catch (error) {
      console.error("Failed to fetch forms/checklists:", error);
      setCommonForms([]);
      setCommonIncidents([]);
      setCommonChecklists([]);
    } finally {
      setFormsLoading(false);
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
        error?.response?.data?.message || "Failed to fetch templates",
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
    fetchDocumentTypes();
  }, []);

  useEffect(() => {
    if (showModal) {
      fetchCommonFormsAndIncidents();
    }
  }, [showModal]);

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

    if (
      (formData.templateType === "form_and_logs" ||
        formData.templateType === "incident_report") &&
      !formData.form
    ) {
      toast.error(
        formData.templateType === "incident_report"
          ? "Please select an incident report"
          : "Please select a form",
      );
      return;
    }

    if (formData.templateType === "checklist" && !formData.checklist) {
      toast.error("Please select a checklist");
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
    const formId: string | undefined =
      typeof template.form === "object" && template.form?._id
        ? template.form._id
        : typeof template.form === "string"
          ? template.form
          : undefined;
    const checklistId: string | undefined =
      typeof template.checklist === "object" && template.checklist?._id
        ? (template.checklist as { _id: string })._id
        : typeof template.checklist === "string"
          ? template.checklist
          : undefined;
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
      form: formId,
      checklist: checklistId,
    });
    setShowModal(true);
  };

  const openDeleteConfirm = (id: string) => {
    setTemplateToDelete({ id });
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!templateToDelete) return;
    try {
      await templatesAPI.delete(templateToDelete.id);
      toast.success("Template deleted successfully");
      fetchData();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to delete template",
      );
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setActiveTab("details");
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
      form: undefined,
      checklist: undefined,
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn overflow-hidden">
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
      <div className="flex-1 glass-card flex flex-col h-[calc(100vh-16.5rem)]">
        {loading && templates.length === 0 ? (
          <TableSkeleton
            columns={7}
            rows={10}
            hasHeader={false}
            hasFilters={false}
          />
        ) : (
          <>
            {loading && templates.length > 0 && (
              <div className="absolute top-0 left-0 w-full h-1 bg-secondary-800 overflow-hidden z-20 rounded-t-xl">
                <div className="h-full bg-primary-500 w-1/3 animate-[slide_1.5s_ease-in-out_infinite]"></div>
              </div>
            )}
            <div className="overflow-x-auto flex-1 overflow-y-auto relative custom-scrollbar rounded-t-2xl">
              <table className="w-full relative">
                <thead className="sticky top-0 z-10 bg-secondary-900/95 backdrop-blur-sm shadow-[0_1px_0_0_rgba(255,255,255,0.05)]">
                  <tr className="border-b border-secondary-700/50 ">
                    <th className="table-header ">Template ID</th>
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
                        <span className="text-secondary-300">
                          {template.type}
                        </span>
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
                            onClick={() => openDeleteConfirm(template._id)}
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
            <div className="p-4 border-t border-secondary-700/30 flex items-center justify-between shrink-0 bg-secondary-900/50">
              <p className="text-sm text-secondary-400">
                Showing{" "}
                <span className="font-medium text-white">
                  {templates.length > 0 ? (page - 1) * limit + 1 : 0}
                </span>{" "}
                to{" "}
                <span className="font-medium text-white">
                  {Math.min(page * limit, totalTemplates)}
                </span>{" "}
                of{" "}
                <span className="font-medium text-white">{totalTemplates}</span>{" "}
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
          </>
        )}
      </div>

      {/* Modal */}
      <SlideInModal
        isOpen={showModal}
        onClose={closeModal}
        title={editingTemplate ? "Edit Template" : "Add New Template"}
        icon={FileText}
        iconColor="purple"
        badges={
          editingTemplate
            ? [
                { label: editingTemplate.templateType, variant: "default" },
                { label: editingTemplate.type || "N/A", variant: "default" },
              ]
            : []
        }
        size="lg"
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
              form="template-form"
              className="btn-primary flex-1"
            >
              {editingTemplate ? "Update Template" : "Create Template"}
            </button>
          </div>
        }
      >
        <div className="flex gap-1 pb-4 border-b border-secondary-700/30 mb-6 shrink-0">
          {(["details", "content"] as const).map((tab) => {
            if (tab === "content" && formData.templateType !== "document")
              return null;
            return (
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
                {tab === "details" ? "Details" : "Content"}
              </button>
            );
          })}
        </div>

        <form id="template-form" onSubmit={handleSubmit} className="space-y-6">
          <div className={activeTab === "details" ? "space-y-6" : "hidden"}>
            <div className="glass-card p-4">
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">
                Template Information
              </h3>
              <div className="space-y-4">
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
                      onChange={(e) => {
                        const nextType = e.target
                          .value as CreateTemplateDto["templateType"];
                        const defaultType =
                          nextType === "form_and_logs"
                            ? "Form"
                            : nextType === "incident_report"
                              ? "Incident"
                              : nextType === "checklist"
                                ? "Checklist"
                                : formData.type;
                        if (
                          nextType !== "document" &&
                          activeTab === "content"
                        ) {
                          setActiveTab("details");
                        }
                        setFormData({
                          ...formData,
                          templateType: nextType,
                          type: defaultType,
                          form: undefined,
                          checklist: undefined,
                        });
                      }}
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

                {formData.templateType === "document" && (
                  <div>
                    <label className="block text-sm font-medium text-secondary-300 mb-2">
                      Document Type *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value })
                      }
                      className="input-field"
                      required
                    >
                      <option value="" className="bg-secondary-800">
                        Select document type
                      </option>
                      {documentTypes.map((dt) => (
                        <option
                          key={dt._id}
                          value={dt.code}
                          className="bg-secondary-800"
                        >
                          {dt.name} ({dt.code})
                        </option>
                      ))}
                    </select>
                    {documentTypes.length === 0 && (
                      <p className="text-xs text-secondary-500 mt-1">
                        No common document types. Add them in Document Types
                        first.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="glass-card p-4">
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">
                Related Information
              </h3>
              <div className="space-y-4">
                {formData.templateType === "form_and_logs" && (
                  <div>
                    <label className="block text-sm font-medium text-secondary-300 mb-2">
                      Form *
                    </label>
                    <select
                      value={formData.form ?? ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          form: e.target.value || undefined,
                        })
                      }
                      className="input-field"
                      required
                    >
                      <option value="" className="bg-secondary-800">
                        {formsLoading
                          ? "Loading forms..."
                          : "Select a common form"}
                      </option>
                      {commonForms.map((f) => (
                        <option
                          key={f._id}
                          value={f._id}
                          className="bg-secondary-800"
                        >
                          {f.name}
                        </option>
                      ))}
                    </select>
                    {!formsLoading && commonForms.length === 0 && (
                      <p className="text-xs text-secondary-500 mt-1">
                        No common forms. Add them in Forms first.
                      </p>
                    )}
                  </div>
                )}

                {formData.templateType === "incident_report" && (
                  <div>
                    <label className="block text-sm font-medium text-secondary-300 mb-2">
                      Incident Report *
                    </label>
                    <select
                      value={formData.form ?? ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          form: e.target.value || undefined,
                        })
                      }
                      className="input-field"
                      required
                    >
                      <option value="" className="bg-secondary-800">
                        {formsLoading
                          ? "Loading incident reports..."
                          : "Select a common incident report"}
                      </option>
                      {commonIncidents.map((f) => (
                        <option
                          key={f._id}
                          value={f._id}
                          className="bg-secondary-800"
                        >
                          {f.name}
                        </option>
                      ))}
                    </select>
                    {!formsLoading && commonIncidents.length === 0 && (
                      <p className="text-xs text-secondary-500 mt-1">
                        No common incident reports. Add them in Forms first.
                      </p>
                    )}
                  </div>
                )}

                {formData.templateType === "checklist" && (
                  <div>
                    <label className="block text-sm font-medium text-secondary-300 mb-2">
                      Checklist *
                    </label>
                    <select
                      value={formData.checklist ?? ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          checklist: e.target.value || undefined,
                        })
                      }
                      className="input-field"
                      required
                    >
                      <option value="" className="bg-secondary-800">
                        {formsLoading
                          ? "Loading checklists..."
                          : "Select a common checklist"}
                      </option>
                      {commonChecklists.map((c) => (
                        <option
                          key={c._id}
                          value={c._id}
                          className="bg-secondary-800"
                        >
                          {c.name}
                          {c.code ? ` (${c.code})` : ""}
                        </option>
                      ))}
                    </select>
                    {!formsLoading && commonChecklists.length === 0 && (
                      <p className="text-xs text-secondary-500 mt-1">
                        No common checklists. Add them in Common Checklists
                        first.
                      </p>
                    )}
                  </div>
                )}

                <ModalSelectInput
                  value={formData.accreditation}
                  onChange={(value) =>
                    setFormData({ ...formData, accreditation: value })
                  }
                  options={accreditationOptions}
                  placeholder="Search accreditations..."
                  label="Accreditations *"
                />

                <ModalSelectInput
                  value={formData.facilityType || []}
                  onChange={(value) =>
                    setFormData({ ...formData, facilityType: value })
                  }
                  options={triggerOptions.filter((opt) =>
                    opt.value.startsWith("FT_"),
                  )}
                  placeholder="Search Facility Types..."
                  label="Facility Types (optional)"
                />

                <ModalSelectInput
                  value={formData.triggerIds}
                  onChange={(value) =>
                    setFormData({ ...formData, triggerIds: value })
                  }
                  options={triggerOptions}
                  placeholder="Search Trigger IDs..."
                  label="Trigger IDs *"
                />
              </div>
            </div>
          </div>

          <div className={activeTab === "content" ? "space-y-6" : "hidden"}>
            {formData.templateType === "document" && (
              <div className="glass-card p-4 flex flex-col flex-1 h-full min-h-[450px]">
                <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">
                  Content
                </h3>
                <div className="flex-1 overflow-hidden flex flex-col qms-quill-editor bg-secondary-900 border border-secondary-700 rounded-lg">
                  <ReactQuill
                    theme="snow"
                    value={formData.content}
                    onChange={(content) =>
                      setFormData({ ...formData, content })
                    }
                    className="h-full flex flex-col"
                    modules={{
                      toolbar: [
                        [{ header: [1, 2, 3, false] }],
                        ["bold", "italic", "underline", "strike", "blockquote"],
                        [{ list: "ordered" }, { list: "bullet" }],
                        ["link"],
                      ],
                    }}
                  />
                </div>
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
        title="Delete Template"
        message="Are you sure you want to delete this template? This action cannot be undone."
        confirmText="Delete Template"
        variant="danger"
      />
    </div>
  );
};
