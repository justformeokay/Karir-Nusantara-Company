import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Company } from '@/types'

interface AuthState {
  token: string | null
  company: Company | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // Actions
  setAuth: (token: string, company: Company) => void
  updateCompany: (company: Partial<Company>) => void
  logout: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      company: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (token, company) =>
        set({
          token,
          company,
          isAuthenticated: true,
          isLoading: false,
        }),

      updateCompany: (companyData) =>
        set((state) => ({
          company: state.company ? { ...state.company, ...companyData } : null,
        })),

      logout: () =>
        set({
          token: null,
          company: null,
          isAuthenticated: false,
          isLoading: false,
        }),

      setLoading: (loading) =>
        set({ isLoading: loading }),
    }),
    {
      name: 'karir-nusantara-company-auth',
      partialize: (state) => ({
        token: state.token,
        company: state.company,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
