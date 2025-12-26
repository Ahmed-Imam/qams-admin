import axiosInstance from "./axiosInstance";
import type {
  OnboardingTemplate,
  CreateTemplateDto,
  UpdateTemplateDto,
  GetTemplatesQuery,
  PaginatedResponse,
} from "../types";

interface ApiResponse<T> {
  statusCode: number;
  data: T;
}

const unwrapResponse = <T>(response: { data: ApiResponse<T> | T }): T => {
  const data = response.data;
  if (data && typeof data === 'object' && 'statusCode' in data && 'data' in data) {
    return (data as ApiResponse<T>).data;
  }
  return data as T;
};

export const templatesAPI = {
  getAll: async (
    query?: GetTemplatesQuery & { page?: number; limit?: number }
  ): Promise<PaginatedResponse<OnboardingTemplate>> => {
    const response = await axiosInstance.get("/onboarding/templates", { params: query });
    return unwrapResponse(response);
  },

  getById: async (id: string): Promise<OnboardingTemplate> => {
    const response = await axiosInstance.get(`/onboarding/templates/${id}`);
    return unwrapResponse(response);
  },

  getByTemplateId: async (templateId: string): Promise<OnboardingTemplate> => {
    const response = await axiosInstance.get(`/onboarding/templates/template-id/${templateId}`);
    return unwrapResponse(response);
  },

  create: async (data: CreateTemplateDto): Promise<OnboardingTemplate> => {
    const response = await axiosInstance.post("/onboarding/templates", data);
    return unwrapResponse(response);
  },

  update: async (id: string, data: UpdateTemplateDto): Promise<OnboardingTemplate> => {
    const response = await axiosInstance.patch(`/onboarding/templates/${id}`, data);
    return unwrapResponse(response);
  },

  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/onboarding/templates/${id}`);
  },
};

