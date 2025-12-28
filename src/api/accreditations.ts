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
  /**
   * Get all accreditations
   * If clientId is not provided, returns accreditations without a client
   */
  getAll: async (clientId?: string): Promise<Accreditation[]> => {
    const params = clientId ? { clientId } : {};
    const response = await axiosInstance.get("/accreditations", { params });
    return unwrapResponse(response);
  },

  /**
   * Get accreditation by ID
   */
  getById: async (id: string): Promise<Accreditation> => {
    const response = await axiosInstance.get(`/accreditations/${id}`);
    return unwrapResponse(response);
  },
};

export type { Accreditation };
