import axiosInstance from "./axiosInstance";

export type ChecklistFrequency = "daily" | "weekly" | "monthly" | "yearly";
export type SeverityLevel = "low" | "medium" | "high";
export type ChecklistCategory =
  | "equipment"
  | "environment"
  | "process"
  | "safety"
  | "quality"
  | "calibration"
  | "maintenance"
  | "training"
  | "audit"
  | "cleaning"
  | "other";

export type ChecklistItemType =
  | "checkbox"
  | "text input"
  | "number"
  | "temperature"
  | "dropdown"
  | "date"
  | "time"
  | "long text";

export interface InputConfigurationDto {
  placeholderText?: string;
  maxLength?: number;
  unit?: string;
  minValue?: number;
  maxValue?: number;
  decimalPlaces?: number;
  options?: string[];
  allowComments?: boolean;
  requireCommentOnFailure?: boolean;
  alertOutOfRange?: boolean;
  failureValues?: string[];
  failureMinValue?: number;
  failureMaxValue?: number;
}

export interface ChecklistItemDto {
  _id?: string;
  text: string;
  description?: string;
  type: ChecklistItemType;
  required?: boolean;
  critical?: boolean;
  triggersCapaOnFail?: boolean;
  severityOnFail?: SeverityLevel;
  inputConfiguration?: InputConfigurationDto;
}

export interface CommonChecklist {
  _id: string;
  name: string;
  code?: string;
  description: string;
  status?: string;
  frequencyType: ChecklistFrequency;
  occurrencesPerPeriod: number;
  executionTimes?: string[];
  timeWindows?: { start: string; end: string }[];
  daysOfWeek?: number[];
  daysOfMonth?: number[];
  monthsOfYear?: number[];
  startDate: string;
  endDate?: string;
  requiresCapaOnFail?: boolean;
  defaultSeverityOnFail?: SeverityLevel;
  gracePeriodMinutes?: number;
  category?: ChecklistCategory;
  categoryDetails?: string;
  priorityLevel?: string;
  requiresPerformerSignature?: boolean;
  requiresWitnessSignature?: boolean;
  requiresSupervisorReview?: boolean;
  allowPartialCompletion?: boolean;
  items: ChecklistItemDto[];
  createdBy?: unknown;
  updatedBy?: unknown;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCommonChecklistDto {
  name: string;
  code?: string;
  description: string;
  frequencyType: ChecklistFrequency;
  occurrencesPerPeriod: number;
  executionTimes?: string[];
  timeWindows?: { start: string; end: string }[];
  daysOfWeek?: number[];
  daysOfMonth?: number[];
  monthsOfYear?: number[];
  startDate: string; // ISO date
  endDate?: string;
  requiresCapaOnFail?: boolean;
  defaultSeverityOnFail?: SeverityLevel;
  gracePeriodMinutes?: number;
  category?: ChecklistCategory;
  categoryDetails?: string;
  priorityLevel?: string;
  requiresPerformerSignature?: boolean;
  requiresWitnessSignature?: boolean;
  requiresSupervisorReview?: boolean;
  allowPartialCompletion?: boolean;
  items: ChecklistItemDto[];
}

export type UpdateCommonChecklistDto = Partial<CreateCommonChecklistDto>;

interface PaginatedResponse<T> {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  items: T[];
}

interface ApiResponse<T> {
  statusCode?: number;
  data?: T;
}

const unwrapResponse = <T>(response: { data: ApiResponse<T> | T }): T => {
  const data = response.data;
  if (
    data &&
    typeof data === "object" &&
    "statusCode" in data &&
    "data" in data
  ) {
    return (data as ApiResponse<T>).data as T;
  }
  return data as T;
};

export const checklistV2API = {
  getCommon: async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
  }): Promise<PaginatedResponse<CommonChecklist>> => {
    const response = await axiosInstance.get("/checklist/v2", {
      params: { commonOnly: true, ...params },
    });
    return unwrapResponse(response);
  },

  getById: async (id: string): Promise<CommonChecklist> => {
    const response = await axiosInstance.get(`/checklist/v2/${id}`);
    return unwrapResponse(response);
  },

  create: async (data: CreateCommonChecklistDto): Promise<CommonChecklist> => {
    const response = await axiosInstance.post("/checklist/v2", data);
    return unwrapResponse(response);
  },

  update: async (
    id: string,
    data: UpdateCommonChecklistDto
  ): Promise<CommonChecklist> => {
    const response = await axiosInstance.patch(`/checklist/v2/${id}`, data);
    return unwrapResponse(response);
  },

  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/checklist/v2/${id}`);
  },
};
