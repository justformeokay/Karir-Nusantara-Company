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

export interface TopUpPackage {
  id: string
  name: string
  quota: number
  bonus_quota: number
  total_quota: number
  price: number
  price_per_job: number
  is_best_value: boolean
  description: string
}

export interface PaymentInfo {
  bank: string
  account_number: string
  account_name: string
  price_per_job: number
  packages: TopUpPackage[]
}

export const quotaApi = {
  // Get company's current quota
  getQuota: async (): Promise<ApiResponse<JobQuota>> => {
    return api.get('/company/quota')
  },

  // Get available top-up packages
  getPackages: async (): Promise<ApiResponse<TopUpPackage[]>> => {
    return api.get('/company/packages')
  },

  // Get payment history
  getPaymentHistory: async (params?: PaymentParams): Promise<PaginatedResponse<PaymentProof>> => {
    return api.get('/company/payments', { params })
  },

  // Get payment info (bank details)
  getPaymentInfo: async (): Promise<ApiResponse<PaymentInfo>> => {
    return api.get('/company/payments/info')
  },

  // Submit payment proof with optional package or job
  submitPaymentProof: async (proofImage: File, options?: { jobId?: number; packageId?: string }): Promise<ApiResponse<PaymentProof>> => {
    const formData = new FormData()
    formData.append('proof_image', proofImage)
    if (options?.jobId) {
      formData.append('job_id', String(options.jobId))
    }
    if (options?.packageId) {
      formData.append('package_id', options.packageId)
    }
    return api.upload('/company/payments/proof', formData)
  },

  // Download invoice PDF for confirmed payment
  downloadInvoice: async (paymentId: number): Promise<Blob> => {
    return api.download('/company/payments/invoice', { id: paymentId })
  },
}
