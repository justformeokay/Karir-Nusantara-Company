import { api } from './client'
import type { 
  LoginCredentials, 
  RegisterData, 
  AuthResponse, 
  ApiResponse,
  Company 
} from '@/types'

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> => {
    return api.post('/auth/login', credentials)
  },

  register: async (data: RegisterData): Promise<ApiResponse<AuthResponse>> => {
    return api.post('/auth/register', {
      ...data,
      role: 'company', // Always register as company
    })
  },

  logout: async (): Promise<ApiResponse<null>> => {
    return api.post('/auth/logout')
  },

  refreshToken: async (refreshToken: string): Promise<ApiResponse<AuthResponse>> => {
    return api.post('/auth/refresh', { refresh_token: refreshToken })
  },

  getProfile: async (): Promise<ApiResponse<Company>> => {
    return api.get('/auth/me')
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
