import { api } from './client'

export interface QuestionOption {
  id: number
  option_text: string
  is_correct: boolean
  order: number
}

export interface InterviewQuestion {
  id: number
  question_text: string
  question_type: 'multiple_choice' | 'essay'
  points: number
  difficulty: 'easy' | 'medium' | 'hard'
  order: number
  explanation?: string
  options?: QuestionOption[]
}

export interface InterviewTest {
  id: number
  title: string
  description: string
  duration_minutes: number
  total_points: number
  passing_score: number
  shuffle_questions: boolean
  show_results_immediately: boolean
  status: 'draft' | 'active' | 'archived'
  owner_type: 'super_admin' | 'company'
  owner_company_id?: number
  is_public: boolean
  questions?: InterviewQuestion[]
  created_by: number
  created_at: string
  updated_at: string
}

export interface CreateQuestionOptionRequest {
  option_text: string
  is_correct: boolean
}

export interface CreateQuestionRequest {
  question_text: string
  question_type: 'multiple_choice' | 'essay'
  points: number
  difficulty: 'easy' | 'medium' | 'hard'
  explanation?: string
  options?: CreateQuestionOptionRequest[]
}

export interface CreateInterviewTestRequest {
  title: string
  description: string
  duration_minutes: number
  passing_score: number
  shuffle_questions?: boolean
  show_results_immediately?: boolean
  questions: CreateQuestionRequest[]
}

export type UpdateInterviewTestRequest = CreateInterviewTestRequest

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export const interviewTestsApi = {
  // Get public admin tests (library)
  getLibrary: () =>
    api.get<ApiResponse<InterviewTest[]>>('/company/interview-tests/library'),

  // Get company's own tests
  getMyTests: (status?: string) =>
    api.get<ApiResponse<InterviewTest[]>>('/company/interview-tests', {
      params: status ? { status } : undefined,
    }),

  // Create a new company test
  create: (data: CreateInterviewTestRequest) =>
    api.post<ApiResponse<InterviewTest>>('/company/interview-tests', data),

  // Update an existing company test
  update: (id: number, data: UpdateInterviewTestRequest) =>
    api.put<ApiResponse<InterviewTest>>(`/company/interview-tests/${id}`, data),

  // Delete a company test
  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/company/interview-tests/${id}`),

  // Publish a company test
  publish: (id: number) =>
    api.post<ApiResponse<InterviewTest>>(`/company/interview-tests/${id}/publish`),

  // Copy an admin test to company's own collection
  copyFromAdmin: (id: number) =>
    api.post<ApiResponse<InterviewTest>>(`/company/interview-tests/${id}/copy`),
}
