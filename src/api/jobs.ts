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
  // Handle location - should be object with city, province, is_remote
  let location: any = {
    city: '',
    province: '',
    is_remote: false,
  }
  
  if (typeof data.location === 'object' && data.location !== null) {
    location = {
      city: data.location.city || '',
      province: data.location.province || '',
      is_remote: data.location.is_remote || false,
    }
  } else if (typeof data.location === 'string') {
    // If location is string, split by comma for city/province
    const parts = data.location.split(',')
    location = {
      city: parts[0]?.trim() || '',
      province: parts[1]?.trim() || '',
      is_remote: data.is_remote || false,
    }
  }

  return {
    id: data.id,
    hash_id: data.hash_id,
    company_id: data.company_id,
    title: data.title,
    slug: data.slug,
    description: data.description,
    requirements: data.requirements,
    responsibilities: data.responsibilities,
    benefits: data.benefits,
    location: location,
    job_type: data.job_type || '',
    experience_level: data.experience_level,
    // Prioritize raw salary fields, fallback to nested salary object
    salary_min: data.salary_min ?? data.salary?.min,
    salary_max: data.salary_max ?? data.salary?.max,
    salary_currency: data.salary_currency || data.salary?.currency || 'IDR',
    salary_visible: data.is_salary_visible ?? data.salary_visible ?? !!data.salary,
    salary_fixed: data.is_salary_fixed ?? data.salary_fixed ?? false,
    category: data.category,
    // Ensure skills is array of strings
    skills: Array.isArray(data.skills) 
      ? data.skills.map((s: any) => typeof s === 'string' ? s : s.name || JSON.stringify(s))
      : [],
    application_url: data.application_url,
    application_email: data.application_email,
    application_deadline: data.application_deadline,
    status: data.status,
    applications_count: data.applications_count || 0,
    views_count: data.views_count || 0,
    is_featured: data.is_featured,
    is_urgent: data.is_urgent,
    published_at: data.published_at,
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
    const backendData: any = {
      title: data.title,
      category: data.category,
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
      salary_currency: data.salary_currency || 'IDR',
      is_salary_visible: data.salary_visible,
      is_salary_fixed: data.salary_fixed,
      application_deadline: data.expires_at,
      skills: data.skills || [],
      status: 'active', // Publish directly
    }
    
    // Only add salary values if they're valid numbers (not NaN)
    if (data.salary_min !== undefined && data.salary_min !== null && !isNaN(data.salary_min)) {
      backendData.salary_min = data.salary_min
    }
    if (data.salary_max !== undefined && data.salary_max !== null && !isNaN(data.salary_max)) {
      backendData.salary_max = data.salary_max
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

  // Create a new job as DRAFT (no quota check, for pending payment)
  createDraft: async (data: JobFormData): Promise<ApiResponse<Job>> => {
    // Transform frontend data to backend format
    const backendData: any = {
      title: data.title,
      category: data.category,
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
      salary_currency: data.salary_currency || 'IDR',
      is_salary_visible: data.salary_visible,
      is_salary_fixed: data.salary_fixed,
      application_deadline: data.expires_at,
      skills: data.skills || [],
      status: 'draft', // Save as draft - doesn't consume quota
    }
    
    // Only add salary values if they're valid numbers (not NaN)
    if (data.salary_min !== undefined && data.salary_min !== null && !isNaN(data.salary_min)) {
      backendData.salary_min = data.salary_min
    }
    if (data.salary_max !== undefined && data.salary_max !== null && !isNaN(data.salary_max)) {
      backendData.salary_max = data.salary_max
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
    // Transform frontend data to backend format
    const backendData: any = {}
    
    if (data.title) backendData.title = data.title
    if (data.category) backendData.category = data.category
    if (data.description) backendData.description = data.description  
    if (data.requirements) backendData.requirements = data.requirements
    if (data.responsibilities) backendData.responsibilities = data.responsibilities
    if (data.benefits) backendData.benefits = data.benefits
    if (data.location) {
      // Split location into city and province if contains comma, otherwise use as city
      backendData.city = data.location.includes(',') ? data.location.split(',')[0].trim() : data.location
      backendData.province = data.location.includes(',') ? data.location.split(',')[1].trim() : data.location
    }
    if (data.work_type) {
      // Map work_type to is_remote
      backendData.is_remote = data.work_type === 'remote'
    }
    if (data.employment_type) {
      // Map employment_type to job_type  
      backendData.job_type = data.employment_type
    }
    if (data.experience_level) backendData.experience_level = data.experience_level
    // Handle salary - make sure we don't send NaN values
    if (data.salary_min !== undefined && data.salary_min !== null && !isNaN(data.salary_min)) {
      backendData.salary_min = data.salary_min
    }
    if (data.salary_max !== undefined && data.salary_max !== null && !isNaN(data.salary_max)) {
      backendData.salary_max = data.salary_max
    }
    if (data.salary_currency) backendData.salary_currency = data.salary_currency
    if (data.salary_visible !== undefined) backendData.is_salary_visible = data.salary_visible
    if (data.salary_fixed !== undefined) backendData.is_salary_fixed = data.salary_fixed
    if (data.expires_at) backendData.application_deadline = data.expires_at
    if (data.skills) backendData.skills = data.skills
    
    console.log('🔄 Transforming update data:', {
      frontend: data,
      backend: backendData,
      salaryCheck: {
        salary_min: data.salary_min,
        salary_min_isNaN: isNaN(data.salary_min as any),
        salary_max: data.salary_max,
        salary_max_isNaN: isNaN(data.salary_max as any),
      }
    })
    
    const response = await api.put<ApiResponse<any>>(`/jobs/${id}`, backendData)
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
