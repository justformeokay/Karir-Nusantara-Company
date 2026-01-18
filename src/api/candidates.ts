import { api } from './client'
import type { 
  Application, 
  ApplicationStatus,
  ApiResponse, 
  PaginatedResponse,
  ApplicationStatusHistory
} from '@/types'

export interface ApplicationsParams {
  page?: number
  per_page?: number
  job_id?: number
  status?: ApplicationStatus
  search?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  [key: string]: string | number | undefined
}

export interface UpdateStatusRequest {
  status: ApplicationStatus
  notes?: string
}

export const candidatesApi = {
  // List all applications for the company
  getAll: async (params?: ApplicationsParams): Promise<PaginatedResponse<Application>> => {
    return api.get('/applications/company', { params })
  },

  // Get application by ID
  getById: async (id: number | string): Promise<ApiResponse<Application>> => {
    return api.get(`/applications/${id}`)
  },

  // Get application timeline/status history
  getTimeline: async (id: number | string): Promise<ApiResponse<ApplicationStatusHistory[]>> => {
    return api.get(`/applications/${id}/timeline`)
  },

  // List applications for a specific job
  getByJob: async (jobId: number | string, params?: Omit<ApplicationsParams, 'job_id'>): Promise<PaginatedResponse<Application>> => {
    return api.get(`/jobs/${jobId}/applications`, { params })
  },

  // Update application status (company only)
  updateStatus: async (id: number | string, data: UpdateStatusRequest): Promise<ApiResponse<Application>> => {
    return api.patch(`/applications/${id}/status`, data)
  },

  // Helper method to download CV
  downloadCV: async (cvUrl: string): Promise<Blob> => {
    const response = await fetch(cvUrl)
    return response.blob()
  },
}
