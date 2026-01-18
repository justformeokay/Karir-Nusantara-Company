import { api } from './client'
import type { 
  Job, 
  JobFormData, 
  ApiResponse, 
  PaginatedResponse,
  JobStatus 
} from '@/types'

export interface JobsParams {
  page?: number
  per_page?: number
  status?: JobStatus
  search?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  [key: string]: string | number | undefined
}

export const jobsApi = {
  // Get all jobs (public endpoint)
  getAll: async (params?: JobsParams): Promise<PaginatedResponse<Job>> => {
    return api.get('/jobs', { params })
  },

  // Get job by ID
  getById: async (id: number | string): Promise<ApiResponse<Job>> => {
    return api.get(`/jobs/${id}`)
  },

  // Get job by slug
  getBySlug: async (slug: string): Promise<ApiResponse<Job>> => {
    return api.get(`/jobs/slug/${slug}`)
  },

  // Create a new job (company only)
  create: async (data: JobFormData): Promise<ApiResponse<Job>> => {
    return api.post('/jobs', data)
  },

  // Update job (company only)
  update: async (id: number | string, data: Partial<JobFormData>): Promise<ApiResponse<Job>> => {
    return api.put(`/jobs/${id}`, data)
  },

  // Delete job (company only)
  delete: async (id: number | string): Promise<ApiResponse<null>> => {
    return api.delete(`/jobs/${id}`)
  },

  // Publish job - changes status from draft to active (company only)
  publish: async (id: number | string): Promise<ApiResponse<Job>> => {
    return api.patch(`/jobs/${id}/publish`)
  },

  // Close job - changes status to closed (company only)
  close: async (id: number | string): Promise<ApiResponse<Job>> => {
    return api.patch(`/jobs/${id}/close`)
  },

  // Pause job - changes status to paused (company only)
  pause: async (id: number | string): Promise<ApiResponse<Job>> => {
    return api.patch(`/jobs/${id}/pause`)
  },

  // Reopen job - changes status from closed/paused to active (company only)
  reopen: async (id: number | string): Promise<ApiResponse<Job>> => {
    return api.patch(`/jobs/${id}/reopen`)
  },
}
