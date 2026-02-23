import axiosInstance from "./axiosInstance";
import type {
  Workflow,
  CreateWorkflowDto,
  UpdateWorkflowDto,
} from "../types";

interface ApiResponse<T> {
  statusCode: number;
  data: T;
}

const unwrapResponse = <T>(response: { data: ApiResponse<T> | T }): T => {
  const data = response.data;
  if (
    data &&
    typeof data === "object" &&
    "statusCode" in data &&
    "data" in data
  ) {
    return (data as ApiResponse<T>).data;
  }
  return data as T;
};

export const workflowsAPI = {
  getAllCommon: async (): Promise<Workflow[]> => {
    const response = await axiosInstance.get("/workflows/common");
    return unwrapResponse(response);
  },

  getById: async (id: string): Promise<Workflow> => {
    const response = await axiosInstance.get(`/workflows/${id}`);
    return unwrapResponse(response);
  },

  create: async (data: CreateWorkflowDto): Promise<Workflow> => {
    const response = await axiosInstance.post("/workflows", data);
    return unwrapResponse(response);
  },

  update: async (
    id: string,
    data: UpdateWorkflowDto
  ): Promise<Workflow> => {
    const response = await axiosInstance.put(`/workflows/${id}`, data);
    return unwrapResponse(response);
  },

  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/workflows/${id}`);
  },
};
