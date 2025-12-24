import axiosInstance from "./axiosInstance";
import type { Department, CreateDepartmentDto, PaginatedResponse } from "../types";

interface ApiResponse<T> {
  statusCode: number;
  data: T;
}

interface GetDepartmentsParams {
  page?: number;
  limit?: number;
  clientId?: string;
}

const unwrapResponse = <T>(response: { data: ApiResponse<T> | T }): T => {
  const data = response.data;
  if (data && typeof data === 'object' && 'statusCode' in data && 'data' in data) {
    return (data as ApiResponse<T>).data;
  }
  return data as T;
};

export const departmentsAPI = {
  getAll: async (params?: GetDepartmentsParams): Promise<PaginatedResponse<Department>> => {
    const response = await axiosInstance.get("/departments", { params });
    return unwrapResponse(response);
  },

  getById: async (id: string): Promise<Department> => {
    const response = await axiosInstance.get(`/departments/${id}`);
    return unwrapResponse(response);
  },

  create: async (data: CreateDepartmentDto): Promise<Department> => {
    const response = await axiosInstance.post("/departments", data);
    return unwrapResponse(response);
  },

  update: async (id: string, data: Partial<CreateDepartmentDto>): Promise<Department> => {
    const response = await axiosInstance.patch(`/departments/${id}`, data);
    return unwrapResponse(response);
  },

  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/departments/${id}`);
  },
};
