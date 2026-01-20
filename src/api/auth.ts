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
    company_phone: data.company_phone,
    company_email: data.company_email,
    company_address: data.company_address,
    company_city: data.company_city,
    company_province: data.company_province,
    company_postal_code: data.company_postal_code,
    established_year: data.established_year,
    employee_count: data.employee_count,
    is_active: data.is_active,
    is_verified: data.is_verified,
    // Map company_status from backend (priority) or fallback to is_verified
    verification_status: data.company_status || (data.is_verified ? 'verified' : 'pending'),
    created_at: data.created_at,
    // Map document URLs
    ktp_founder_url: data.ktp_founder_url,
    akta_pendirian_url: data.akta_pendirian_url,
    npwp_url: data.npwp_url,
    nib_url: data.nib_url,
  }
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials)
    if (response.success && response.data?.user) {
      response.data.user = mapBackendUserToCompany(response.data.user)
    }
    return response
  },

  register: async (data: RegisterData): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', {
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
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/refresh', { refresh_token: refreshToken })
    if (response.success && response.data?.user) {
      response.data.user = mapBackendUserToCompany(response.data.user)
    }
    return response
  },

  getProfile: async (): Promise<ApiResponse<Company>> => {
    const response = await api.get<ApiResponse<any>>('/auth/me')
    if (response && typeof response === 'object' && 'success' in response && response.success && 'data' in response && response.data) {
      const mappedData = mapBackendUserToCompany(response.data)
      return {
        success: true,
        data: mappedData,
      } as ApiResponse<Company>
    }
    return response as unknown as ApiResponse<Company>
  },

  // Note: Profile update endpoint to be added to backend
  updateProfile: async (data: Partial<Company>): Promise<ApiResponse<Company>> => {
    // Save company data to the companies table endpoint
    const companyData: any = {
      company_name: data.company_name,
      company_description: data.company_description,
      company_website: data.company_website,
      company_industry: data.company_industry,
      company_size: data.company_size,
      company_location: data.company_location,
      company_phone: data.company_phone,
      company_email: data.company_email,
      company_address: data.company_address,
      company_city: data.company_city,
      company_province: data.company_province,
      company_postal_code: data.company_postal_code,
      established_year: data.established_year,
      employee_count: data.employee_count,
    }

    const response = await api.put<ApiResponse<any>>('/companies/profile', companyData)
    if (response.success && response.data) {
      const mappedData = mapBackendUserToCompany(response.data)
      return {
        success: response.success,
        data: mappedData,
      } as ApiResponse<Company>
    }
    return response as unknown as ApiResponse<Company>
  },

  // Upload company logo
  uploadLogo: async (file: File): Promise<ApiResponse<any>> => {
    const formData = new FormData()
    formData.append('logo', file)
    
    const response = await api.upload<ApiResponse<any>>('/companies/logo', formData)
    return response
  },

  // Upload company document
  uploadDocument: async (file: File, docType: string): Promise<ApiResponse<any>> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('doc_type', docType)
    
    const response = await api.upload<ApiResponse<any>>('/companies/documents', formData)
    return response
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
