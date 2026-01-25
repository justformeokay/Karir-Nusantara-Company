import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  Mail,
  Phone,
  FileText,
  Download,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  AlertCircle,
  Briefcase,
  GraduationCap,
  Award,
  Linkedin,
  Globe,
  Github,
} from 'lucide-react'
import { cn, formatDate, getInitials, getAvatarUrl } from '@/lib/utils'
import { candidatesApi } from '@/api/candidates'
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

const statusOptions: { value: ApplicationStatus; label: string }[] = [
  { value: 'submitted', label: 'Terkirim' },
  { value: 'viewed', label: 'Dilihat' },
  { value: 'shortlisted', label: 'Shortlist' },
  { value: 'interview_scheduled', label: 'Jadwal Interview' },
  { value: 'interview_completed', label: 'Interview Selesai' },
  { value: 'assessment', label: 'Assessment' },
  { value: 'offer_sent', label: 'Penawaran Terkirim' },
  { value: 'offer_accepted', label: 'Penawaran Diterima' },
  { value: 'hired', label: 'Diterima' },
  { value: 'rejected', label: 'Ditolak' },
]

function getCvScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-amber-600'
  return 'text-red-600'
}

function getCvScoreLabel(score: number): string {
  if (score >= 80) return 'Sangat Baik'
  if (score >= 60) return 'Baik'
  return 'Perlu Review'
}

