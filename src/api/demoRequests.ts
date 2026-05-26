import axiosInstance from "./axiosInstance";

export type DemoRequestStatus = "new" | "contacted" | "qualified" | "closed";

export interface DemoRequest {
  _id: string;
  fullName: string;
  email: string;
  company: string;
  role?: string;
  phone?: string;
  country?: string;
  message?: string;
  source?: string;
  status: DemoRequestStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListDemoRequestsParams {
  status?: DemoRequestStatus | "all";
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedDemoRequests {
  items: DemoRequest[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface DemoRequestStats {
  total: number;
  byStatus: Record<DemoRequestStatus, number>;
}

interface ApiEnvelope<T> {
  statusCode?: number;
  data: T;
}

const unwrap = <T>(res: { data: ApiEnvelope<T> | T }): T => {
  const d = res.data as any;
  if (d && typeof d === "object" && "data" in d) return d.data as T;
  return d as T;
};

export const demoRequestsAPI = {
  list: async (params: ListDemoRequestsParams = {}) => {
    const res = await axiosInstance.get("/demo-requests", { params });
    return unwrap<PaginatedDemoRequests>(res);
  },
  stats: async () => {
    const res = await axiosInstance.get("/demo-requests/stats");
    return unwrap<DemoRequestStats>(res);
  },
  get: async (id: string) => {
    const res = await axiosInstance.get(`/demo-requests/${id}`);
    return unwrap<DemoRequest>(res);
  },
  update: async (
    id: string,
    payload: { status?: DemoRequestStatus; notes?: string },
  ) => {
    const res = await axiosInstance.patch(`/demo-requests/${id}`, payload);
    return unwrap<DemoRequest>(res);
  },
  remove: async (id: string) => {
    const res = await axiosInstance.delete(`/demo-requests/${id}`);
    return unwrap<{ deleted: boolean }>(res);
  },
};
