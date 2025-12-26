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

export type UserStatus = 'active' | 'invited' | 'inactive' | 'suspended';

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

export type ClientType = 'hospital' | 'laboratory' | 'clinic' | 'pharmacy' | 'other';

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
  role: string;
  department: string;
  status?: UserStatus;
  isSuperAdmin?: boolean;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  department?: string;
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
  type: 'single' | 'multi';
  options: QuestionOption[];
  facilityType?: string;
  order?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateQuestionDto {
  questionId: string;
  questionTitle: string;
  description?: string;
  type: 'single' | 'multi';
  options: QuestionOption[];
  facilityType?: string;
  order?: number;
  isActive?: boolean;
}

export interface UpdateQuestionDto {
  questionId?: string;
  questionTitle?: string;
  description?: string;
  type?: 'single' | 'multi';
  options?: QuestionOption[];
  facilityType?: string;
  order?: number;
  isActive?: boolean;
}

export interface GetQuestionsQuery {
  facilityType?: string;
  type?: 'single' | 'multi';
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}
