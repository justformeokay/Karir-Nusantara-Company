import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
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
  MapPin,
  Briefcase,
  GraduationCap,
  FileText,
  Download,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
} from 'lucide-react'
import { cn, formatDate, getInitials } from '@/lib/utils'
import type { ApplicationStatus } from '@/types'

// Mock data
const mockCandidate = {
  id: '1',
  name: 'Budi Santoso',
  email: 'budi.santoso@email.com',
  phone: '081234567890',
  photo: null,
  location: 'Jakarta, Indonesia',
  experience: '3 tahun pengalaman',
  education: 'S1 Teknik Informatika - Universitas Indonesia',
  skills: ['React.js', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker'],
  cvUrl: '/cv/budi-santoso.pdf',
  cvScore: 85,
  coverLetter: `Dengan hormat,

Saya sangat tertarik untuk bergabung dengan tim Engineering di perusahaan Anda sebagai Frontend Developer. Dengan pengalaman 3 tahun dalam pengembangan web menggunakan React.js dan TypeScript, saya yakin dapat memberikan kontribusi yang signifikan.

Beberapa pencapaian saya:
• Mengembangkan dashboard analytics yang meningkatkan produktivitas tim sebesar 40%
• Memimpin migrasi codebase dari JavaScript ke TypeScript
• Mentoring 3 junior developer

Saya sangat antusias untuk mendiskusikan bagaimana pengalaman saya dapat bermanfaat bagi tim Anda.

Terima kasih atas pertimbangannya.

Hormat saya,
Budi Santoso`,
  job: {
    id: '1',
    title: 'Frontend Developer',
  },
  status: 'under_review' as ApplicationStatus,
  appliedAt: '2026-01-17T08:00:00Z',
  timeline: [
    { id: '1', status: 'applied', note: 'Lamaran dikirim', createdAt: '2026-01-17T08:00:00Z' },
    { id: '2', status: 'under_review', note: 'Mulai direview oleh HR', createdAt: '2026-01-18T10:00:00Z' },
  ],
}

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

const statusOptions = [
  { value: 'applied', label: 'Baru Melamar' },
  { value: 'under_review', label: 'Dalam Review' },
  { value: 'interview', label: 'Interview' },
  { value: 'accepted', label: 'Diterima' },
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
  const { id: _id } = useParams()
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [newStatus, setNewStatus] = useState<ApplicationStatus>(mockCandidate.status)
  const [statusNote, setStatusNote] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const candidate = mockCandidate

  const handleUpdateStatus = async () => {
    setIsUpdating(true)
    try {
      // API call to update status
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success('Status kandidat berhasil diperbarui!')
      setShowStatusDialog(false)
      setStatusNote('')
    } catch (error) {
      toast.error('Gagal memperbarui status')
    } finally {
      setIsUpdating(false)
    }
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
                <AvatarImage src={candidate.photo || undefined} />
                <AvatarFallback className="bg-primary text-white text-xl">
                  {getInitials(candidate.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{candidate.name}</h1>
                <p className="text-gray-600">
                  Melamar: <span className="font-medium">{candidate.job.title}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={cn('text-sm py-1 px-3', statusConfig[candidate.status].color)}>
                {statusConfig[candidate.status].label}
              </Badge>
              <Button onClick={() => setShowStatusDialog(true)}>
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
                    <p className="font-medium">{candidate.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Phone className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Telepon</p>
                    <p className="font-medium">{candidate.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Lokasi</p>
                    <p className="font-medium">{candidate.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tanggal Melamar</p>
                    <p className="font-medium">{formatDate(candidate.appliedAt)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Background */}
          <Card>
            <CardHeader>
              <CardTitle>Latar Belakang</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pengalaman</p>
                  <p className="font-medium">{candidate.experience}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pendidikan</p>
                  <p className="font-medium">{candidate.education}</p>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-gray-500 mb-2">Keahlian</p>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cover Letter */}
          <Card>
            <CardHeader>
              <CardTitle>Cover Letter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-line text-gray-700 leading-relaxed">
                {candidate.coverLetter}
              </div>
            </CardContent>
          </Card>
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
                <p className={cn('text-5xl font-bold', getCvScoreColor(candidate.cvScore))}>
                  {candidate.cvScore}
                </p>
                <p className={cn('text-sm mt-1', getCvScoreColor(candidate.cvScore))}>
                  {getCvScoreLabel(candidate.cvScore)}
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
              <Button className="w-full gap-2">
                <Download className="w-4 h-4" />
                Download CV
              </Button>
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
              <div className="space-y-4">
                {candidate.timeline.map((event, index) => (
                  <div key={event.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center',
                        index === candidate.timeline.length - 1 ? 'bg-primary' : 'bg-gray-200'
                      )}>
                        {event.status === 'accepted' ? (
                          <CheckCircle className="w-4 h-4 text-white" />
                        ) : event.status === 'rejected' ? (
                          <XCircle className="w-4 h-4 text-white" />
                        ) : (
                          <div className={cn(
                            'w-2 h-2 rounded-full',
                            index === candidate.timeline.length - 1 ? 'bg-white' : 'bg-gray-400'
                          )} />
                        )}
                      </div>
                      {index < candidate.timeline.length - 1 && (
                        <div className="w-px h-8 bg-gray-200" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="font-medium text-sm">
                        {statusConfig[event.status as ApplicationStatus].label}
                      </p>
                      <p className="text-sm text-gray-500">{event.note}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(event.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
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
            <Button onClick={handleUpdateStatus} disabled={isUpdating}>
              {isUpdating ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
