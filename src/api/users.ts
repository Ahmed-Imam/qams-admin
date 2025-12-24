import axiosInstance from "./axiosInstance";
import type { User, CreateUserDto, UpdateUserDto, PaginatedResponse } from "../types";

interface ApiResponse<T> {
  statusCode: number;
  data: T;
}

interface GetUsersParams {
  page?: number;
  limit?: number;
  clientId?: string;
  search?: string;
  status?: string;
}

const unwrapResponse = <T>(response: { data: ApiResponse<T> | T }): T => {
  const data = response.data;
  if (data && typeof data === 'object' && 'statusCode' in data && 'data' in data) {
    return (data as ApiResponse<T>).data;
  }
  return data as T;
};

export const usersAPI = {
  getAll: async (params?: GetUsersParams): Promise<PaginatedResponse<User>> => {
    const response = await axiosInstance.get("/users", { params });
    return unwrapResponse(response);
  },

  getById: async (id: string): Promise<User> => {
    const response = await axiosInstance.get(`/users/${id}`);
    return unwrapResponse(response);
  },

  create: async (data: CreateUserDto): Promise<User> => {
    const response = await axiosInstance.post("/users", data);
    return unwrapResponse(response);
  },

  update: async (id: string, data: UpdateUserDto): Promise<User> => {
    const response = await axiosInstance.patch(`/users/${id}`, data);
    return unwrapResponse(response);
  },

  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/users/${id}`);
  },

  updatePassword: async (id: string, currentPassword: string, newPassword: string): Promise<void> => {
    await axiosInstance.patch(`/users/${id}/password`, { currentPassword, newPassword });
  },
};
