import axiosInstance from "./axiosInstance";

export type FormFieldType =
  | "text_input"
  | "text_area"
  | "dropdown"
  | "checkbox"
  | "date"
  | "file_upload";

export type FormType = "normal" | "incident";

export interface FormField {
  name: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  required?: boolean;
  options?: string[];
}

export interface CapaTrigger {
  field: string;
  value: string;
}

export interface Form {
  _id: string;
  name: string;
  description?: string;
  formType?: FormType;
  capaRequired?: boolean;
  formFields: FormField[];
  capaTriggers?: CapaTrigger[];
  createdBy?: unknown;
  updatedBy?: unknown;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateFormDto {
  name: string;
  description?: string;
  formType?: FormType;
  capaRequired?: boolean;
  formFields: FormField[];
  capaTriggers?: CapaTrigger[];
}

export interface UpdateFormDto extends Partial<CreateFormDto> {}

interface ApiResponse<T> {
  statusCode?: number;
  data?: T;
}

const unwrapResponse = <T>(response: { data: ApiResponse<T> | T }): T => {
  const data = response.data;
  if (
    data &&
    typeof data === "object" &&
    "statusCode" in data &&
    "data" in data
  ) {
    return (data as ApiResponse<T>).data as T;
  }
  return data as T;
};

export const formsAPI = {
  getCommon: async (params?: {
    formType?: FormType;
  }): Promise<Form[]> => {
    const response = await axiosInstance.get("/forms", {
      params: { commonOnly: true, ...params },
    });
    return unwrapResponse(response);
  },

  getById: async (id: string): Promise<Form> => {
    const response = await axiosInstance.get(`/forms/${id}`);
    return unwrapResponse(response);
  },

  create: async (data: CreateFormDto): Promise<Form> => {
    const response = await axiosInstance.post("/forms", data);
    return unwrapResponse(response);
  },

  update: async (id: string, data: UpdateFormDto): Promise<Form> => {
    const response = await axiosInstance.put(`/forms/${id}`, data);
    return unwrapResponse(response);
  },

  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/forms/${id}`);
  },
};
