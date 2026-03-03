import { Edit, GripVertical, Plus, Search, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { workflowsAPI } from "../api/workflows";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { SlideInModal } from "../components/SlideInModal";
import { GridSkeleton } from "../components/GridSkeleton";
import type {
  CreateWorkflowDto,
  CreateWorkflowStepDto,
  Workflow,
  WorkflowStepAction,
  WorkflowStepOption,
  WorkflowStepRoleType,
} from "../types";

const ACTION_LABELS: Record<WorkflowStepAction, string> = {
  review: "Review",
  approve: "Approve",
  acknowledge: "Acknowledge",
};

const OPTION_LABELS: Record<WorkflowStepOption, string> = {
  required: "Required",
  notify: "Notify",
  editable: "Editable",
};

const ROLE_TYPE_LABELS: Record<WorkflowStepRoleType, string> = {
  admin: "Admin",
  staff: "Staff",
};

const ACTIONS: WorkflowStepAction[] = ["review", "approve", "acknowledge"];
const OPTIONS: WorkflowStepOption[] = ["required", "notify", "editable"];
const ROLE_TYPES: WorkflowStepRoleType[] = ["admin", "staff"];

const getInitialStep = (): CreateWorkflowStepDto => ({
  name: "",
  action: "review",
  options: [],
  roleType: "staff",
});

const getInitialFormData = (): CreateWorkflowDto & {
  steps: CreateWorkflowStepDto[];
} => ({
  name: "",
  description: "",
  initialStatus: "active",
  steps: [getInitialStep()],
});

export const Workflows: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [formData, setFormData] = useState<
    CreateWorkflowDto & { steps: CreateWorkflowStepDto[] }
  >(getInitialFormData());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const list = await workflowsAPI.getAllCommon();
      setWorkflows(Array.isArray(list) ? list : []);
    } catch (error) {
      toast.error("Failed to fetch workflows");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredWorkflows = workflows.filter(
    (w) =>
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.description ?? "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: CreateWorkflowDto = {
        name: formData.name,
        description: formData.description || undefined,
        initialStatus: formData.initialStatus,
        steps: formData.steps.map((s) => ({
          name: s.name,
          action: s.action,
          options: s.options ?? [],
          roleType: s.roleType,
        })),
      };
      if (editingWorkflow) {
        await workflowsAPI.update(editingWorkflow._id, payload);
        toast.success("Workflow updated successfully");
      } else {
        await workflowsAPI.create(payload);
        toast.success("Workflow created successfully");
      }
      closeModal();
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Operation failed");
    }
  };

  const handleEdit = (workflow: Workflow) => {
    setEditingWorkflow(workflow);
    setFormData({
      name: workflow.name,
      description: workflow.description ?? "",
      initialStatus: workflow.initialStatus ?? "active",
      steps:
        workflow.steps?.length > 0
          ? workflow.steps.map((s) => ({
              name: s.name,
              action: s.action as WorkflowStepAction,
              options: s.options ?? [],
              roleType: (s.roleType ?? "staff") as WorkflowStepRoleType,
            }))
          : [getInitialStep()],
    });
    setShowModal(true);
  };

  const openDeleteConfirm = (id: string) => {
    setWorkflowToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!workflowToDelete) return;
    try {
      await workflowsAPI.delete(workflowToDelete);
      toast.success("Workflow deleted successfully");
      setDeleteConfirmOpen(false);
      setWorkflowToDelete(null);
      fetchData();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to delete workflow",
      );
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingWorkflow(null);
    setFormData(getInitialFormData());
  };

  const addStep = () => {
    setFormData((prev) => ({
      ...prev,
      steps: [...prev.steps, getInitialStep()],
    }));
  };

  const removeStep = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index),
    }));
  };

  const updateStep = (
    index: number,
    field: keyof CreateWorkflowStepDto,
    value: unknown,
  ) => {
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.map((s, i) =>
        i === index ? { ...s, [field]: value } : s,
      ),
    }));
  };

  const toggleOption = (stepIndex: number, option: WorkflowStepOption) => {
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.map((s, i) => {
        if (i !== stepIndex) return s;
        const opts = s.options ?? [];
        const next = opts.includes(option)
          ? opts.filter((x) => x !== option)
          : [...opts, option];
        return { ...s, options: next };
      }),
    }));
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Workflows</h1>
          <p className="text-secondary-400">
            Manage common workflows (not tied to any client)
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Workflow
        </button>
      </div>

      <div className="glass-card p-4 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input
            type="text"
            placeholder="Search by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto relative">
        {loading && workflows.length > 0 && (
          <div className="absolute -top-1 left-0 w-full h-1 bg-secondary-800 overflow-hidden z-20 rounded-full">
            <div className="h-full bg-primary-500 w-1/3 animate-[slide_1.5s_ease-in-out_infinite]"></div>
          </div>
        )}

        {loading && workflows.length === 0 ? (
          <GridSkeleton itemCount={6} hasHeader={false} hasFilters={false} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-4">
            {filteredWorkflows.map((workflow) => (
              <div
                key={workflow._id}
                className="glass-card p-6 hover:border-primary-500/30 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/10 border border-primary-500/20">
                    <GripVertical className="w-6 h-6 text-primary-400" />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(workflow)}
                      className="p-2 rounded-lg hover:bg-secondary-700/50 text-secondary-400 hover:text-white transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openDeleteConfirm(workflow._id)}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-secondary-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-white mb-2">
                  {workflow.name}
                </h3>
                {workflow.description && (
                  <p className="text-sm text-secondary-400 line-clamp-2 mb-3">
                    {workflow.description}
                  </p>
                )}
                <p className="text-xs text-secondary-500">
                  Steps: {workflow.steps?.length ?? 0}
                </p>
                {workflow.createdAt && (
                  <p className="text-xs text-secondary-500 mt-1">
                    Created: {new Date(workflow.createdAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}

            {filteredWorkflows.length === 0 && (
              <div className="col-span-full text-center py-12">
                <GripVertical className="w-12 h-12 text-secondary-600 mx-auto mb-4" />
                <p className="text-secondary-400">No workflows found</p>
              </div>
            )}
          </div>
        )}
      </div>

      <SlideInModal
        isOpen={showModal}
        onClose={closeModal}
        title={editingWorkflow ? "Edit Workflow" : "Add New Workflow (Common)"}
        icon={GripVertical}
        iconColor="primary"
        badges={
          editingWorkflow
            ? [{ label: editingWorkflow.name, variant: "default" }]
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
              form="workflow-form"
              className="btn-primary flex-1"
            >
              {editingWorkflow ? "Update Workflow" : "Create Workflow"}
            </button>
          </div>
        }
      >
        <form id="workflow-form" onSubmit={handleSubmit} className="space-y-6">
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
                  placeholder="e.g. Standard Document Approval"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="input-field min-h-[80px] resize-none"
                  placeholder="Description of this workflow"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">
                  Initial status
                </label>
                <select
                  value={formData.initialStatus}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      initialStatus: e.target.value as "active" | "paused",
                    })
                  }
                  className="input-field"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                </select>
              </div>
            </div>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Steps
              </h3>
              <button
                type="button"
                onClick={addStep}
                className="text-sm text-primary-400 hover:text-primary-300"
              >
                + Add step
              </button>
            </div>
            <div className="space-y-4">
              {formData.steps.map((step, stepIndex) => (
                <div
                  key={stepIndex}
                  className="p-4 rounded-lg bg-secondary-800/50 border border-secondary-700 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-secondary-300">
                      Step {stepIndex + 1}
                    </span>
                    {formData.steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStep(stepIndex)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={step.name}
                    onChange={(e) =>
                      updateStep(stepIndex, "name", e.target.value)
                    }
                    className="input-field"
                    placeholder="Step name"
                    required
                  />
                  <div>
                    <label className="block text-xs text-secondary-400 mb-1">
                      Action
                    </label>
                    <select
                      value={step.action}
                      onChange={(e) =>
                        updateStep(
                          stepIndex,
                          "action",
                          e.target.value as WorkflowStepAction,
                        )
                      }
                      className="input-field"
                    >
                      {ACTIONS.map((a) => (
                        <option key={a} value={a}>
                          {ACTION_LABELS[a]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-secondary-400 mb-1">
                      Role
                    </label>
                    <select
                      value={step.roleType ?? "staff"}
                      onChange={(e) =>
                        updateStep(
                          stepIndex,
                          "roleType",
                          e.target.value as WorkflowStepRoleType,
                        )
                      }
                      className="input-field"
                    >
                      {ROLE_TYPES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_TYPE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-secondary-400 mb-1">
                      Options
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleOption(stepIndex, opt)}
                          className={`px-2 py-1 rounded text-xs ${
                            (step.options ?? []).includes(opt)
                              ? "bg-primary-500/30 text-primary-300 border border-primary-500/50"
                              : "bg-secondary-700/50 text-secondary-400 border border-secondary-600"
                          }`}
                        >
                          {OPTION_LABELS[opt]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>
      </SlideInModal>

      <ConfirmationModal
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setWorkflowToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Delete Workflow"
        message="Are you sure you want to delete this workflow? This action cannot be undone."
        confirmText="Delete Workflow"
        variant="danger"
      />
    </div>
  );
};
