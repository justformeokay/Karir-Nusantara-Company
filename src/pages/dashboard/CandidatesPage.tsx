import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Search,
  MoreHorizontal,
  Eye,
  FileText,
  Users,
} from 'lucide-react'
import { cn, formatDateShort, getInitials } from '@/lib/utils'
import { candidatesApi } from '@/api/candidates'
import { jobsApi } from '@/api/jobs'
import type { ApplicationStatus } from '@/types'

const statusConfig: Record<ApplicationStatus, { label: string; color: string }> = {
  submitted: { label: 'Terkirim', color: 'bg-blue-100 text-blue-800' },
  viewed: { label: 'Dilihat', color: 'bg-slate-100 text-slate-800' },
  shortlisted: { label: 'Shortlist', color: 'bg-indigo-100 text-indigo-800' },
  interview_scheduled: { label: 'Jadwal Interview', color: 'bg-purple-100 text-purple-800' },
  interview_completed: { label: 'Interview Selesai', color: 'bg-violet-100 text-violet-800' },
  assessment: { label: 'Assessment', color: 'bg-cyan-100 text-cyan-800' },
  offer_sent: { label: 'Penawaran Terkirim', color: 'bg-amber-100 text-amber-800' },
  offer_accepted: { label: 'Penawaran Diterima', color: 'bg-lime-100 text-lime-800' },
  hired: { label: 'Diterima', color: 'bg-green-100 text-green-800' },
  rejected: { label: 'Ditolak', color: 'bg-red-100 text-red-800' },
  withdrawn: { label: 'Mengundurkan Diri', color: 'bg-gray-100 text-gray-800' },
}

export default function CandidatesPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [jobFilter, setJobFilter] = useState<string>('all')

  // Fetch applications
  const { data: applicationsData, isLoading } = useQuery({
    queryKey: ['applications', { search, status: statusFilter, job_id: jobFilter }],
    queryFn: () => candidatesApi.getAll({
      search: search || undefined,
      status: statusFilter !== 'all' ? statusFilter as ApplicationStatus : undefined,
      job_id: jobFilter !== 'all' ? Number(jobFilter) : undefined,
    }),
  })

  // Fetch jobs for filter dropdown
  const { data: jobsData } = useQuery({
    queryKey: ['jobs-for-filter'],
    queryFn: () => jobsApi.getAll({ per_page: 100 }),
  })

  const applications = applicationsData?.data || []
  const jobs = jobsData?.data || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Kandidat</h1>
        <p className="text-gray-600 mt-1">
          Kelola semua pelamar dari berbagai lowongan
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Cari nama atau email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={jobFilter} onValueChange={setJobFilter}>
              <SelectTrigger className="w-full md:w-56">
                <SelectValue placeholder="Filter Lowongan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Lowongan</SelectItem>
                {jobs.map((job) => (
                  <SelectItem key={job.id} value={String(job.id)}>
                    {job.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="submitted">Terkirim</SelectItem>
                <SelectItem value="viewed">Dilihat</SelectItem>
                <SelectItem value="shortlisted">Shortlist</SelectItem>
                <SelectItem value="interview_scheduled">Jadwal Interview</SelectItem>
                <SelectItem value="interview_completed">Interview Selesai</SelectItem>
                <SelectItem value="assessment">Assessment</SelectItem>
                <SelectItem value="offer_sent">Penawaran Terkirim</SelectItem>
                <SelectItem value="offer_accepted">Penawaran Diterima</SelectItem>
                <SelectItem value="hired">Diterima</SelectItem>
                <SelectItem value="rejected">Ditolak</SelectItem>
                <SelectItem value="withdrawn">Mengundurkan Diri</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Candidates Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kandidat</TableHead>
                <TableHead>Lowongan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal Melamar</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Loading skeleton
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div>
                          <Skeleton className="h-4 w-32 mb-1" />
                          <Skeleton className="h-3 w-40" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center">
                      <Users className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-gray-500">Tidak ada kandidat ditemukan</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={application.applicant?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(application.applicant?.full_name || 'N/A')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <Link
                            to={`/candidates/${application.id}`}
                            className="font-medium text-gray-900 hover:text-primary"
                          >
                            {application.applicant?.full_name || 'Kandidat'}
                          </Link>
                          <p className="text-sm text-gray-500">{application.applicant?.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-900">{application.job?.title || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('font-normal', statusConfig[application.current_status]?.color || 'bg-gray-100 text-gray-800')}>
                        {statusConfig[application.current_status]?.label || application.status_label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {formatDateShort(application.applied_at)}
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
                            <Link to={`/candidates/${application.id}`} className="flex items-center">
                              <Eye className="w-4 h-4 mr-2" />
                              Lihat Profil
                            </Link>
                          </DropdownMenuItem>
                          {application.applicant?.cv_url && (
                            <DropdownMenuItem asChild>
                              <a 
                                href={application.applicant.cv_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center"
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                Download CV
                              </a>
                            </DropdownMenuItem>
                          )}
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
    </div>
  )
}
