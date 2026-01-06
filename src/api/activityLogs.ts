import axiosInstance from "./axiosInstance";
import type { PaginatedResponse } from "../types";

export interface ActivityLogUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface ActivityLog {
  _id: string;
  entity: string;
  entityId: string;
  entityName: string;
  operation: "insert" | "update" | "delete";
  from: Record<string, any> | null;
  to: Record<string, any> | null;
  by: ActivityLogUser | string;
  ts: string;
}

export interface GetActivityLogsParams {
  page?: number;
  pageSize?: number;
  by?: string;
  entityId?: string;
  entityName?: string;
  entity?: string;
  operation?: "insert" | "update" | "delete";
  fromDate?: string; // ISO 8601 date string
  toDate?: string;   // ISO 8601 date string
}

interface ApiResponse<T> {
  statusCode: number;
  data: T;
}

interface ActivityLogsResponse {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  items: ActivityLog[];
}

const unwrapResponse = <T>(response: { data: ApiResponse<T> | T }): T => {
  const data = response.data;
  if (data && typeof data === 'object' && 'statusCode' in data && 'data' in data) {
    return (data as ApiResponse<T>).data;
  }
  return data as T;
};

export const activityLogsAPI = {
  getAll: async (params?: GetActivityLogsParams): Promise<ActivityLogsResponse> => {
    // Clean params by removing undefined, null, and empty string values
    const clean: Record<string, any> = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        // Only include defined, non-null, and non-empty values
        if (value !== undefined && value !== null && value !== '') {
          clean[key] = value;
        }
      });
    }
    const response = await axiosInstance.get("/activity-logs", { params: clean });
    return unwrapResponse(response);
  },
};

