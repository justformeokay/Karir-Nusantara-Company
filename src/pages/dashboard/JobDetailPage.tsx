import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Users,
  Eye,
  MapPin,
  Briefcase,
  Clock,
  Calendar,
  Pause,
  Play,
} from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { jobsApi } from '@/api/jobs'
import type { JobStatus } from '@/types'

const mockApplicants = [
  { id: '1', name: 'Budi Santoso', email: 'budi@email.com', status: 'applied', appliedAt: '2026-01-17' },
  { id: '2', name: 'Ani Wijaya', email: 'ani@email.com', status: 'under_review', appliedAt: '2026-01-16' },
  { id: '3', name: 'Rudi Hartono', email: 'rudi@email.com', status: 'interview', appliedAt: '2026-01-15' },
]

const statusConfig: Record<JobStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  active: { label: 'Aktif', variant: 'success' },
  paused: { label: 'Dijeda', variant: 'warning' },
  closed: { label: 'Ditutup', variant: 'outline' },
  filled: { label: 'Terisi', variant: 'default' },
}

// Helper to get status config with fallback
const getStatusConfig = (status: string) => {
  return statusConfig[status as JobStatus] || { label: status, variant: 'secondary' as const }
}

const employmentTypeLabels: Record<string, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Kontrak',
  internship: 'Magang',
  freelance: 'Freelance',
}

export default function JobDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showCloseDialog, setShowCloseDialog] = useState(false)

  // Fetch job data from API
  const { data: jobData, isLoading, error } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobsApi.getById(id!),
    enabled: !!id,
  })

  const job = jobData?.data

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => jobsApi.delete(id!),
    onSuccess: () => {
      toast.success('Lowongan berhasil dihapus')
      queryClient.invalidateQueries({ queryKey: ['company-jobs'] })
      navigate('/jobs')
    },
    onError: () => {
      toast.error('Gagal menghapus lowongan')
    },
  })

  // Close/Pause mutation
  const closeMutation = useMutation({
    mutationFn: () => jobsApi.close(id!),
    onSuccess: () => {
      toast.success('Lowongan berhasil ditutup')
      queryClient.invalidateQueries({ queryKey: ['job', id] })
      queryClient.invalidateQueries({ queryKey: ['company-jobs'] })
      setShowCloseDialog(false)
    },
    onError: () => {
      toast.error('Gagal menutup lowongan')
    },
  })

  // Reopen mutation
  const reopenMutation = useMutation({
    mutationFn: () => jobsApi.reopen(id!),
    onSuccess: () => {
      toast.success('Lowongan berhasil dibuka kembali')
      queryClient.invalidateQueries({ queryKey: ['job', id] })
      queryClient.invalidateQueries({ queryKey: ['company-jobs'] })
      setShowCloseDialog(false)
    },
    onError: () => {
      toast.error('Gagal membuka kembali lowongan')
    },
  })

  const handleDelete = () => {
    deleteMutation.mutate()
  }

  const handleToggleStatus = () => {
    if (job?.status === 'active') {
      closeMutation.mutate()
    } else {
      reopenMutation.mutate()
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/jobs">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lowongan tidak ditemukan</h1>
            <p className="text-gray-600">Lowongan yang Anda cari tidak ada atau sudah dihapus.</p>
          </div>
        </div>
      </div>
    )
  }

  // Get location string from job data
  const jobLocation = job.location
    ? `${job.location.city}${job.location.is_remote ? ', Remote' : ''}`
    : '-'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link to="/jobs">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              <Badge variant={getStatusConfig(job.status).variant}>
                {getStatusConfig(job.status).label}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Briefcase className="w-4 h-4" />
                {job.category || job.experience_level || '-'}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {jobLocation}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {employmentTypeLabels[job.job_type] || job.job_type || '-'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 ml-12 lg:ml-0">
          <Link to={`/jobs/${job.hash_id || id}/edit`}>
            <Button variant="outline" className="gap-2">
              <Edit className="w-4 h-4" />
              Edit
            </Button>
          </Link>
          {job.status === 'active' ? (
            <Button variant="outline" className="gap-2" onClick={() => setShowCloseDialog(true)}>
              <Pause className="w-4 h-4" />
              Tutup
            </Button>
          ) : (job.status === 'closed' || job.status === 'paused') ? (
            <Button variant="outline" className="gap-2" onClick={() => setShowCloseDialog(true)}>
              <Play className="w-4 h-4" />
              Buka Kembali
            </Button>
          ) : null}
          <Button variant="destructive" size="icon" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-12 lg:ml-0">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{job.applications_count || 0}</p>
                <p className="text-sm text-gray-600">Pelamar</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{job.views_count || 0}</p>
                <p className="text-sm text-gray-600">Dilihat</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{job.published_at ? formatDate(job.published_at).split(' ')[0] : '-'}</p>
                <p className="text-sm text-gray-600">Dipublikasikan</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="detail" className="ml-12 lg:ml-0">
        <TabsList>
          <TabsTrigger value="detail">Detail Lowongan</TabsTrigger>
          <TabsTrigger value="applicants">
            Pelamar ({job.applications_count || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="detail" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Deskripsi Pekerjaan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none whitespace-pre-line text-gray-700">
                    {job.description}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Persyaratan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none whitespace-pre-line text-gray-700">
                    {job.requirements}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informasi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lokasi Kerja</span>
                    <span className="font-medium">{jobLocation}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tipe</span>
                    <span className="font-medium">{employmentTypeLabels[job.job_type] || job.job_type || '-'}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kategori</span>
                    <span className="font-medium">{job.category || job.experience_level || '-'}</span>
                  </div>
                  {job.salary_visible && (job.salary_min || job.salary_max) && (
                    <>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-gray-600">Gaji</span>
                        <span className="font-medium">
                          {formatCurrency(job.salary_min || 0)} - {formatCurrency(job.salary_max || 0)}
                        </span>
                      </div>
                    </>
                  )}
                  {job.application_deadline && (
                    <>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-gray-600">Deadline</span>
                        <span className="font-medium">{formatDate(job.application_deadline)}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="applicants" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              {mockApplicants.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Belum ada pelamar</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {mockApplicants.map((applicant) => (
                    <div
                      key={applicant.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {applicant.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{applicant.name}</p>
                          <p className="text-sm text-gray-500">{applicant.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">{applicant.status}</Badge>
                        <Link to={`/candidates/${applicant.id}`}>
                          <Button variant="outline" size="sm">
                            Lihat Profil
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Lowongan?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Lowongan dan semua data pelamar terkait akan dihapus secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Close/Reopen Dialog */}
      <AlertDialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {job.status === 'active' ? 'Tutup Lowongan?' : 'Buka Kembali Lowongan?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {job.status === 'active'
                ? 'Lowongan tidak akan menerima lamaran baru setelah ditutup.'
                : 'Lowongan akan kembali aktif dan menerima lamaran baru.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleStatus}>
              {job.status === 'active' ? 'Tutup' : 'Buka Kembali'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
