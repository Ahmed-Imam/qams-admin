import axiosInstance from "./axiosInstance";
import type { Question, CreateQuestionDto, UpdateQuestionDto, GetQuestionsQuery, PaginatedResponse } from "../types";

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

export const questionsAPI = {
  getAll: async (query?: GetQuestionsQuery & { page?: number; limit?: number }): Promise<PaginatedResponse<Question>> => {
    const response = await axiosInstance.get("/onboarding/questions", { params: query });
    return unwrapResponse(response);
  },

  getById: async (id: string): Promise<Question> => {
    const response = await axiosInstance.get(`/onboarding/questions/${id}`);
    return unwrapResponse(response);
  },

  getByQuestionId: async (questionId: string): Promise<Question> => {
    const response = await axiosInstance.get(`/onboarding/questions/question-id/${questionId}`);
    return unwrapResponse(response);
  },

  create: async (data: CreateQuestionDto): Promise<Question> => {
    const response = await axiosInstance.post("/onboarding/questions", data);
    return unwrapResponse(response);
  },

  update: async (id: string, data: UpdateQuestionDto): Promise<Question> => {
    const response = await axiosInstance.patch(`/onboarding/questions/${id}`, data);
    return unwrapResponse(response);
  },

  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/onboarding/questions/${id}`);
  },
};

