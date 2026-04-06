import axiosInstance from "./axiosInstance";

interface ApiResponse<T> {
  statusCode: number;
  data: T;
}

interface Accreditation {
  _id: string;
  name: string;
  code: string;
  description?: string;
  type: string;
  status: string;
  authority: string;
  country: string;
  validityPeriod: number;
  website?: string;
  email?: string;
  requirements?: string[];
  client?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAccreditationDto {
  name: string;
  code: string;
  description?: string;
  type: string;
  status: string;
  authority: string;
  country: string;
  validityPeriod: number;
  website?: string;
  email?: string;
  requirements?: string[];
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

export const accreditationsAPI = {
  getAll: async (clientId?: string): Promise<Accreditation[]> => {
    const params = clientId ? { clientId } : {};
    const response = await axiosInstance.get("/accreditations", { params });
    return unwrapResponse(response);
  },

  getById: async (id: string): Promise<Accreditation> => {
    const response = await axiosInstance.get(`/accreditations/${id}`);
    return unwrapResponse(response);
  },

  create: async (dto: CreateAccreditationDto): Promise<Accreditation> => {
    const response = await axiosInstance.post("/accreditations", dto);
    return unwrapResponse(response);
  },

  update: async (
    id: string,
    dto: Partial<CreateAccreditationDto>,
  ): Promise<Accreditation> => {
    const response = await axiosInstance.patch(`/accreditations/${id}`, dto);
    return unwrapResponse(response);
  },

  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/accreditations/${id}`);
  },
};

export type { Accreditation };
