import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import CompanyStatusBanner from './CompanyStatusBanner'
import { useAuthStore } from '@/stores/authStore'

export default function DashboardLayout() {
  const { company } = useAuthStore()

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
