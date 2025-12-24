import axiosInstance from "./axiosInstance";
import type { Role, CreateRoleDto, PaginatedResponse } from "../types";

interface ApiResponse<T> {
  statusCode: number;
  data: T;
}

interface GetRolesParams {
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

export const rolesAPI = {
  getAll: async (params?: GetRolesParams): Promise<PaginatedResponse<Role>> => {
    const response = await axiosInstance.get("/roles", { params });
    return unwrapResponse(response);
  },

  getById: async (id: string): Promise<Role> => {
    const response = await axiosInstance.get(`/roles/${id}`);
    return unwrapResponse(response);
  },

  create: async (data: CreateRoleDto): Promise<Role> => {
    const response = await axiosInstance.post("/roles", data);
    return unwrapResponse(response);
  },

  update: async (id: string, data: Partial<CreateRoleDto>): Promise<Role> => {
    const response = await axiosInstance.patch(`/roles/${id}`, data);
    return unwrapResponse(response);
  },

  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/roles/${id}`);
  },
};
