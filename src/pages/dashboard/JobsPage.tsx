import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { useAuthStore } from '@/stores/authStore'
import { jobsApi } from '@/api/jobs'
import { toast } from 'sonner'
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Users,
  Pause,
  Play,
  FileText,
} from 'lucide-react'
import { formatDateShort } from '@/lib/utils'
import type { JobStatus } from '@/types'

const statusConfig: Record<JobStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  active: { label: 'Aktif', variant: 'success' },
  paused: { label: 'Dijeda', variant: 'warning' },
  closed: { label: 'Ditutup', variant: 'outline' },
  filled: { label: 'Terisi', variant: 'default' },
}

const employmentTypeLabels: Record<string, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Kontrak',
  internship: 'Magang',
}

export default function JobsPage() {
  const { company } = useAuthStore()
  const queryClient = useQueryClient()
  const isVerified = company?.is_verified
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [deleteJobId, setDeleteJobId] = useState<number | null>(null)

  // Fetch jobs
  const { data: jobsData, isLoading } = useQuery({
    queryKey: ['jobs', { search, status: statusFilter }],
    queryFn: () => jobsApi.getAll({
      search: search || undefined,
      status: statusFilter !== 'all' ? statusFilter as JobStatus : undefined,
    }),
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => jobsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      toast.success('Lowongan dihapus', {
        description: 'Lowongan berhasil dihapus.',
      })
    },
    onError: () => {
      toast.error('Gagal menghapus', {
        description: 'Terjadi kesalahan saat menghapus lowongan.',
      })
    },
  })

  // Close/Pause mutation
  const closeMutation = useMutation({
    mutationFn: (id: number) => jobsApi.close(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      toast.success('Lowongan ditutup', {
        description: 'Lowongan berhasil ditutup.',
      })
    },
  })

  // Reopen mutation
  const reopenMutation = useMutation({
    mutationFn: (id: number) => jobsApi.reopen(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      toast.success('Lowongan dibuka kembali', {
        description: 'Lowongan berhasil diaktifkan kembali.',
      })
    },
  })

  const jobs = jobsData?.data || []

  const handleDeleteJob = () => {
    if (deleteJobId) {
      deleteMutation.mutate(deleteJobId)
      setDeleteJobId(null)
    }
  }

  return (
    <div className="space-y-6" data-testid="jobs-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" data-testid="page-title">Lowongan Kerja</h1>
          <p className="text-gray-600 mt-1">
            Kelola lowongan pekerjaan perusahaan Anda
          </p>
        </div>
        {isVerified && (
          <Link to="/jobs/new">
            <Button className="gap-2" data-testid="create-job-button">
              <Plus className="w-4 h-4" />
              Buat Lowongan Baru
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <Card data-testid="filters-section">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Cari lowongan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                data-testid="search-input"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="status-filter">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="paused">Dijeda</SelectItem>
                <SelectItem value="closed">Ditutup</SelectItem>
                <SelectItem value="filled">Terisi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Jobs Table */}
      <Card>
        <CardContent className="p-0">
          <Table data-testid="jobs-list">
            <TableHeader>
              <TableRow>
                <TableHead>Lowongan</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Lokasi</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Pelamar</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Loading skeleton
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-5 w-32 mb-1" />
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : jobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center">
                      <FileText className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-gray-500">Tidak ada lowongan ditemukan</p>
                      {isVerified && (
                        <Link to="/jobs/new">
                          <Button variant="outline" className="mt-4 gap-2">
                            <Plus className="w-4 h-4" />
                            Buat Lowongan Pertama
                          </Button>
                        </Link>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <div>
                        <Link
                          to={`/jobs/${job.id}`}
                          className="font-medium text-gray-900 hover:text-primary"
                        >
                          {job.title}
                        </Link>
                        <p className="text-sm text-gray-500">{job.category}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {employmentTypeLabels[job.employment_type] || job.employment_type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">{job.location}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConfig[job.status]?.variant || 'secondary'}>
                        {statusConfig[job.status]?.label || job.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium">{job.applications_count}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {formatDateShort(job.created_at)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/jobs/${job.id}`} className="flex items-center">
                              <Eye className="w-4 h-4 mr-2" />
                              Lihat Detail
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/jobs/${job.id}/edit`} className="flex items-center">
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          {job.status === 'active' && (
                            <DropdownMenuItem onClick={() => closeMutation.mutate(job.id)}>
                              <Pause className="w-4 h-4 mr-2" />
                              Tutup Lowongan
                            </DropdownMenuItem>
                          )}
                          {(job.status === 'closed' || job.status === 'paused') && (
                            <DropdownMenuItem onClick={() => reopenMutation.mutate(job.id)}>
                              <Play className="w-4 h-4 mr-2" />
                              Buka Kembali
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => setDeleteJobId(job.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteJobId} onOpenChange={() => setDeleteJobId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Lowongan?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Lowongan dan semua data pelamar terkait akan dihapus secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteJob}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