export default function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [newStatus, setNewStatus] = useState<ApplicationStatus>('submitted')
  const [statusNote, setStatusNote] = useState('')

  // Fetch application data
  const { data: applicationData, isLoading, error } = useQuery({
    queryKey: ['application', id],
    queryFn: () => candidatesApi.getById(id!),
    enabled: !!id,
  })

  const application = applicationData?.data

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: (data: { status: ApplicationStatus; notes?: string }) =>
      candidatesApi.updateStatus(id!, data),
    onSuccess: () => {
      toast.success('Status kandidat berhasil diperbarui!')
      setShowStatusDialog(false)
      setStatusNote('')
      queryClient.invalidateQueries({ queryKey: ['application', id] })
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
    onError: () => {
      toast.error('Gagal memperbarui status')
    },
  })

  const handleUpdateStatus = () => {
    updateStatusMutation.mutate({
      status: newStatus,
      notes: statusNote || undefined,
    })
  }

  // Loading state
  if (isLoading) {
    return <CandidateDetailSkeleton />
  }

  // Error state
  if (error || !application) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/candidates">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Detail Kandidat</h1>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Kandidat Tidak Ditemukan
              </h2>
              <p className="text-gray-600 mb-4">
                Data kandidat yang Anda cari tidak ditemukan atau Anda tidak memiliki akses.
              </p>
              <Link to="/candidates">
                <Button>Kembali ke Daftar Kandidat</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const applicantName = application.applicant?.name || application.applicant?.full_name || 'Kandidat'
  const applicantEmail = application.applicant?.email || '-'
  const applicantPhone = application.applicant?.phone || '-'
  const applicantPhoto = application.applicant?.avatar_url
  const jobTitle = application.job?.title || '-'
  const jobCity = application.job?.city || ''
  const jobProvince = application.job?.province || ''
  const cvScore = application.cv_snapshot?.completeness_score || 0
  const timeline = application.timeline || []
  const currentStatus = application.current_status
  const cvSnapshot = application.cv_snapshot

  // Generate PDF CV from snapshot data
  const handleDownloadCV = () => {
    if (!cvSnapshot) {
      toast.error('Data CV tidak tersedia')
      return
    }

    // Create printable CV content
    const cvContent = generateCVHTML(cvSnapshot, applicantName, applicantPhoto)
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(cvContent)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
      }, 250)
    }
  }

  // Helper to format date range
  const formatDateRange = (startDate?: string, endDate?: string, isCurrent?: boolean) => {
    if (!startDate) return '-'
    const start = new Date(startDate).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
    if (isCurrent) return `${start} - Sekarang`
    if (!endDate) return start
    const end = new Date(endDate).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
    return `${start} - ${end}`
  }

  // Helper to get skill level badge
  const getSkillLevelBadge = (level: string) => {
    const colors: Record<string, string> = {
      beginner: 'bg-gray-100 text-gray-700',
      intermediate: 'bg-blue-100 text-blue-700',
      advanced: 'bg-green-100 text-green-700',
      expert: 'bg-purple-100 text-purple-700',
    }
    return colors[level] || colors.intermediate
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/candidates">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage 
                  src={getAvatarUrl(applicantPhoto) || undefined} 
                  className="object-cover"
                />
                <AvatarFallback className="bg-primary text-white text-xl">
                  {getInitials(applicantName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{applicantName}</h1>
                <p className="text-gray-600">
                  Melamar: <span className="font-medium">{jobTitle}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={cn('text-sm py-1 px-3', statusConfig[currentStatus]?.color || 'bg-gray-100 text-gray-800')}>
                {statusConfig[currentStatus]?.label || application.status_label}
              </Badge>
              <Button onClick={() => {
                setNewStatus(currentStatus)
                setShowStatusDialog(true)
              }}>
                Ubah Status
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Kontak</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{applicantEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Phone className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Telepon</p>
                    <p className="font-medium">{applicantPhone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Posisi yang Dilamar</p>
                    <p className="font-medium">{jobTitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tanggal Melamar</p>
                    <p className="font-medium">{formatDate(application.applied_at)}</p>
                  </div>
                </div>
              </div>
              {(jobCity || jobProvince) && (
                <>
                  <Separator className="my-4" />
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Lokasi Pekerjaan:</span> {jobCity}{jobCity && jobProvince && ', '}{jobProvince}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Cover Letter */}
          {application.cover_letter && (
            <Card>
              <CardHeader>
                <CardTitle>Cover Letter</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-line text-gray-700 leading-relaxed">
                  {application.cover_letter}
                </div>
              </CardContent>
            </Card>
          )}

          {/* About / Summary */}
          {cvSnapshot?.personal_info?.summary && (
            <Card>
              <CardHeader>
                <CardTitle>Tentang Kandidat</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {cvSnapshot.personal_info.summary}
                </p>
                {/* Social Links */}
                {(cvSnapshot.personal_info.linkedin || cvSnapshot.personal_info.github || cvSnapshot.personal_info.portfolio) && (
                  <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t">
                    {cvSnapshot.personal_info.linkedin && (
                      <a 
                        href={cvSnapshot.personal_info.linkedin} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
                      >
                        <Linkedin className="w-4 h-4" /> LinkedIn
                      </a>
                    )}
                    {cvSnapshot.personal_info.github && (
                      <a 
                        href={cvSnapshot.personal_info.github} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm text-gray-700 hover:underline"
                      >
                        <Github className="w-4 h-4" /> GitHub
                      </a>
                    )}
                    {cvSnapshot.personal_info.portfolio && (
                      <a 
                        href={cvSnapshot.personal_info.portfolio} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                      >
                        <Globe className="w-4 h-4" /> Portfolio
                      </a>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Work Experience */}
          {cvSnapshot?.experience && cvSnapshot.experience.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Pengalaman Kerja
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cvSnapshot.experience.map((exp, index) => (
                    <div key={index} className={cn('pb-4', index < cvSnapshot.experience!.length - 1 && 'border-b')}>
                      <h4 className="font-semibold text-gray-900">{exp.position}</h4>
                      <p className="text-sm text-primary font-medium">{exp.company}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatDateRange(exp.start_date, exp.end_date, exp.is_current)}
                      </p>
                      {exp.description && (
                        <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">{exp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Education */}
          {cvSnapshot?.education && cvSnapshot.education.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Pendidikan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cvSnapshot.education.map((edu, index) => (
                    <div key={index} className={cn('pb-4', index < cvSnapshot.education!.length - 1 && 'border-b')}>
                      <h4 className="font-semibold text-gray-900">{edu.institution}</h4>
                      <p className="text-sm text-gray-700">
                        {edu.degree} - {edu.field_of_study}
                        {edu.gpa && <span className="text-gray-500 ml-2">(IPK: {edu.gpa})</span>}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatDateRange(edu.start_date, edu.end_date, edu.is_current)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Skills */}
          {cvSnapshot?.skills && cvSnapshot.skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Keahlian</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {cvSnapshot.skills.map((skill, index) => (
                    <Badge key={index} className={cn('font-normal', getSkillLevelBadge(skill.level))}>
                      {skill.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Certifications */}
          {cvSnapshot?.certifications && cvSnapshot.certifications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Sertifikasi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {cvSnapshot.certifications.map((cert, index) => (
                    <div key={index} className={cn('pb-3', index < cvSnapshot.certifications!.length - 1 && 'border-b')}>
                      <h4 className="font-medium text-gray-900">{cert.name}</h4>
                      <p className="text-sm text-gray-600">{cert.issuer}</p>
                      {cert.issue_date && (
                        <p className="text-xs text-gray-500">
                          Diterbitkan: {new Date(cert.issue_date).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                        </p>
                      )}
                      {cert.credential_id && (
                        <p className="text-xs text-gray-500">ID: {cert.credential_id}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Projects */}
          {cvSnapshot?.projects && cvSnapshot.projects.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Proyek</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {cvSnapshot.projects.map((project, index) => (
                    <div key={index} className={cn('pb-3', index < cvSnapshot.projects!.length - 1 && 'border-b')}>
                      <h4 className="font-medium text-gray-900">{project.title}</h4>
                      {project.description && (
                        <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                      )}
                      {project.url && (
                        <a 
                          href={project.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          Lihat Proyek →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* CV Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                CV Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className={cn('text-5xl font-bold', getCvScoreColor(cvScore))}>
                  {cvScore}
                </p>
                <p className={cn('text-sm mt-1', getCvScoreColor(cvScore))}>
                  {getCvScoreLabel(cvScore)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* CV Download */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Curriculum Vitae
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full gap-2" 
                onClick={handleDownloadCV}
                disabled={!cvSnapshot}
              >
                <Download className="w-4 h-4" />
                Download CV (PDF)
              </Button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                {cvSnapshot ? 'CV dibuat dari data lamaran kandidat' : 'Data CV tidak tersedia'}
              </p>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {timeline.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Belum ada timeline
                </p>
              ) : (
                <div className="space-y-4">
                  {timeline.map((event, index) => (
                    <div key={event.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center',
                          index === timeline.length - 1 ? 'bg-primary' : 'bg-gray-200'
                        )}>
                          {event.status === 'hired' || event.status === 'offer_accepted' ? (
                            <CheckCircle className="w-4 h-4 text-white" />
                          ) : event.status === 'rejected' ? (
                            <XCircle className="w-4 h-4 text-white" />
                          ) : (
                            <div className={cn(
                              'w-2 h-2 rounded-full',
                              index === timeline.length - 1 ? 'bg-white' : 'bg-gray-400'
                            )} />
                          )}
                        </div>
                        {index < timeline.length - 1 && (
                          <div className="w-px h-8 bg-gray-200" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-medium text-sm">
                          {statusConfig[event.status as ApplicationStatus]?.label || event.status_label}
                        </p>
                        {event.note && (
                          <p className="text-sm text-gray-500">{event.note}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(event.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Update Status Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Status Kandidat</DialogTitle>
            <DialogDescription>
              Pilih status baru dan tambahkan catatan jika diperlukan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status Baru</label>
              <Select value={newStatus} onValueChange={(v) => setNewStatus(v as ApplicationStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Catatan (Opsional)</label>
              <Textarea
                placeholder="Tambahkan catatan tentang perubahan status ini..."
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleUpdateStatus} disabled={updateStatusMutation.isPending}>
              {updateStatusMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Generate HTML for CV PDF
/* eslint-disable @typescript-eslint/no-explicit-any */
function generateCVHTML(cvSnapshot: any, name: string, photoUrl?: string): string {
  const personalInfo = cvSnapshot.personal_info as any
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081'
  const fullPhotoUrl = photoUrl ? (photoUrl.startsWith('http') ? photoUrl : `${apiBaseUrl}${photoUrl}`) : ''
  
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
  }

  const formatDateRange = (start?: string, end?: string, isCurrent?: boolean) => {
    if (!start) return ''
    const startDate = formatDate(start)
    if (isCurrent) return `${startDate} - Sekarang`
    if (!end) return startDate
    return `${startDate} - ${formatDate(end)}`
  }

  const experience = (cvSnapshot.experience || []) as any[]
  const education = (cvSnapshot.education || []) as any[]
  const skills = (cvSnapshot.skills || []) as any[]
  const certifications = (cvSnapshot.certifications || []) as any[]
  const projects = (cvSnapshot.projects || []) as any[]
  const languages = (cvSnapshot.languages || []) as any[]

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>CV - ${name}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11pt; line-height: 1.5; color: #333; padding: 20px 40px; }
        .header { display: flex; gap: 20px; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 2px solid #4F46E5; }
        .photo { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 3px solid #4F46E5; }
        .header-info h1 { font-size: 24pt; color: #1F2937; margin-bottom: 5px; }
        .header-info p { color: #6B7280; font-size: 10pt; }
        .contact-row { display: flex; flex-wrap: wrap; gap: 15px; margin-top: 8px; }
        .contact-item { font-size: 9pt; color: #4B5563; }
        .section { margin-bottom: 20px; }
        .section-title { font-size: 13pt; font-weight: bold; color: #4F46E5; border-bottom: 1px solid #E5E7EB; padding-bottom: 5px; margin-bottom: 12px; }
        .summary { color: #4B5563; font-size: 10pt; white-space: pre-line; }
        .item { margin-bottom: 12px; }
        .item-header { display: flex; justify-content: space-between; align-items: baseline; }
        .item-title { font-weight: 600; color: #1F2937; }
        .item-subtitle { color: #4F46E5; font-size: 10pt; }
        .item-date { font-size: 9pt; color: #9CA3AF; }
        .item-desc { font-size: 10pt; color: #6B7280; margin-top: 4px; white-space: pre-line; }
        .skills { display: flex; flex-wrap: wrap; gap: 8px; }
        .skill-tag { background: #EEF2FF; color: #4F46E5; padding: 4px 10px; border-radius: 15px; font-size: 9pt; }
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        ${fullPhotoUrl ? `<img src="${fullPhotoUrl}" class="photo" alt="Photo">` : ''}
        <div class="header-info">
          <h1>${personalInfo?.full_name || name}</h1>
          <div class="contact-row">
            ${personalInfo?.email ? `<span class="contact-item">📧 ${personalInfo.email}</span>` : ''}
            ${personalInfo?.phone ? `<span class="contact-item">📱 ${personalInfo.phone}</span>` : ''}
            ${personalInfo?.address ? `<span class="contact-item">📍 ${personalInfo.address}</span>` : ''}
          </div>
          <div class="contact-row">
            ${personalInfo?.linkedin ? `<span class="contact-item">🔗 LinkedIn: ${personalInfo.linkedin}</span>` : ''}
            ${personalInfo?.github ? `<span class="contact-item">💻 GitHub: ${personalInfo.github}</span>` : ''}
            ${personalInfo?.portfolio ? `<span class="contact-item">🌐 Portfolio: ${personalInfo.portfolio}</span>` : ''}
          </div>
        </div>
      </div>

      ${personalInfo?.summary ? `
        <div class="section">
          <div class="section-title">Tentang Saya</div>
          <p class="summary">${personalInfo.summary}</p>
        </div>
      ` : ''}

      ${experience.length > 0 ? `
        <div class="section">
          <div class="section-title">Pengalaman Kerja</div>
          ${experience.map((exp: any) => `
            <div class="item">
              <div class="item-header">
                <span class="item-title">${exp.position}</span>
                <span class="item-date">${formatDateRange(exp.start_date, exp.end_date, exp.is_current)}</span>
              </div>
              <div class="item-subtitle">${exp.company}</div>
              ${exp.description ? `<p class="item-desc">${exp.description}</p>` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${education.length > 0 ? `
        <div class="section">
          <div class="section-title">Pendidikan</div>
          ${education.map((edu: any) => `
            <div class="item">
              <div class="item-header">
                <span class="item-title">${edu.institution}</span>
                <span class="item-date">${formatDateRange(edu.start_date, edu.end_date, edu.is_current)}</span>
              </div>
              <div class="item-subtitle">${edu.degree} - ${edu.field_of_study}${edu.gpa ? ` (IPK: ${edu.gpa})` : ''}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${skills.length > 0 ? `
        <div class="section">
          <div class="section-title">Keahlian</div>
          <div class="skills">
            ${skills.map((skill: any) => `<span class="skill-tag">${skill.name}</span>`).join('')}
          </div>
        </div>
      ` : ''}

      ${certifications.length > 0 ? `
        <div class="section">
          <div class="section-title">Sertifikasi</div>
          ${certifications.map((cert: any) => `
            <div class="item">
              <div class="item-title">${cert.name}</div>
              <div class="item-subtitle">${cert.issuer}${cert.issue_date ? ` • ${formatDate(cert.issue_date)}` : ''}</div>
              ${cert.credential_id ? `<p class="item-desc">ID: ${cert.credential_id}</p>` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${projects.length > 0 ? `
        <div class="section">
          <div class="section-title">Proyek</div>
          ${projects.map((project: any) => `
            <div class="item">
              <div class="item-title">${project.title}</div>
              ${project.description ? `<p class="item-desc">${project.description}</p>` : ''}
              ${project.url ? `<p class="item-desc">🔗 ${project.url}</p>` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${languages.length > 0 ? `
        <div class="section">
          <div class="section-title">Bahasa</div>
          <div class="skills">
            ${languages.map((lang: any) => `<span class="skill-tag">${lang.name} (${lang.proficiency})</span>`).join('')}
          </div>
        </div>
      ` : ''}
    </body>
    </html>
  `
}

// Loading skeleton component
function CandidateDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Skeleton className="w-10 h-10 rounded-md" />
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div>
                      <Skeleton className="h-3 w-16 mb-1" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <Skeleton className="h-16 w-16 mx-auto rounded-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
