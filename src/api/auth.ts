import axiosInstance from "./axiosInstance";
import type { LoginCredentials, LoginResponse, User } from "../types";

interface ApiResponse<T> {
  statusCode: number;
  data: T;
}

export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await axiosInstance.post<ApiResponse<LoginResponse>>("/users/login", credentials);
    // API wraps response in { statusCode, data }
    return response.data.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await axiosInstance.get<ApiResponse<User>>("/users/me");
    // API wraps response in { statusCode, data }
    return response.data.data;
  },

  logout: async (): Promise<void> => {
    localStorage.removeItem("admin-auth-token");
  },
};
