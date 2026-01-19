import { api } from './client'
import type { 
  LoginCredentials, 
  RegisterData, 
  AuthResponse, 
  ApiResponse,
  Company 
} from '@/types'

// Map backend response to frontend Company type
function mapBackendUserToCompany(data: any): Company {
  return {
    id: data.id,
    email: data.email,
    role: data.role,
    full_name: data.full_name,
    phone: data.phone,
    avatar_url: data.avatar_url,
    company_name: data.company_name,
    company_logo_url: data.company_logo_url,
    company_description: data.company_description,
    company_website: data.company_website,
    company_industry: data.company_industry,
    company_size: data.company_size,
    company_location: data.company_location,
    is_active: data.is_active,
    is_verified: data.is_verified,
    // Map is_verified boolean to verification_status
    verification_status: data.is_verified ? 'verified' : 'pending',
    created_at: data.created_at,
  }
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post('/auth/login', credentials)
    if (response.success && response.data?.user) {
      response.data.user = mapBackendUserToCompany(response.data.user)
    }
    return response
  },

  register: async (data: RegisterData): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post('/auth/register', {
      ...data,
      role: 'company', // Always register as company
    })
    if (response.success && response.data?.user) {
      response.data.user = mapBackendUserToCompany(response.data.user)
    }
    return response
  },

  logout: async (): Promise<ApiResponse<null>> => {
    return api.post('/auth/logout')
  },

  refreshToken: async (refreshToken: string): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post('/auth/refresh', { refresh_token: refreshToken })
    if (response.success && response.data?.user) {
      response.data.user = mapBackendUserToCompany(response.data.user)
    }
    return response
  },

  getProfile: async (): Promise<ApiResponse<Company>> => {
    const response = await api.get('/auth/me')
    if (response.success && response.data) {
      response.data = mapBackendUserToCompany(response.data)
    }
    return response
  },

  // Note: Profile update endpoint to be added to backend
  updateProfile: async (data: Partial<Company>): Promise<ApiResponse<Company>> => {
    return api.put('/auth/profile', data)
  },

  // Note: Password reset endpoints to be added to backend
  forgotPassword: async (email: string): Promise<ApiResponse<null>> => {
    return api.post('/auth/forgot-password', { email })
  },

  resetPassword: async (token: string, password: string): Promise<ApiResponse<null>> => {
    return api.post('/auth/reset-password', { token, password })
  },

  // Change password (authenticated)
  changePassword: async (currentPassword: string, newPassword: string): Promise<ApiResponse<null>> => {
    return api.post('/auth/change-password', { 
      current_password: currentPassword, 
      new_password: newPassword 
    })
  },
}
