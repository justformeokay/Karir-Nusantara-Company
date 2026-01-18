import { api } from './client'
import type { 
  DashboardStats, 
  RecentApplicant, 
  ActiveJob, 
  ApiResponse 
} from '@/types'

export const dashboardApi = {
  // Get all dashboard statistics including recent applicants and active jobs
  getStats: async (): Promise<ApiResponse<DashboardStats>> => {
    return api.get('/company/dashboard/stats')
  },

  // Get recent applicants with optional limit
  getRecentApplicants: async (limit?: number): Promise<ApiResponse<RecentApplicant[]>> => {
    return api.get('/company/dashboard/recent-applicants', {
      params: limit ? { limit } : undefined
    })
  },

  // Get active jobs list with optional limit
  getActiveJobs: async (limit?: number): Promise<ApiResponse<ActiveJob[]>> => {
    return api.get('/company/dashboard/active-jobs', {
      params: limit ? { limit } : undefined
    })
  },
}
