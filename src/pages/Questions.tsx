import clsx from "clsx";
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  Filter,
  HelpCircle,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { questionsAPI } from "../api/questions";
import type { CreateQuestionDto, Question } from "../types";

export const Questions: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [facilityTypeFilter, setFacilityTypeFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isActiveFilter, setIsActiveFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [formData, setFormData] = useState<CreateQuestionDto>({
    questionId: "",
    questionTitle: "",
    description: "",
    type: "single",
    options: [{ id: "", label: "" }],
    facilityType: "",
    order: 0,
    isActive: true,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const query: any = {
        page,
        limit,
      };
      if (searchQuery) query.search = searchQuery;
      if (facilityTypeFilter !== "all") query.facilityType = facilityTypeFilter;
      if (typeFilter !== "all") query.type = typeFilter;
      if (isActiveFilter !== "all") query.isActive = isActiveFilter === "true";

      const response = await questionsAPI.getAll(query);
      setQuestions(response.data || []);
      setTotalPages(response.totalPages || 1);
      setTotalQuestions(response.total || 0);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to fetch questions"
      );
    } finally {
      setLoading(false);
    }
  };

  // Reset to page 1 when filters change (but not when page changes)
  useEffect(() => {
    setPage(1);
  }, [searchQuery, facilityTypeFilter, typeFilter, isActiveFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [
    page,
    limit,
    searchQuery,
    facilityTypeFilter,
    typeFilter,
    isActiveFilter,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate options
    const validOptions = formData.options.filter(
      (opt) => opt.id.trim() && opt.label.trim()
    );
    if (validOptions.length === 0) {
      toast.error("At least one option is required");
      return;
    }

    try {
      const submitData = {
        ...formData,
        options: validOptions,
      };

      if (editingQuestion) {
        await questionsAPI.update(editingQuestion._id, submitData);
        toast.success("Question updated successfully");
      } else {
        await questionsAPI.create(submitData);
        toast.success("Question created successfully");
      }
      closeModal();
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Operation failed");
    }
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setFormData({
      questionId: question.questionId,
      questionTitle: question.questionTitle,
      description: question.description || "",
      type: question.type,
      options:
        question.options.length > 0
          ? question.options
          : [{ id: "", label: "" }],
      facilityType: question.facilityType || "",
      order: question.order || 0,
      isActive: question.isActive ?? true,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      await questionsAPI.delete(id);
      toast.success("Question deleted successfully");
      fetchData();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to delete question"
      );
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingQuestion(null);
    setFormData({
      questionId: "",
      questionTitle: "",
      description: "",
      type: "single",
      options: [{ id: "", label: "" }],
      facilityType: "",
      order: 0,
      isActive: true,
    });
  };

  const addOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, { id: "", label: "" }],
    });
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 1) {
      setFormData({
        ...formData,
        options: formData.options.filter((_, i) => i !== index),
      });
    }
  };

  const updateOption = (
    index: number,
    field: "id" | "label",
    value: string
  ) => {
    const newOptions = [...formData.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setFormData({ ...formData, options: newOptions });
  };

  // Extract unique facility types from questions
  const facilityTypes = Array.from(
    new Set(
      questions.map((q) => q.facilityType).filter((ft): ft is string => !!ft)
    )
  );

  if (loading && questions.length === 0) {
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
          <h1 className="text-3xl font-bold text-white mb-2">Questions</h1>
          <p className="text-secondary-400">
            Manage onboarding questions and their options
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Question
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <select
            value={facilityTypeFilter}
            onChange={(e) => setFacilityTypeFilter(e.target.value)}
            className="input-field pl-10 pr-8 min-w-[150px]"
          >
            <option value="all" className="bg-secondary-800">
              All Facility Types
            </option>
            {facilityTypes.map((ft) => (
              <option key={ft} value={ft} className="bg-secondary-800">
                {ft}
              </option>
            ))}
          </select>
        </div>
        <div className="relative">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input-field pr-8 min-w-[120px]"
          >
            <option value="all" className="bg-secondary-800">
              All Types
            </option>
            <option value="single" className="bg-secondary-800">
              Single
            </option>
            <option value="multi" className="bg-secondary-800">
              Multi
            </option>
          </select>
        </div>
        <div className="relative">
          <select
            value={isActiveFilter}
            onChange={(e) => setIsActiveFilter(e.target.value)}
            className="input-field pr-8 min-w-[120px]"
          >
            <option value="all" className="bg-secondary-800">
              All Status
            </option>
            <option value="true" className="bg-secondary-800">
              Active
            </option>
            <option value="false" className="bg-secondary-800">
              Inactive
            </option>
          </select>
        </div>
      </div>

      {/* Questions Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-secondary-700/50">
                <th className="table-header">Question ID</th>
                <th className="table-header max-w-xs">Title</th>
                <th className="table-header">Type</th>
                <th className="table-header">Facility Type</th>
                <th className="table-header">Options</th>
                <th className="table-header">Order</th>
                <th className="table-header">Status</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((question, index) => (
                <tr
                  key={question._id}
                  className="border-b border-secondary-700/30 hover:bg-secondary-800/30 transition-colors animate-fadeIn"
                  style={{ animationDelay: `${index * 0.03}s` }}
                >
                  <td className="table-cell">
                    <span className="font-mono text-sm text-primary-400">
                      {question.questionId}
                    </span>
                  </td>
                  <td className="table-cell max-w-xs">
                    <div className="min-w-0">
                      <p
                        className="font-medium text-white truncate"
                        title={question.questionTitle}
                      >
                        {question.questionTitle}
                      </p>
                      {question.description && (
                        <p
                          className="text-xs text-secondary-500 truncate"
                          title={question.description}
                        >
                          {question.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="table-cell">
                    <span
                      className={clsx(
                        "px-2 py-1 rounded text-xs font-medium",
                        question.type === "single"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-purple-500/20 text-purple-400"
                      )}
                    >
                      {question.type}
                    </span>
                  </td>
                  <td className="table-cell">
                    {question.facilityType ? (
                      <span className="text-secondary-300">
                        {question.facilityType}
                      </span>
                    ) : (
                      <span className="text-secondary-500">All</span>
                    )}
                  </td>
                  <td className="table-cell">
                    <span className="text-secondary-300">
                      {question.options.length} option
                      {question.options.length !== 1 ? "s" : ""}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className="text-secondary-300">
                      {question.order ?? 0}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span
                      className={clsx(
                        question.isActive ? "badge-success" : "badge-warning"
                      )}
                    >
                      {question.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(question)}
                        className="p-2 rounded-lg hover:bg-secondary-700/50 text-secondary-400 hover:text-white transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(question._id)}
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

          {questions.length === 0 && !loading && (
            <div className="text-center py-12">
              <HelpCircle className="w-12 h-12 text-secondary-600 mx-auto mb-4" />
              <p className="text-secondary-400">No questions found</p>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-secondary-700/30 flex items-center justify-between">
          <p className="text-sm text-secondary-400">
            Showing{" "}
            <span className="font-medium text-white">
              {questions.length > 0 ? (page - 1) * limit + 1 : 0}
            </span>{" "}
            to{" "}
            <span className="font-medium text-white">
              {Math.min(page * limit, totalQuestions)}
            </span>{" "}
            of <span className="font-medium text-white">{totalQuestions}</span>{" "}
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
          <div className="glass-card w-full max-w-2xl p-6 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingQuestion ? "Edit Question" : "Add New Question"}
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
                    Question ID *
                  </label>
                  <input
                    type="text"
                    value={formData.questionId}
                    onChange={(e) =>
                      setFormData({ ...formData, questionId: e.target.value })
                    }
                    className="input-field"
                    placeholder="e.g., FACILITY_TYPE"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-300 mb-2">
                    Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as "single" | "multi",
                      })
                    }
                    className="input-field"
                    required
                  >
                    <option value="single" className="bg-secondary-800">
                      Single Select
                    </option>
                    <option value="multi" className="bg-secondary-800">
                      Multi Select
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">
                  Question Title *
                </label>
                <input
                  type="text"
                  value={formData.questionTitle}
                  onChange={(e) =>
                    setFormData({ ...formData, questionTitle: e.target.value })
                  }
                  className="input-field"
                  placeholder="Enter question title"
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
                  placeholder="Enter question description (optional)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-300 mb-2">
                    Facility Type
                  </label>
                  <input
                    type="text"
                    value={formData.facilityType}
                    onChange={(e) =>
                      setFormData({ ...formData, facilityType: e.target.value })
                    }
                    className="input-field"
                    placeholder="e.g., FT_HOSPITAL (optional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-300 mb-2">
                    Order
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        order: parseInt(e.target.value) || 0,
                      })
                    }
                    className="input-field"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-secondary-300">
                    Options *
                  </label>
                  <button
                    type="button"
                    onClick={addOption}
                    className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
                  >
                    + Add Option
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={option.id}
                        onChange={(e) =>
                          updateOption(index, "id", e.target.value)
                        }
                        className="input-field flex-1"
                        placeholder="Option ID"
                        required
                      />
                      <input
                        type="text"
                        value={option.label}
                        onChange={(e) =>
                          updateOption(index, "label", e.target.value)
                        }
                        className="input-field flex-1"
                        placeholder="Option Label"
                        required
                      />
                      {formData.options.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-secondary-400 hover:text-red-400 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-secondary-600 bg-secondary-800 text-primary-500 focus:ring-primary-500"
                />
                <label
                  htmlFor="isActive"
                  className="text-sm font-medium text-secondary-300"
                >
                  Active
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editingQuestion ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
