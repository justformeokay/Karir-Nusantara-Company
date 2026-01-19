import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import CompanyStatusBanner from './CompanyStatusBanner'
import { useAuthStore } from '@/stores/authStore'
import { authApi } from '@/api/auth'

export default function DashboardLayout() {
  const { company, updateCompany } = useAuthStore()

  // Refresh company profile on mount to check for verification status changes
  useEffect(() => {
    const refreshProfile = async () => {
      try {
        const response = await authApi.getProfile()
        
        if (response && 'success' in response && response.success && 'data' in response && response.data) {
          console.log('Profile refreshed:', response.data)
          updateCompany(response.data)
          // Force persist the updated data to localStorage
          const storage = localStorage.getItem('karir-nusantara-company-auth')
          if (storage) {
            const parsed = JSON.parse(storage)
            parsed.state.company = response.data
            localStorage.setItem('karir-nusantara-company-auth', JSON.stringify(parsed))
          }
        }
      } catch (error) {
        console.error('Profile refresh error:', error)
      }
    }

    refreshProfile()
  }, [updateCompany])

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />

        {/* Company Status Banner (if not verified) */}
        {company && company.verification_status && company.verification_status !== 'verified' && (
          <CompanyStatusBanner status={company.verification_status} />
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
