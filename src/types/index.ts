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
  // Basic company information
  company_name?: string
  company_logo_url?: string
  company_description?: string
  company_website?: string
  company_industry?: string
  company_size?: string
  company_location?: string
  // Contact information
  company_phone?: string
  company_email?: string
  // Address information
  company_address?: string
  company_city?: string
  company_province?: string
  company_postal_code?: string
  // Additional information
  established_year?: number
  employee_count?: number
  // Document URLs
  ktp_founder_url?: string
  akta_pendirian_url?: string
  npwp_url?: string
  nib_url?: string
  // Status
  is_active: boolean
  is_verified: boolean
  verification_status?: CompanyStatus
  // Timestamps
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
  hash_id?: string
  company_id: number
  title: string
  slug: string
  description: string
  requirements: string
  responsibilities?: string
  benefits?: string
  location: {
    city: string
    province: string
    is_remote: boolean
  }
  job_type: 'full_time' | 'part_time' | 'contract' | 'internship' | 'freelance'
  experience_level: string
  salary?: {
    min?: number
    max?: number
    currency: string
  }
  salary_min?: number
  salary_max?: number
  salary_currency?: string
  salary_visible?: boolean
  salary_fixed?: boolean
  category?: string
  skills?: string[]
  application_url?: string
  application_email?: string
  application_deadline?: string
  status: JobStatus
  applications_count: number
  views_count: number
  shares_count?: number
  is_featured?: boolean
  is_urgent?: boolean
  published_at?: string
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
  employment_type: 'full_time' | 'part_time' | 'contract' | 'internship' | 'freelance'
  work_type: 'onsite' | 'remote' | 'hybrid'
  category?: string
  experience_level: string
  salary_min?: number
  salary_max?: number
  salary_currency?: string
  salary_visible?: boolean
  salary_fixed?: boolean
  application_email?: string
  expires_at?: string
  skills?: string[]
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
  hash_id?: string
  user_id?: number
  name?: string        // from API
  full_name?: string   // fallback
  email: string
  phone?: string
  avatar_url?: string
  cv_url?: string
  created_at?: string
}

export interface Application {
  id: number
  hash_id?: string
  job_id?: number
  user_id?: number
  cv_id?: number
  cover_letter?: string
  current_status: ApplicationStatus
  status_label: string
  applied_at: string
  viewed_at?: string
  created_at?: string
  updated_at?: string
  last_status_update?: string
  job?: {
    id: number
    hash_id?: string
    title: string
    status?: string
    company?: {
      id: number
      hash_id?: string
      name: string
      logo_url?: string
    }
    city?: string
    province?: string
  }
  applicant?: Candidate
  cv_snapshot?: {
    id: number
    completeness_score: number
    personal_info?: {
      full_name?: string
      email?: string
      phone?: string
      address?: string
      summary?: string
      linkedin?: string
      github?: string
      portfolio?: string
    }
    education?: Array<{
      institution: string
      degree: string
      field_of_study: string
      start_date: string
      end_date?: string
      is_current?: boolean
      gpa?: number
    }>
    experience?: Array<{
      company: string
      position: string
      start_date: string
      end_date?: string
      is_current?: boolean
      description?: string
    }>
    skills?: Array<{
      name: string
      level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
    }>
    certifications?: Array<{
      name: string
      issuer: string
      issue_date?: string
      expiry_date?: string
      credential_id?: string
      credential_url?: string
    }>
    languages?: Array<{
      name: string
      proficiency: 'basic' | 'conversational' | 'fluent' | 'native'
    }>
    projects?: Array<{
      title: string
      description?: string
      url?: string
      start_date?: string
      end_date?: string
    }>
    created_at: string
  }
  timeline?: Array<{
    id: number
    status: string
    status_label: string
    note?: string
    scheduled_at?: string
    scheduled_location?: string
    scheduled_notes?: string
    interview_type?: 'online' | 'offline' | 'whatsapp_notification'
    meeting_link?: string
    meeting_platform?: string
    interview_address?: string
    contact_person?: string
    contact_phone?: string
    created_at: string
  }>
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
  hash_id?: string
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
  hash_id?: string
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
  referral_code?: string
}

export interface AuthResponse {
  user: Company
  access_token: string
  refresh_token: string
  expires_in: number
}
