import { api } from './client'
import type { 
  JobQuota, 
  PaymentProof,
  ApiResponse, 
  PaginatedResponse 
} from '@/types'

export interface PaymentParams {
  page?: number
  per_page?: number
  status?: 'pending' | 'confirmed' | 'rejected'
  [key: string]: string | number | undefined
}

export interface PaymentInfo {
  bank: string
  account_number: string
  account_name: string
  price_per_job: number
}

export const quotaApi = {
  // Get company's current quota
  getQuota: async (): Promise<ApiResponse<JobQuota>> => {
    return api.get('/company/quota')
  },

  // Get payment history
  getPaymentHistory: async (params?: PaymentParams): Promise<PaginatedResponse<PaymentProof>> => {
    return api.get('/company/payments', { params })
  },

  // Get payment info (bank details)
  getPaymentInfo: async (): Promise<ApiResponse<PaymentInfo>> => {
    return api.get('/company/payments/info')
  },

  // Submit payment proof
  submitPaymentProof: async (proofImage: File, jobId?: number): Promise<ApiResponse<PaymentProof>> => {
    const formData = new FormData()
    formData.append('proof_image', proofImage)
    if (jobId) {
      formData.append('job_id', String(jobId))
    }
    return api.upload('/company/payments/proof', formData)
  },
}
