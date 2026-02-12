import axiosInstance from "./axiosInstance";
import type {
  DocumentType,
  CreateDocumentTypeDto,
  UpdateDocumentTypeDto,
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

export const documentTypesAPI = {
  getAllCommon: async (): Promise<DocumentType[]> => {
    const response = await axiosInstance.get("/document-types/common");
    return unwrapResponse(response);
  },

  getById: async (id: string): Promise<DocumentType> => {
    const response = await axiosInstance.get(`/document-types/${id}`);
    return unwrapResponse(response);
  },

  create: async (data: CreateDocumentTypeDto): Promise<DocumentType> => {
    const response = await axiosInstance.post("/document-types", data);
    return unwrapResponse(response);
  },

  update: async (
    id: string,
    data: UpdateDocumentTypeDto
  ): Promise<DocumentType> => {
    const response = await axiosInstance.put(`/document-types/${id}`, data);
    return unwrapResponse(response);
  },

  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/document-types/${id}`);
  },
};
