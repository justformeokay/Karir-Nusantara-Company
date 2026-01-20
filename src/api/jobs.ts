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

// Normalize job data from backend
function normalizeJob(data: any): Job {
  // Handle location - could be string or object
  let location = data.location
  if (typeof location === 'object' && location !== null) {
    // If location is object with city/province, construct string
    if (location.city && location.province) {
      location = `${location.city}, ${location.province}`
    } else if (location.city) {
      location = location.city
    } else if (location.province) {
      location = location.province
    } else {
      location = JSON.stringify(location)
    }
  }

  return {
    id: data.id,
    company_id: data.company_id,
    title: data.title,
    slug: data.slug,
    description: data.description,
    requirements: data.requirements,
    responsibilities: data.responsibilities,
    benefits: data.benefits,
    location: location || '',
    work_type: data.work_type,
    employment_type: data.employment_type,
    experience_level: data.experience_level,
    salary_min: data.salary_min,
    salary_max: data.salary_max,
    salary_currency: data.salary_currency,
    salary_visible: data.salary_visible,
    category: data.category,
    // Ensure skills is array of strings
    skills: Array.isArray(data.skills) 
      ? data.skills.map((s: any) => typeof s === 'string' ? s : s.name || JSON.stringify(s))
      : [],
    application_url: data.application_url,
    application_email: data.application_email,
    status: data.status,
    applications_count: data.applications_count || 0,
    views_count: data.views_count || 0,
    is_featured: data.is_featured,
    is_urgent: data.is_urgent,
    published_at: data.published_at,
    expires_at: data.expires_at,
    created_at: data.created_at,
    updated_at: data.updated_at,
  }
}

export const jobsApi = {
  // Get all jobs (public endpoint)
  getAll: async (params?: JobsParams): Promise<PaginatedResponse<Job>> => {
    const response = await api.get<PaginatedResponse<any>>('/jobs', { params })
    if (response.data && Array.isArray(response.data)) {
      return {
        ...response,
        data: response.data.map(normalizeJob),
      }
    }
    return response as unknown as PaginatedResponse<Job>
  },

  // Get company's jobs (authenticated - company only)
  getCompanyJobs: async (params?: JobsParams): Promise<PaginatedResponse<Job>> => {
    const response = await api.get<PaginatedResponse<any>>('/jobs/company/list', { params })
    if (response.data && Array.isArray(response.data)) {
      return {
        ...response,
        data: response.data.map(normalizeJob),
      }
    }
    return response as unknown as PaginatedResponse<Job>
  },

  // Get job by ID
  getById: async (id: number | string): Promise<ApiResponse<Job>> => {
    const response = await api.get<ApiResponse<any>>(`/jobs/${id}`)
    if (response.data && response.success) {
      return {
        ...response,
        data: normalizeJob(response.data),
      } as unknown as ApiResponse<Job>
    }
    return response as unknown as ApiResponse<Job>
  },

  // Get job by slug
  getBySlug: async (slug: string): Promise<ApiResponse<Job>> => {
    const response = await api.get<ApiResponse<any>>(`/jobs/slug/${slug}`)
    if (response.data && response.success) {
      return {
        ...response,
        data: normalizeJob(response.data),
      } as unknown as ApiResponse<Job>
    }
    return response as unknown as ApiResponse<Job>
  },

  // Create a new job (company only)
  create: async (data: JobFormData): Promise<ApiResponse<Job>> => {
    // Transform frontend data to backend format
    const backendData = {
      title: data.title,
      description: data.description,
      requirements: data.requirements,
      responsibilities: data.responsibilities,
      benefits: data.benefits,
      // Split location into city and province if contains comma, otherwise use as city
      city: data.location.includes(',') ? data.location.split(',')[0].trim() : data.location,
      province: data.location.includes(',') ? data.location.split(',')[1].trim() : data.location,
      // Map work_type to is_remote
      is_remote: data.work_type === 'remote',
      // Map employment_type to job_type
      job_type: data.employment_type,
      experience_level: data.experience_level,
      salary_min: data.salary_min,
      salary_max: data.salary_max,
      salary_currency: data.salary_currency || 'IDR',
      is_salary_visible: data.salary_visible,
      application_deadline: data.expires_at,
      skills: data.skills || [],
      status: 'active', // Publish directly
    }
    
    const response = await api.post<ApiResponse<any>>('/jobs', backendData)
    if (response.data && response.success) {
      return {
        ...response,
        data: normalizeJob(response.data),
      } as unknown as ApiResponse<Job>
    }
    return response as unknown as ApiResponse<Job>
  },

  // Update job (company only)
  update: async (id: number | string, data: Partial<JobFormData>): Promise<ApiResponse<Job>> => {
    const response = await api.put<ApiResponse<any>>(`/jobs/${id}`, data)
    if (response.data && response.success) {
      return {
        ...response,
        data: normalizeJob(response.data),
      } as unknown as ApiResponse<Job>
    }
    return response as unknown as ApiResponse<Job>
  },

  // Delete job (company only)
  delete: async (id: number | string): Promise<ApiResponse<null>> => {
    return api.delete<ApiResponse<null>>(`/jobs/${id}`)
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
