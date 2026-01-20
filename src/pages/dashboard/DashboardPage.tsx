import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/stores/authStore'
import { dashboardApi } from '@/api/dashboard'
import { quotaApi } from '@/api/quota'
import { useCompanyEligibility } from '@/hooks/useCompanyEligibility'
import {
  Briefcase,
  Users,
  UserCheck,
  Eye,
  Plus,
  ArrowRight,
} from 'lucide-react'
import { cn, formatRelativeTime } from '@/lib/utils'

const statusColors: Record<string, string> = {
  submitted: 'bg-blue-100 text-blue-800',
  viewed: 'bg-sky-100 text-sky-800',
  shortlisted: 'bg-indigo-100 text-indigo-800',
  interview_scheduled: 'bg-purple-100 text-purple-800',
  interview_completed: 'bg-violet-100 text-violet-800',
  assessment: 'bg-fuchsia-100 text-fuchsia-800',
  offer_sent: 'bg-amber-100 text-amber-800',
  offer_accepted: 'bg-green-100 text-green-800',
  hired: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  withdrawn: 'bg-gray-100 text-gray-800',
}

export default function DashboardPage() {
  const { company } = useAuthStore()
  const { canCreateJobs } = useCompanyEligibility()
  
  // Check actual eligibility with detailed error
  const { canCreate, error: eligibilityError } = canCreateJobs(company || undefined)

  // Fetch dashboard stats
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStats(),
  })

  // Fetch quota info
  const { data: quotaData, isLoading: isLoadingQuota } = useQuery({
    queryKey: ['quota'],
    queryFn: () => quotaApi.getQuota(),
  })

  const stats = statsData?.data
  const quota = quotaData?.data
  const quotaPercentage = quota 
    ? (quota.used_free_quota / quota.free_quota) * 100 
    : 0

  if (isLoadingStats || isLoadingQuota) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" data-testid="page-title">
            Selamat datang, {company?.company_name || company?.full_name}! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            Berikut ringkasan aktivitas rekrutmen perusahaan Anda.
          </p>
        </div>
        {canCreate ? (
          <Link to="/jobs/new">
            <Button className="gap-2" data-testid="create-job-button">
              <Plus className="w-4 h-4" />
              Buat Lowongan Baru
            </Button>
          </Link>
        ) : (
          <div className="group relative">
            <Button 
              className="gap-2 opacity-60 cursor-not-allowed" 
              disabled 
              data-testid="create-job-button-disabled"
            >
              <Plus className="w-4 h-4" />
              Buat Lowongan Baru
            </Button>
            {/* Tooltip on hover */}
            <div className="absolute right-0 top-full mt-2 hidden group-hover:block bg-gray-900 text-white text-sm p-2 rounded whitespace-nowrap z-10">
              {eligibilityError?.message}
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="stats-grid">
        <Card data-testid="stat-active-jobs">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Lowongan Aktif</p>
                <p className="text-3xl font-bold text-gray-900 mt-1" data-testid="stat-value">
                  {stats?.active_jobs || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="stat-total-applicants">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pelamar</p>
                <p className="text-3xl font-bold text-gray-900 mt-1" data-testid="stat-value">
                  {stats?.total_applicants || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="stat-under-review">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Dalam Review</p>
                <p className="text-3xl font-bold text-gray-900 mt-1" data-testid="stat-value">
                  {stats?.under_review || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="stat-accepted">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Kandidat Diterima</p>
                <p className="text-3xl font-bold text-gray-900 mt-1" data-testid="stat-value">
                  {stats?.accepted_candidates || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quota & Payment Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Free Quota Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Kuota Lowongan Gratis</CardTitle>
              <Link to="/quota" className="text-sm text-primary hover:underline">
                Lihat Detail
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Terpakai</span>
                <span className="font-medium">
                  {quota?.used_free_quota || 0} dari {quota?.free_quota || 5} lowongan
                </span>
              </div>
              <Progress value={quotaPercentage} className="h-2" />
              <p className="text-sm text-gray-500">
                Sisa {quota?.remaining_free_quota || 0} lowongan gratis. 
                {quota?.remaining_free_quota === 0 && (
                  <span className="text-amber-600 ml-1">
                    Lowongan berikutnya akan dikenakan biaya Rp {quota?.price_per_job?.toLocaleString('id-ID') || '30.000'}.
                  </span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              <Link to="/candidates">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Users className="w-4 h-4" />
                  Lihat Pelamar
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Applicants */}
        <Card className="lg:col-span-2" data-testid="recent-applicants">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Pelamar Terbaru</CardTitle>
              <Link to="/candidates" className="text-sm text-primary hover:underline flex items-center gap-1">
                Lihat Semua <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recent_applicants && stats.recent_applicants.length > 0 ? (
                stats.recent_applicants.map((applicant) => (
                  <Link
                    key={applicant.id}
                    to={`/candidates/${applicant.id}`}
                    className="flex items-center justify-between py-3 border-b last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors"
                    data-testid="applicant-card"
                  >
                    <div className="flex items-center gap-3">
                      {applicant.applicant_photo ? (
                        <img 
                          src={applicant.applicant_photo} 
                          alt={applicant.applicant_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {applicant.applicant_name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{applicant.applicant_name}</p>
                        <p className="text-sm text-gray-500">{applicant.job_title}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={cn('font-normal', statusColors[applicant.status] || 'bg-gray-100 text-gray-800')}>
                        {applicant.status_label}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatRelativeTime(applicant.applied_at)}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                  <p>Belum ada pelamar</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Jobs */}
        <Card data-testid="active-jobs">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Lowongan Aktif</CardTitle>
              <Link to="/jobs" className="text-sm text-primary hover:underline flex items-center gap-1">
                Lihat Semua <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.active_jobs_list && stats.active_jobs_list.length > 0 ? (
                stats.active_jobs_list.map((job) => (
                  <Link
                    key={job.id}
                    to={`/jobs/${job.id}`}
                    className="block p-3 rounded-lg border hover:border-primary/50 hover:bg-gray-50 transition-colors"
                  >
                    <h4 className="font-medium text-gray-900">{job.title}</h4>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>{job.applicants_count} pelamar</span>
                      </div>
                      <Badge variant="secondary" className="font-normal">
                        Aktif
                      </Badge>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Briefcase className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                  <p>Belum ada lowongan aktif</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Loading skeleton component
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16 mt-2" />
                </div>
                <Skeleton className="w-12 h-12 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-3 border-b last:border-0">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24 mt-1" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-3 border rounded-lg mb-3 last:mb-0">
                <Skeleton className="h-4 w-full" />
                <div className="flex items-center justify-between mt-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-12 rounded-full" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
