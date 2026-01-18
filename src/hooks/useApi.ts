import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { jobsApi, candidatesApi, quotaApi, dashboardApi, type JobsParams, type CandidatesParams } from '@/api'
import type { JobFormData, ApplicationStatus, JobStatus } from '@/types'

// Dashboard hooks
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: dashboardApi.getStats,
  })
}

export function useRecentApplicants(limit?: number) {
  return useQuery({
    queryKey: ['dashboard', 'recent-applicants', limit],
    queryFn: () => dashboardApi.getRecentApplicants(limit),
  })
}

// Jobs hooks
export function useJobs(params?: { status?: JobStatus; search?: string; page?: number }) {
  return useQuery({
    queryKey: ['jobs', params],
    queryFn: () => jobsApi.getAll(params as JobsParams),
  })
}

export function useJob(id: string) {
  return useQuery({
    queryKey: ['jobs', id],
    queryFn: () => jobsApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateJob() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: JobFormData) => jobsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useUpdateJob(id: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: JobFormData) => jobsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['jobs', id] })
    },
  })
}

export function useDeleteJob() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => jobsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useCloseJob() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string | number) => jobsApi.close(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['jobs', id] })
    },
  })
}

export function useReopenJob() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string | number) => jobsApi.reopen(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['jobs', id] })
    },
  })
}

// Candidates hooks
export function useCandidates(params?: { jobId?: string; status?: ApplicationStatus; search?: string }) {
  return useQuery({
    queryKey: ['candidates', params],
    queryFn: () => candidatesApi.getAll(params as CandidatesParams),
  })
}

export function useCandidate(id: string) {
  return useQuery({
    queryKey: ['candidates', id],
    queryFn: () => candidatesApi.getById(id),
    enabled: !!id,
  })
}

export function useUpdateCandidateStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, status }: { id: string | number; status: ApplicationStatus }) =>
      candidatesApi.updateStatus(id, { status }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      queryClient.invalidateQueries({ queryKey: ['candidates', id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

// Quota hooks
export function useQuota() {
  return useQuery({
    queryKey: ['quota'],
    queryFn: quotaApi.getQuota,
  })
}

export function usePaymentHistory() {
  return useQuery({
    queryKey: ['quota', 'payments'],
    queryFn: () => quotaApi.getPaymentHistory(),
  })
}

export function useUploadPaymentProof() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (file: File) => quotaApi.submitPaymentProof(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quota'] })
      queryClient.invalidateQueries({ queryKey: ['quota', 'payments'] })
    },
  })
}
