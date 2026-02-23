// User types
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  department: Department;
  status: UserStatus;
  clients: Client[];
  signature?: string;
  isSuperAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UserStatus = "active" | "invited" | "inactive" | "suspended";

export interface Role {
  _id: string;
  name: string;
  permissions: string[];
  description?: string;
  client?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Department {
  _id: string;
  name: string;
  description?: string;
  client?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Client types
export interface Client {
  _id: string;
  name: string;
  type: ClientType;
  classification: string;
  address: string;
  createdBy: User | string;
  createdAt: string;
  updatedAt: string;
}

/** Client with users array (from GET /clients/:id) */
export interface ClientWithUsers extends Client {
  users?: User[];
}

export type ClientType =
  | "hospital"
  | "laboratory"
  | "clinic"
  | "pharmacy"
  | "other";

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface AuthUser extends User {}

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

// Dashboard stats
export interface DashboardStats {
  totalClients: number;
  totalUsers: number;
  totalRoles: number;
  totalDepartments: number;
  activeUsers: number;
  inactiveUsers: number;
  recentClients: Client[];
  recentUsers: User[];
}

// Form types
export interface CreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roleId: string;
  departmentId: string;
  client?: string;
  status?: UserStatus;
  isSuperAdmin?: boolean;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  roleId?: string;
  departmentId?: string;
  status?: UserStatus;
  isSuperAdmin?: boolean;
}

export interface CreateClientDto {
  name: string;
  type: ClientType;
  classification: string;
  address: string;
}

export interface UpdateClientDto {
  name?: string;
  type?: ClientType;
  classification?: string;
  address?: string;
}

export interface CreateRoleDto {
  name: string;
  permissions: string[];
  description?: string;
  client: string;
}

export interface CreateDepartmentDto {
  name: string;
  description?: string;
  client: string;
}

// Question types
export interface QuestionOption {
  id: string;
  label: string;
}

export interface Question {
  _id: string;
  questionId: string;
  questionTitle: string;
  description?: string;
  type: "single" | "multi";
  options: QuestionOption[];
  facilityType?: string | string[];
  order?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateQuestionDto {
  questionId: string;
  questionTitle: string;
  description?: string;
  type: "single" | "multi";
  options: QuestionOption[];
  facilityType?: string | string[];
  order?: number;
  isActive?: boolean;
}

export interface UpdateQuestionDto {
  questionId?: string;
  questionTitle?: string;
  description?: string;
  type?: "single" | "multi";
  options?: QuestionOption[];
  facilityType?: string | string[];
  order?: number;
  isActive?: boolean;
}

export interface GetQuestionsQuery {
  facilityType?: string;
  type?: "single" | "multi";
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

// Template types
export type TemplateType =
  | "document"
  | "form_and_logs"
  | "incident_report"
  | "capa"
  | "checklist";

export interface OnboardingTemplate {
  _id: string;
  id: string;
  name: string;
  templateType: TemplateType;
  type: string;
  accreditation: string[];
  facilityType?: string[];
  triggerIds: string[];
  relatedDocuments?: string[];
  content?: string;
  /** Common form or incident report (when templateType is form_and_logs or incident_report) */
  form?: string | { _id: string; name: string; formType?: string };
  /** Common checklist (when templateType is checklist) */
  checklist?: string | { _id: string; name: string; code?: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTemplateDto {
  id: string;
  name: string;
  templateType: TemplateType;
  type: string;
  accreditation: string[];
  facilityType?: string[];
  triggerIds: string[];
  relatedDocuments?: string[];
  content?: string;
  /** Common form or incident report ID (when templateType is form_and_logs or incident_report) */
  form?: string;
  /** Common checklist ID (when templateType is checklist) */
  checklist?: string;
}

export interface UpdateTemplateDto {
  id?: string;
  name?: string;
  templateType?: TemplateType;
  type?: string;
  accreditation?: string[];
  facilityType?: string[];
  triggerIds?: string[];
  relatedDocuments?: string[];
  content?: string;
  form?: string;
  checklist?: string;
}

export interface GetTemplatesQuery {
  templateType?: TemplateType;
  type?: string;
  accreditation?: string;
  facilityType?: string;
  triggerId?: string;
  triggerIds?: string[];
  search?: string;
  page?: number;
  limit?: number;
}

// Document type enums (match qams-api)
export const DocumentTypeRule = {
  REQUIRE_APPROVAL: "require_approval",
  REQUIRE_TRAINING: "require_training",
  REQUIRE_VERSIONING: "require_versioning",
  APPEARS_IN_TRAINING: "appears_in_training",
  EDITABLE_AFTER_APPROVAL: "editable_after_approval",
  AUTO_PUBLISH_ON_APPROVAL: "auto_publish_on_approval",
} as const;
export type DocumentTypeRule =
  (typeof DocumentTypeRule)[keyof typeof DocumentTypeRule];

export const DocumentTypeIntegration = {
  FORMS: "forms",
  CHECKLISTS: "checklists",
  RISK_ASSESSMENTS: "risk_assessments",
  EQUIPMENT: "equipment",
} as const;
export type DocumentTypeIntegration =
  (typeof DocumentTypeIntegration)[keyof typeof DocumentTypeIntegration];

export interface WorkflowRef {
  _id: string;
  name: string;
  description?: string;
}

// Workflow step (match qams-api)
export type WorkflowStepAction = "review" | "approve" | "acknowledge";
export type WorkflowStepOption = "required" | "notify" | "editable";
export type WorkflowStepRoleType = "admin" | "staff";

export interface WorkflowStep {
  _id?: string;
  name: string;
  role?: string;
  roleType?: WorkflowStepRoleType;
  action: WorkflowStepAction;
  options: WorkflowStepOption[];
}

export type WorkflowStatus = "active" | "paused";

export interface Workflow {
  _id: string;
  client?: string | null;
  name: string;
  description?: string;
  initialStatus: WorkflowStatus;
  steps: WorkflowStep[];
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateWorkflowStepDto {
  name: string;
  role?: string;
  roleType?: WorkflowStepRoleType;
  action: WorkflowStepAction;
  options: WorkflowStepOption[];
}

export interface CreateWorkflowDto {
  name: string;
  description?: string;
  initialStatus?: WorkflowStatus;
  steps: CreateWorkflowStepDto[];
}

export interface UpdateWorkflowDto {
  name?: string;
  description?: string;
  initialStatus?: WorkflowStatus;
  steps?: CreateWorkflowStepDto[];
}

export interface DocumentType {
  _id: string;
  client?: string | null;
  name: string;
  code: string;
  description: string;
  visibility: Role[] | string[];
  rules: DocumentTypeRule[];
  integrationSettings: DocumentTypeIntegration[];
  reviewCycle: number;
  workflow: WorkflowRef | string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDocumentTypeDto {
  client?: string;
  name: string;
  code: string;
  description: string;
  visibility: string[];
  rules?: DocumentTypeRule[];
  integrationSettings?: DocumentTypeIntegration[];
  reviewCycle: number;
  workflow?: string;
}

export interface UpdateDocumentTypeDto {
  name?: string;
  code?: string;
  description?: string;
  visibility?: string[];
  rules?: DocumentTypeRule[];
  integrationSettings?: DocumentTypeIntegration[];
  reviewCycle?: number;
  workflow?: string;
}
