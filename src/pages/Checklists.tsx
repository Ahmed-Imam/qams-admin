import {
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Edit,
  GripVertical,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { SlideInModal } from "../components/SlideInModal";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { GridSkeleton } from "../components/GridSkeleton";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type {
  ChecklistCategory,
  ChecklistFrequency,
  ChecklistItemDto,
  ChecklistItemType,
  CommonChecklist,
  CreateCommonChecklistDto,
  SeverityLevel,
} from "../api/checklistV2";
import { checklistV2API } from "../api/checklistV2";

const FREQUENCY_OPTIONS: { value: ChecklistFrequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const SEVERITY_OPTIONS: { value: SeverityLevel; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const CATEGORY_OPTIONS: { value: ChecklistCategory; label: string }[] = [
  { value: "equipment", label: "Equipment" },
  { value: "environment", label: "Environment" },
  { value: "process", label: "Process" },
  { value: "safety", label: "Safety" },
  { value: "quality", label: "Quality" },
  { value: "calibration", label: "Calibration" },
  { value: "maintenance", label: "Maintenance" },
  { value: "cleaning", label: "Cleaning" },
  { value: "audit", label: "Audit" },
  { value: "training", label: "Training" },
  { value: "other", label: "Other" },
];

const GRACE_PERIOD_OPTIONS = [
  { value: 0, label: "On Time" },
  { value: 5, label: "± 5 min" },
  { value: 15, label: "± 15 min" },
  { value: 30, label: "± 30 min" },
  { value: 60, label: "± 1 hr" },
];

const ITEM_TYPES: { value: ChecklistItemType; label: string; icon: string }[] =
  [
    { value: "checkbox", label: "Checkbox", icon: "☑️" },
    { value: "text input", label: "Text", icon: "📝" },
    { value: "long text", label: "Text Area", icon: "📄" },
    { value: "number", label: "Number", icon: "🔢" },
    { value: "temperature", label: "Temp", icon: "🌡️" },
    { value: "date", label: "Date", icon: "📅" },
    { value: "dropdown", label: "Dropdown", icon: "▼" },
    { value: "time", label: "Time", icon: "🕐" },
  ];

const DAYS_OF_WEEK = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

type ChecklistItemForm = ChecklistItemDto & {
  minValue?: number;
  maxValue?: number;
  unit?: string;
  options?: string[];
  failureValues?: string[];
  failureMinValue?: number;
  failureMaxValue?: number;
};

interface ChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  checklist: CommonChecklist | null;
  mode: "create" | "edit";
  onSuccess: () => void;
}

const ChecklistModal: React.FC<ChecklistModalProps> = ({
  isOpen,
  onClose,
  checklist,
  mode,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<"details" | "checks">("details");
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    code: string;
    description: string;
    category: ChecklistCategory | "";
    categoryDetails: string;
    frequencyType: ChecklistFrequency;
    occurrencesPerPeriod: number;
    executionTimes: string[];
    gracePeriodMinutes: number;
    daysOfWeek: number[];
    daysOfMonth: number[];
    monthsOfYear: number[];
    startDate: string;
    hasEndDate: boolean;
    endDate: string;
    requiresCapaOnFail: boolean;
    defaultSeverityOnFail: SeverityLevel;
    items: ChecklistItemForm[];
  }>({
    name: "",
    code: "",
    description: "",
    category: "",
    categoryDetails: "",
    frequencyType: "daily",
    occurrencesPerPeriod: 1,
    executionTimes: ["09:00"],
    gracePeriodMinutes: 15,
    daysOfWeek: [],
    daysOfMonth: [],
    monthsOfYear: [],
    startDate: new Date().toISOString().split("T")[0],
    hasEndDate: false,
    endDate: "",
    requiresCapaOnFail: false,
    defaultSeverityOnFail: "medium",
    items: [
      {
        text: "",
        type: "checkbox",
        required: true,
        critical: false,
        triggersCapaOnFail: false,
        severityOnFail: "medium",
      },
    ],
  });

  useEffect(() => {
    if (checklist && mode === "edit" && isOpen) {
      const items: ChecklistItemForm[] = (checklist.items || []).map(
        (item) => ({
          ...item,
          text: item.text || "",
          type: (item.type as ChecklistItemType) || "checkbox",
          required: item.required ?? true,
          critical: item.critical ?? false,
          triggersCapaOnFail: item.triggersCapaOnFail ?? false,
          severityOnFail: (item.severityOnFail as SeverityLevel) || "medium",
          minValue: item.inputConfiguration?.minValue,
          maxValue: item.inputConfiguration?.maxValue,
          unit: item.inputConfiguration?.unit,
          options: item.inputConfiguration?.options,
          failureValues: item.inputConfiguration?.failureValues,
          failureMinValue: item.inputConfiguration?.failureMinValue,
          failureMaxValue: item.inputConfiguration?.failureMaxValue,
        }),
      );
      setFormData({
        name: checklist.name || "",
        code: checklist.code || "",
        description: checklist.description || "",
        category: (checklist.category as ChecklistCategory) || "",
        categoryDetails: checklist.categoryDetails || "",
        frequencyType: checklist.frequencyType || "daily",
        occurrencesPerPeriod: checklist.occurrencesPerPeriod ?? 1,
        executionTimes: checklist.executionTimes?.length
          ? checklist.executionTimes
          : ["09:00"],
        gracePeriodMinutes: checklist.gracePeriodMinutes ?? 15,
        daysOfWeek: checklist.daysOfWeek || [],
        daysOfMonth: checklist.daysOfMonth || [],
        monthsOfYear: checklist.monthsOfYear || [],
        startDate: checklist.startDate
          ? new Date(checklist.startDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        hasEndDate: !!checklist.endDate,
        endDate: checklist.endDate
          ? new Date(checklist.endDate).toISOString().split("T")[0]
          : "",
        requiresCapaOnFail: checklist.requiresCapaOnFail ?? false,
        defaultSeverityOnFail: checklist.defaultSeverityOnFail || "medium",
        items: items.length
          ? items
          : [
              {
                text: "",
                type: "checkbox",
                required: true,
                critical: false,
                triggersCapaOnFail: false,
                severityOnFail: "medium",
              },
            ],
      });
    } else if (isOpen && mode === "create") {
      setFormData({
        name: "",
        code: "",
        description: "",
        category: "",
        categoryDetails: "",
        frequencyType: "daily",
        occurrencesPerPeriod: 1,
        executionTimes: ["09:00"],
        gracePeriodMinutes: 15,
        daysOfWeek: [],
        daysOfMonth: [],
        monthsOfYear: [],
        startDate: new Date().toISOString().split("T")[0],
        hasEndDate: false,
        endDate: "",
        requiresCapaOnFail: false,
        defaultSeverityOnFail: "medium",
        items: [
          {
            text: "",
            type: "checkbox",
            required: true,
            critical: false,
            triggersCapaOnFail: false,
            severityOnFail: "medium",
          },
        ],
      });
    }
  }, [checklist, mode, isOpen]);

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      toast.warning("Name and description are required");
      return;
    }
    if (formData.items.some((item) => !item.text.trim())) {
      toast.warning("All check items must have text");
      setActiveTab("checks");
      return;
    }
    setSaving(true);
    try {
      const payload: CreateCommonChecklistDto = {
        name: formData.name.trim(),
        code: formData.code.trim() || undefined,
        description: formData.description.trim(),
        category: formData.category || undefined,
        categoryDetails: formData.categoryDetails?.trim() || undefined,
        frequencyType: formData.frequencyType,
        occurrencesPerPeriod: formData.occurrencesPerPeriod,
        executionTimes: formData.executionTimes,
        gracePeriodMinutes: formData.gracePeriodMinutes,
        daysOfWeek:
          formData.frequencyType === "weekly" ? formData.daysOfWeek : undefined,
        daysOfMonth:
          formData.frequencyType === "monthly"
            ? formData.daysOfMonth
            : undefined,
        monthsOfYear:
          formData.frequencyType === "yearly"
            ? formData.monthsOfYear
            : undefined,
        startDate: new Date(formData.startDate).toISOString(),
        endDate:
          formData.hasEndDate && formData.endDate
            ? new Date(formData.endDate).toISOString()
            : undefined,
        requiresCapaOnFail: formData.requiresCapaOnFail,
        defaultSeverityOnFail: formData.requiresCapaOnFail
          ? formData.defaultSeverityOnFail
          : undefined,
        items: formData.items.map((item) => ({
          text: item.text,
          type: item.type,
          required: item.required ?? true,
          critical: item.critical ?? false,
          triggersCapaOnFail: item.triggersCapaOnFail ?? false,
          severityOnFail: item.triggersCapaOnFail
            ? item.severityOnFail
            : undefined,
          inputConfiguration:
            item.minValue !== undefined ||
            item.maxValue !== undefined ||
            item.unit ||
            (item.options?.length ?? 0) > 0
              ? {
                  minValue: item.minValue,
                  maxValue: item.maxValue,
                  unit: item.unit,
                  options: item.type === "dropdown" ? item.options : undefined,
                  allowComments: true,
                  requireCommentOnFailure: item.critical,
                  alertOutOfRange:
                    item.minValue !== undefined || item.maxValue !== undefined,
                  failureValues:
                    item.triggersCapaOnFail && item.type === "dropdown"
                      ? item.failureValues
                      : undefined,
                  failureMinValue:
                    item.triggersCapaOnFail &&
                    (item.type === "number" || item.type === "temperature")
                      ? item.failureMinValue
                      : undefined,
                  failureMaxValue:
                    item.triggersCapaOnFail &&
                    (item.type === "number" || item.type === "temperature")
                      ? item.failureMaxValue
                      : undefined,
                }
              : undefined,
        })),
      };
      if (mode === "edit" && checklist?._id) {
        await checklistV2API.update(checklist._id, payload);
        toast.success("Checklist updated successfully");
      } else {
        await checklistV2API.create(payload);
        toast.success("Checklist created successfully");
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

  const handleInputChange = (field: keyof typeof formData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTimeChange = (index: number, value: string) => {
    const newTimes = [...formData.executionTimes];
    newTimes[index] = value;
    setFormData((prev) => ({ ...prev, executionTimes: newTimes }));
  };

  const handleAddTime = () => {
    setFormData((prev) => ({
      ...prev,
      executionTimes: [...prev.executionTimes, "09:00"],
      occurrencesPerPeriod: prev.executionTimes.length + 1,
    }));
  };

  const handleRemoveTime = (index: number) => {
    if (formData.executionTimes.length > 1) {
      const newTimes = formData.executionTimes.filter((_, i) => i !== index);
      setFormData((prev) => ({
        ...prev,
        executionTimes: newTimes,
        occurrencesPerPeriod: newTimes.length,
      }));
    }
  };

  const handleDayOfWeekToggle = (day: number) => {
    const newDays = formData.daysOfWeek.includes(day)
      ? formData.daysOfWeek.filter((d) => d !== day)
      : [...formData.daysOfWeek, day];
    setFormData((prev) => ({ ...prev, daysOfWeek: newDays }));
  };

  const handleItemChange = useCallback(
    (index: number, field: keyof ChecklistItemForm, value: unknown) => {
      setFormData((prev) => {
        const newItems = [...prev.items];
        newItems[index] = { ...newItems[index], [field]: value };
        if (field === "type" && value === "dropdown") {
          newItems[index].options = newItems[index].options || [
            "Option 1",
            "Option 2",
          ];
        }
        return { ...prev, items: newItems };
      });
    },
    [],
  );

  const handleAddItem = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          text: "",
          type: "checkbox",
          required: true,
          critical: false,
          triggersCapaOnFail: false,
          severityOnFail: "medium",
        },
      ],
    }));
  }, []);

  const handleRemoveItem = useCallback(
    (index: number) => {
      if (formData.items.length <= 1) return;
      setFormData((prev) => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    },
    [formData.items.length],
  );

  const handleMoveItem = useCallback(
    (index: number, direction: "up" | "down") => {
      setFormData((prev) => {
        const items = [...prev.items];
        const newIndex = direction === "up" ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= items.length) return prev;
        [items[index], items[newIndex]] = [items[newIndex], items[index]];
        return { ...prev, items };
      });
    },
    [],
  );

  const handleDropdownOptionChange = (
    itemIndex: number,
    optionIndex: number,
    value: string,
  ) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      const opts = [...(newItems[itemIndex].options || [])];
      opts[optionIndex] = value;
      newItems[itemIndex].options = opts;
      return { ...prev, items: newItems };
    });
  };

  const handleAddDropdownOption = (itemIndex: number) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      const opts = newItems[itemIndex].options || [];
      newItems[itemIndex].options = [...opts, `Option ${opts.length + 1}`];
      return { ...prev, items: newItems };
    });
  };

  const handleRemoveDropdownOption = (
    itemIndex: number,
    optionIndex: number,
  ) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      newItems[itemIndex].options = (newItems[itemIndex].options || []).filter(
        (_, i) => i !== optionIndex,
      );
      return { ...prev, items: newItems };
    });
  };

  const handleToggleFailureValue = (itemIndex: number, value: string) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      const current = newItems[itemIndex].failureValues || [];
      newItems[itemIndex].failureValues = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, items: newItems };
    });
  };

  if (!isOpen) return null;

  return (
    <SlideInModal
      isOpen={isOpen}
      onClose={() => {
        setActiveTab("details");
        onClose();
      }}
      title={mode === "edit" ? "Edit Checklist" : "Add Common Checklist"}
      icon={ClipboardCheck}
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
              setActiveTab("details");
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
        {(["details", "checks"] as const).map((tab) => (
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
            {tab === "details" ? "Details" : "Checks"}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {activeTab === "details" && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="input-field"
                  placeholder="e.g. Daily Equipment Checklist"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">
                  Code
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => handleInputChange("code", e.target.value)}
                  className="input-field"
                  placeholder="CHK-001"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-300 mb-2">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                className="input-field min-h-[80px] resize-none"
                placeholder="Describe the purpose of this checklist"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    handleInputChange(
                      "category",
                      e.target.value as ChecklistCategory | "",
                    )
                  }
                  className="input-field"
                >
                  <option value="">Select (optional)</option>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">
                  Category details
                </label>
                <input
                  type="text"
                  value={formData.categoryDetails}
                  onChange={(e) =>
                    handleInputChange("categoryDetails", e.target.value)
                  }
                  className="input-field"
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="border-t border-secondary-700/50 pt-4">
              <h3 className="text-sm font-medium text-white mb-3">Schedule</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-300 mb-2">
                    Frequency
                  </label>
                  <select
                    value={formData.frequencyType}
                    onChange={(e) =>
                      handleInputChange(
                        "frequencyType",
                        e.target.value as ChecklistFrequency,
                      )
                    }
                    className="input-field"
                  >
                    {FREQUENCY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-300 mb-2">
                    Start date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      handleInputChange("startDate", e.target.value)
                    }
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-secondary-300 mb-2">
                    <input
                      type="checkbox"
                      checked={formData.hasEndDate}
                      onChange={(e) => {
                        handleInputChange("hasEndDate", e.target.checked);
                        if (!e.target.checked) handleInputChange("endDate", "");
                      }}
                      className="w-4 h-4 rounded border-secondary-600 text-primary-500"
                    />
                    End date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      handleInputChange("endDate", e.target.value)
                    }
                    min={formData.startDate}
                    disabled={!formData.hasEndDate}
                    className="input-field disabled:opacity-50"
                  />
                </div>
              </div>
              {formData.frequencyType === "weekly" && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-secondary-300 mb-2">
                    Days of week
                  </label>
                  <div className="flex gap-1 flex-wrap">
                    {DAYS_OF_WEEK.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => handleDayOfWeekToggle(day.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                          formData.daysOfWeek.includes(day.value)
                            ? "bg-primary-500/30 text-primary-300 border border-primary-500/50"
                            : "border border-secondary-600 text-secondary-400 hover:text-white"
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {formData.frequencyType === "monthly" && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-secondary-300 mb-2">
                    Days of month (1–31, comma-separated)
                  </label>
                  <input
                    type="text"
                    value={(formData.daysOfMonth || []).join(", ")}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\s/g, "");
                      const nums = raw
                        ? raw
                            .split(",")
                            .map((s) => parseInt(s, 10))
                            .filter((n) => !isNaN(n) && n >= 1 && n <= 31)
                        : [];
                      handleInputChange("daysOfMonth", nums);
                    }}
                    className="input-field"
                    placeholder="e.g. 1, 15"
                  />
                </div>
              )}
              {formData.frequencyType === "yearly" && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-secondary-300 mb-2">
                    Months (1–12, comma-separated)
                  </label>
                  <input
                    type="text"
                    value={(formData.monthsOfYear || []).join(", ")}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\s/g, "");
                      const nums = raw
                        ? raw
                            .split(",")
                            .map((s) => parseInt(s, 10))
                            .filter((n) => !isNaN(n) && n >= 1 && n <= 12)
                        : [];
                      handleInputChange("monthsOfYear", nums);
                    }}
                    className="input-field"
                    placeholder="e.g. 1, 7"
                  />
                </div>
              )}
              <div className="mt-3">
                <label className="block text-sm font-medium text-secondary-300 mb-2">
                  Execution times ({formData.executionTimes.length}x per{" "}
                  {formData.frequencyType})
                </label>
                <div className="flex flex-wrap gap-2">
                  {formData.executionTimes.map((time, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => handleTimeChange(i, e.target.value)}
                        className="input-field text-sm w-auto"
                      />
                      {formData.executionTimes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTime(i)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-secondary-400 hover:text-red-400"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddTime}
                    className="px-3 py-2 rounded-lg border border-dashed border-secondary-600 text-secondary-400 hover:text-primary-400 hover:border-primary-500/50 text-sm"
                  >
                    <Plus className="w-4 h-4 inline mr-1" />
                    Add
                  </button>
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-sm font-medium text-secondary-300 mb-2">
                  Grace period
                </label>
                <div className="flex gap-1 flex-wrap">
                  {GRACE_PERIOD_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        handleInputChange("gracePeriodMinutes", opt.value)
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                        formData.gracePeriodMinutes === opt.value
                          ? "bg-primary-500/30 text-primary-300 border border-primary-500/50"
                          : "border border-secondary-600 text-secondary-400 hover:text-white"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary-800/50 border border-secondary-700/50">
              <input
                type="checkbox"
                id="requiresCapaOnFail"
                checked={formData.requiresCapaOnFail}
                onChange={(e) =>
                  handleInputChange("requiresCapaOnFail", e.target.checked)
                }
                className="w-4 h-4 rounded border-secondary-600 text-primary-500 focus:ring-primary-500"
              />
              <label
                htmlFor="requiresCapaOnFail"
                className="text-sm font-medium text-secondary-300 cursor-pointer flex-1"
              >
                Require CAPA if checklist fails overall
              </label>
              {formData.requiresCapaOnFail && (
                <select
                  value={formData.defaultSeverityOnFail}
                  onChange={(e) =>
                    handleInputChange(
                      "defaultSeverityOnFail",
                      e.target.value as SeverityLevel,
                    )
                  }
                  className="input-field w-28"
                >
                  {SEVERITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </>
        )}

        {activeTab === "checks" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">Check items</h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add item
              </button>
            </div>
            {formData.items.map((item, index) => (
              <div
                key={index}
                className="glass-card p-4 border border-secondary-700/50 space-y-3"
              >
                <div className="flex items-start gap-2">
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => handleMoveItem(index, "up")}
                      disabled={index === 0}
                      className="p-1.5 text-secondary-400 hover:text-white disabled:opacity-30 rounded"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveItem(index, "down")}
                      disabled={index === formData.items.length - 1}
                      className="p-1.5 text-secondary-400 hover:text-white disabled:opacity-30 rounded"
                    >
                      ↓
                    </button>
                  </div>
                  <GripVertical className="w-4 h-4 text-secondary-500 flex-shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) =>
                        handleItemChange(index, "text", e.target.value)
                      }
                      className="input-field mb-2"
                      placeholder="Check description *"
                    />
                    <div className="flex flex-wrap gap-1 mb-2">
                      {ITEM_TYPES.map((t) => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() =>
                            handleItemChange(index, "type", t.value)
                          }
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            item.type === t.value
                              ? "bg-primary-500/30 text-primary-300"
                              : "text-secondary-400 hover:text-white border border-secondary-600"
                          }`}
                        >
                          {t.icon} {t.label}
                        </button>
                      ))}
                    </div>
                    {(item.type === "number" ||
                      item.type === "temperature") && (
                      <div className="flex gap-2 flex-wrap mb-2">
                        <input
                          type="number"
                          value={item.minValue ?? ""}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "minValue",
                              e.target.value
                                ? parseFloat(e.target.value)
                                : undefined,
                            )
                          }
                          className="input-field w-20 text-sm"
                          placeholder="Min"
                        />
                        <input
                          type="number"
                          value={item.maxValue ?? ""}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "maxValue",
                              e.target.value
                                ? parseFloat(e.target.value)
                                : undefined,
                            )
                          }
                          className="input-field w-20 text-sm"
                          placeholder="Max"
                        />
                        <input
                          type="text"
                          value={item.unit ?? ""}
                          onChange={(e) =>
                            handleItemChange(index, "unit", e.target.value)
                          }
                          className="input-field w-16 text-sm"
                          placeholder={
                            item.type === "temperature" ? "°C" : "Unit"
                          }
                        />
                      </div>
                    )}
                    {item.type === "dropdown" && (
                      <div className="flex flex-wrap gap-1 items-center mb-2">
                        {(item.options || []).map((opt, oi) => (
                          <div
                            key={oi}
                            className="flex items-center gap-1 bg-secondary-800 rounded px-2 py-1"
                          >
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) =>
                                handleDropdownOptionChange(
                                  index,
                                  oi,
                                  e.target.value,
                                )
                              }
                              className="input-field text-xs w-24 bg-transparent border-0 p-0"
                            />
                            {(item.options?.length ?? 0) > 2 && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveDropdownOption(index, oi)
                                }
                                className="text-secondary-400 hover:text-red-400"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => handleAddDropdownOption(index)}
                          className="text-primary-400 text-xs hover:underline"
                        >
                          + Add option
                        </button>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.required}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "required",
                              e.target.checked,
                            )
                          }
                          className="w-4 h-4 rounded border-secondary-600 text-primary-500"
                        />
                        Required
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.critical}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "critical",
                              e.target.checked,
                            )
                          }
                          className="w-4 h-4 rounded border-secondary-600 text-primary-500"
                        />
                        Critical
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.triggersCapaOnFail}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "triggersCapaOnFail",
                              e.target.checked,
                            )
                          }
                          className="w-4 h-4 rounded border-secondary-600 text-primary-500"
                        />
                        CAPA on fail
                      </label>
                      {item.triggersCapaOnFail && (
                        <select
                          value={item.severityOnFail}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "severityOnFail",
                              e.target.value as SeverityLevel,
                            )
                          }
                          className="input-field text-sm w-24"
                        >
                          {SEVERITY_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    {item.triggersCapaOnFail &&
                      item.type === "dropdown" &&
                      (item.options?.length ?? 0) > 0 && (
                        <div className="mt-2 p-2 rounded bg-amber-500/10 border border-amber-500/30">
                          <span className="text-xs text-amber-400 font-medium">
                            Trigger CAPA for:
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.options!.map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() =>
                                  handleToggleFailureValue(index, opt)
                                }
                                className={`px-2 py-0.5 rounded text-xs ${
                                  item.failureValues?.includes(opt)
                                    ? "bg-amber-500/30 text-amber-200"
                                    : "border border-amber-500/50 text-secondary-400 hover:text-white"
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-secondary-400 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SlideInModal>
  );
};

const PAGE_SIZE = 12;

export const Checklists: React.FC = () => {
  const [checklists, setChecklists] = useState<CommonChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingChecklist, setEditingChecklist] =
    useState<CommonChecklist | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const prevSearchRef = React.useRef(searchQuery);

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [checklistToDelete, setChecklistToDelete] =
    useState<CommonChecklist | null>(null);

  const fetchPage = useCallback(async (pageNum: number, search: string) => {
    setLoading(true);
    try {
      const res = await checklistV2API.getCommon({
        page: pageNum,
        pageSize: PAGE_SIZE,
        search: search.trim() || undefined,
      });
      setChecklists(Array.isArray(res?.items) ? res.items : []);
      setTotal(res?.total ?? 0);
      setTotalPages(res?.totalPages ?? 0);
    } catch {
      toast.error("Failed to fetch checklists");
      setChecklists([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const searchChanged = prevSearchRef.current !== searchQuery;
    if (searchChanged) {
      prevSearchRef.current = searchQuery;
      setPage(1);
    }
    fetchPage(searchChanged ? 1 : page, searchQuery);
  }, [page, searchQuery, fetchPage]);

  const fetchAll = useCallback(() => {
    fetchPage(page, searchQuery);
  }, [page, searchQuery, fetchPage]);

  const goToPage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    setPage(nextPage);
  };

  const startItem = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(page * PAGE_SIZE, total);

  const handleAdd = () => {
    setEditingChecklist(null);
    setModalMode("create");
    setShowModal(true);
  };

  const handleEdit = async (checklist: CommonChecklist) => {
    try {
      const full = await checklistV2API.getById(checklist._id);
      setEditingChecklist(full);
      setModalMode("edit");
      setShowModal(true);
    } catch {
      toast.error("Failed to load checklist");
    }
  };

  const openDeleteConfirm = (checklist: CommonChecklist) => {
    setChecklistToDelete(checklist);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!checklistToDelete) return;
    try {
      await checklistV2API.delete(checklistToDelete._id);
      toast.success("Checklist deleted");
      fetchAll();
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to delete";
      toast.error(msg);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingChecklist(null);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Common Checklists
          </h1>
          <p className="text-secondary-400">
            Manage common checklists (not tied to any client)
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Checklist
        </button>
      </div>

      <div className=" glass-card p-4 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input
            type="text"
            placeholder="Search by name, code or description..."
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

      <div className="flex-1 min-h-0 overflow-y-auto relative">
        {loading && checklists.length > 0 && (
          <div className="absolute -top-1 left-0 w-full h-1 bg-secondary-800 overflow-hidden z-20 rounded-full">
            <div className="h-full bg-primary-500 w-1/3 animate-[slide_1.5s_ease-in-out_infinite]"></div>
          </div>
        )}

        {loading && checklists.length === 0 ? (
          <GridSkeleton itemCount={6} hasHeader={false} hasFilters={false} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-4">
            {checklists.map((checklist) => (
              <div
                key={checklist._id}
                className="glass-card p-6 hover:border-primary-500/30 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/10 border border-primary-500/20">
                    <ClipboardCheck className="w-6 h-6 text-primary-400" />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(checklist)}
                      className="p-2 rounded-lg hover:bg-secondary-700/50 text-secondary-400 hover:text-white transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openDeleteConfirm(checklist)}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-secondary-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {checklist.name}
                </h3>
                {checklist.description && (
                  <p className="text-sm text-secondary-400 line-clamp-2 mb-3">
                    {checklist.description}
                  </p>
                )}
                <div className="text-xs text-secondary-500 space-y-1">
                  {checklist.code && <p>Code: {checklist.code}</p>}
                  <p>{checklist.items?.length ?? 0} items</p>
                  <p>Frequency: {checklist.frequencyType}</p>
                  {checklist.requiresCapaOnFail && (
                    <span className="inline-block px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
                      CAPA on fail
                    </span>
                  )}
                  {checklist.createdAt && (
                    <p>
                      Created:{" "}
                      {new Date(checklist.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {checklists.length === 0 && !loading && (
              <div className="col-span-full text-center py-12">
                <ClipboardCheck className="w-12 h-12 text-secondary-600 mx-auto mb-4" />
                <p className="text-secondary-400">No common checklists found</p>
              </div>
            )}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-4 border-t border-secondary-700/50">
            <p className="text-sm text-secondary-400">
              Showing {startItem}–{endItem} of {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1 || loading}
                className="p-2 rounded-lg border border-secondary-600 text-secondary-400 hover:text-white hover:bg-secondary-700/50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-secondary-300 px-3">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages || loading}
                className="p-2 rounded-lg border border-secondary-600 text-secondary-400 hover:text-white hover:bg-secondary-700/50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                aria-label="Next page"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <ChecklistModal
        isOpen={showModal}
        onClose={closeModal}
        checklist={editingChecklist}
        mode={modalMode}
        onSuccess={fetchAll}
      />
      <ConfirmationModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Checklist"
        message={`Are you sure you want to delete "${checklistToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete Checklist"
        variant="danger"
      />
    </div>
  );
};
