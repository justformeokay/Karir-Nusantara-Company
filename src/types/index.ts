// ============================================
// COMPANY TYPES
// ============================================

export type CompanyStatus = 'pending' | 'verified' | 'rejected' | 'suspended'

export interface Company {
  id: number
  email: string
  role: string
  full_name: string
  phone?: string
  avatar_url?: string
  company_name?: string
  company_logo_url?: string
  company_description?: string
  company_website?: string
  company_industry?: string
  company_size?: string
  company_location?: string
  is_active: boolean
  is_verified: boolean
  verification_status?: CompanyStatus
  created_at: string
}

// ============================================
// JOB TYPES
// ============================================

// Backend job statuses: draft, active, paused, closed, filled
export type JobStatus = 'draft' | 'active' | 'paused' | 'closed' | 'filled'
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'internship'
export type WorkLocation = 'onsite' | 'remote' | 'hybrid'

export interface Job {
  id: number
  company_id: number
  title: string
  slug: string
  description: string
  requirements: string
  responsibilities?: string
  benefits?: string
  location: string
  work_type: WorkLocation
  employment_type: EmploymentType
  experience_level: string
  salary_min?: number
  salary_max?: number
  salary_currency: string
  salary_visible: boolean
  category: string
  skills: string[]
  application_url?: string
  application_email?: string
  status: JobStatus
  applications_count: number
  views_count: number
  is_featured: boolean
  is_urgent: boolean
  published_at?: string
  expires_at?: string
  created_at: string
  updated_at: string
}

export interface JobFormData {
  title: string
  description: string
  requirements: string
  responsibilities?: string
  benefits?: string
  location: string
  work_type: WorkLocation
  employment_type: EmploymentType
  experience_level: string
  salary_min?: number
  salary_max?: number
  salary_currency: string
  salary_visible: boolean
  category: string
  skills: string[]
  application_email?: string
  expires_at?: string
}

// ============================================
// CANDIDATE / APPLICATION TYPES
// ============================================

// Backend application statuses
export type ApplicationStatus = 
  | 'submitted' 
  | 'viewed'
  | 'shortlisted'
  | 'interview_scheduled'
  | 'interview_completed'
  | 'assessment'
  | 'offer_sent'
  | 'offer_accepted'
  | 'hired'
  | 'rejected'
  | 'withdrawn'

export interface Candidate {
  id: number
  user_id: number
  full_name: string
  email: string
  phone?: string
  avatar_url?: string
  cv_url?: string
  created_at: string
}

export interface Application {
  id: number
  job_id: number
  user_id: number
  cv_id?: number
  cover_letter?: string
  current_status: ApplicationStatus
  status_label: string
  applied_at: string
  viewed_at?: string
  created_at: string
  updated_at: string
  job?: Pick<Job, 'id' | 'title' | 'status'>
  applicant?: Candidate
  status_history?: ApplicationStatusHistory[]
}

export interface ApplicationStatusHistory {
  id: number
  application_id: number
  status: ApplicationStatus
  notes?: string
  created_by_id: number
  created_at: string
}

// ============================================
// QUOTA & PAYMENT TYPES
// ============================================

export type PaymentStatus = 'pending' | 'confirmed' | 'rejected'

export interface JobQuota {
  free_quota: number
  used_free_quota: number
  remaining_free_quota: number
  paid_quota: number
  price_per_job: number
}

export interface PaymentProof {
  id: number
  job_id?: number
  job_title?: string
  amount: number
  proof_image_url: string
  status: PaymentStatus
  status_label: string
  note?: string
  submitted_at: string
  confirmed_at?: string
}

// ============================================
// DASHBOARD STATS
// ============================================

export interface DashboardStats {
  active_jobs: number
  total_applicants: number
  under_review: number
  accepted_candidates: number
  recent_applicants: RecentApplicant[]
  active_jobs_list: ActiveJob[]
}

export interface RecentApplicant {
  id: number
  applicant_name: string
  applicant_photo: string
  job_id: number
  job_title: string
  status: ApplicationStatus
  status_label: string
  applied_at: string
}

export interface ActiveJob {
  id: number
  title: string
  status: JobStatus
  applicants_count: number
  views_count: number
  created_at: string
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: {
    code: string
    message: string
    details?: Record<string, string>
  }
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  message?: string
  meta: {
    page: number
    per_page: number
    total_pages: number
    total_items: number
  }
}

// ============================================
// AUTH TYPES
// ============================================

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  full_name: string
  phone?: string
  role: 'company'
  company_name: string
}

export interface AuthResponse {
  user: Company
  access_token: string
  refresh_token: string
  expires_in: number
}
