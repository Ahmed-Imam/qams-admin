import type { Client, ClientWithUsers, CreateClientDto, UpdateClientDto } from "../types";
import axiosInstance from "./axiosInstance";

interface ApiResponse<T> {
  statusCode: number;
  data: T;
}

export const clientsAPI = {
  getAll: async (params?: { page?: number; limit?: number }): Promise<Client[]> => {
    const response = await axiosInstance.get<ApiResponse<Client[]> | Client[]>("/clients", { params });
    // Handle both wrapped and unwrapped responses
    return 'data' in response.data && 'statusCode' in response.data 
      ? response.data.data 
      : response.data as Client[];
  },

  getById: async (id: string): Promise<Client> => {
    const response = await axiosInstance.get<ApiResponse<Client>>(`/clients/${id}`);
    return 'data' in response.data && 'statusCode' in response.data 
      ? response.data.data 
      : response.data as Client;
  },

  /** Get client by id with users list (for Manage Users modal) */
  getByIdWithUsers: async (id: string): Promise<ClientWithUsers> => {
    const response = await axiosInstance.get<ApiResponse<ClientWithUsers>>(`/clients/${id}`);
    return 'data' in response.data && 'statusCode' in response.data 
      ? response.data.data 
      : response.data as ClientWithUsers;
  },

  create: async (data: CreateClientDto): Promise<Client> => {
    const response = await axiosInstance.post<ApiResponse<Client>>("/clients", data);
    return 'data' in response.data && 'statusCode' in response.data 
      ? response.data.data 
      : response.data as Client;
  },

  update: async (id: string, data: UpdateClientDto): Promise<Client> => {
    const response = await axiosInstance.patch<ApiResponse<Client>>(`/clients/${id}`, data);
    return 'data' in response.data && 'statusCode' in response.data 
      ? response.data.data 
      : response.data as Client;
  },

  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/clients/${id}`);
  },

  addUser: async (clientId: string, userId: string): Promise<Client> => {
    const response = await axiosInstance.post<ApiResponse<Client>>(`/clients/${clientId}/users`, { userId });
    return 'data' in response.data && 'statusCode' in response.data 
      ? response.data.data 
      : response.data as Client;
  },

  removeUser: async (clientId: string, userId: string): Promise<Client> => {
    const response = await axiosInstance.delete<ApiResponse<Client>>(`/clients/${clientId}/users`, { data: { userId } });
    return 'data' in response.data && 'statusCode' in response.data 
      ? response.data.data 
      : response.data as Client;
  },
};
