import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { ArrowLeft, Loader2, Save, Send, AlertCircle, CheckCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useCompanyEligibility } from '@/hooks/useCompanyEligibility'
import { Company } from '@/types'

const jobFormSchema = z.object({
  title: z.string().min(5, 'Judul minimal 5 karakter'),
  category: z.string().min(1, 'Pilih kategori'),
  employmentType: z.string().min(1, 'Pilih tipe pekerjaan'),
  workLocation: z.string().min(1, 'Pilih lokasi kerja'),
  city: z.string().min(2, 'Masukkan kota'),
  description: z.string().min(50, 'Deskripsi minimal 50 karakter'),
  requirements: z.string().min(30, 'Persyaratan minimal 30 karakter'),
  salaryMin: z.string().optional(),
  salaryMax: z.string().optional(),
  salaryHidden: z.boolean().default(false),
  applicationDeadline: z.string().optional(),
})

type JobFormData = z.infer<typeof jobFormSchema>

const categories = [
  'Engineering',
  'Design',
  'Product',
  'Marketing',
  'Sales',
  'Finance',
  'Human Resources',
  'Operations',
  'Customer Service',
  'Data',
  'Lainnya',
]

const employmentTypes = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Kontrak' },
  { value: 'internship', label: 'Magang' },
  { value: 'freelance', label: 'Freelance' },
]

const workLocations = [
  { value: 'onsite', label: 'Onsite (Di Kantor)' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
]

// Mock quota data
const mockQuota = {
  remainingFreeQuota: 2,
  pricePerJob: 30000,
}

export default function JobFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const { canCreateJobs } = useCompanyEligibility()

  const [isLoading, setIsLoading] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [showPublishDialog, setShowPublishDialog] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [eligibilityError, setEligibilityError] = useState<{ code: string; message: string; details?: string } | null>(null)
  const [company, setCompany] = useState<Company | undefined>(undefined)

  const needsPayment = mockQuota.remainingFreeQuota <= 0

  // Load company data from localStorage (should come from auth)
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const userData = JSON.parse(userStr)
        setCompany(userData)
        
        // Check eligibility
        const { canCreate, error } = canCreateJobs(userData)
        if (!canCreate) {
          setEligibilityError(error)
        } else {
          setEligibilityError(null)
        }
      }
    } catch (error) {
      console.error('Failed to load company data:', error)
    }
  }, [canCreateJobs])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<JobFormData>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      salaryHidden: false,
    },
  })

  const salaryHidden = watch('salaryHidden')

  const onSaveDraft = async (_data: JobFormData) => {
    setIsSavingDraft(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success('Draft berhasil disimpan!')
      navigate('/jobs')
    } catch (error) {
      toast.error('Gagal menyimpan draft')
    } finally {
      setIsSavingDraft(false)
    }
  }

  const onPublish = async (_data: JobFormData) => {
    // Check eligibility before allowing publish
    const { canCreate, error } = canCreateJobs(company)
    if (!canCreate) {
      toast.error(error?.message || 'Anda tidak bisa membuat lowongan')
      return
    }

    if (needsPayment) {
      setShowPaymentDialog(true)
      return
    }
    setShowPublishDialog(true)
  }

  const confirmPublish = async () => {
    setIsLoading(true)
    setShowPublishDialog(false)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      toast.success('Lowongan berhasil dipublikasikan!')
      navigate('/jobs')
    } catch (error) {
      toast.error('Gagal mempublikasikan lowongan')
    } finally {
      setIsLoading(false)
    }
  }

  const goToPayment = () => {
    setShowPaymentDialog(false)
    // Save as pending payment and redirect to quota page
    navigate('/quota')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="job-form-page">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/jobs">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900" data-testid="page-title">
            {isEdit ? 'Edit Lowongan' : 'Buat Lowongan Baru'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEdit
              ? 'Perbarui informasi lowongan pekerjaan'
              : 'Isi informasi lowongan untuk menarik kandidat terbaik'}
          </p>
        </div>
      </div>

      {/* Eligibility Status */}
      {eligibilityError ? (
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900">{eligibilityError.message}</h3>
              {eligibilityError.details && (
                <p className="text-sm text-red-700 mt-1">{eligibilityError.details}</p>
              )}
            </div>
          </div>
          <Link to="/profile">
            <Button variant="outline" size="sm" className="border-red-300 hover:bg-red-50">
              Ke Profil Perusahaan
            </Button>
          </Link>
        </div>
      ) : (
        <div className="p-4 border border-green-200 bg-green-50 rounded-lg flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-green-900">Siap Membuat Lowongan</h3>
            <p className="text-sm text-green-700 mt-1">
              Profil perusahaan Anda sudah lengkap dan telah diverifikasi oleh admin.
            </p>
          </div>
        </div>
      )}

      <form className="space-y-6" data-testid="job-form">
        {/* Basic Information */}
        <Card className={eligibilityError ? 'opacity-50 pointer-events-none' : ''}>
          <CardHeader>
            <CardTitle>Informasi Dasar</CardTitle>
            <CardDescription>
              Informasi utama tentang lowongan pekerjaan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Judul Lowongan *</Label>
              <Input
                id="title"
                placeholder="contoh: Senior Frontend Developer"
                {...register('title')}
                className={errors.title ? 'border-red-500' : ''}
                data-testid="job-title-input"
                disabled={!!eligibilityError}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kategori *</Label>
                <Select onValueChange={(value) => setValue('category', value)}>
                  <SelectTrigger className={errors.category ? 'border-red-500' : ''} data-testid="job-category-select">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-red-500">{errors.category.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Tipe Pekerjaan *</Label>
                <Select onValueChange={(value) => setValue('employmentType', value)}>
                  <SelectTrigger className={errors.employmentType ? 'border-red-500' : ''} data-testid="job-type-select">
                    <SelectValue placeholder="Pilih tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    {employmentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.employmentType && (
                  <p className="text-sm text-red-500">{errors.employmentType.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Lokasi Kerja *</Label>
                <Select onValueChange={(value) => setValue('workLocation', value)}>
                  <SelectTrigger className={errors.workLocation ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Pilih lokasi" />
                  </SelectTrigger>
                  <SelectContent>
                    {workLocations.map((loc) => (
                      <SelectItem key={loc.value} value={loc.value}>
                        {loc.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.workLocation && (
                  <p className="text-sm text-red-500">{errors.workLocation.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Kota *</Label>
                <Input
                  id="city"
                  placeholder="contoh: Jakarta"
                  {...register('city')}
                  className={errors.city ? 'border-red-500' : ''}
                />
                {errors.city && (
                  <p className="text-sm text-red-500">{errors.city.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Job Details */}
        <Card>
          <CardHeader>
            <CardTitle>Detail Pekerjaan</CardTitle>
            <CardDescription>
              Deskripsikan pekerjaan dan persyaratan yang dibutuhkan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi Pekerjaan *</Label>
              <Textarea
                id="description"
                placeholder="Jelaskan tanggung jawab, tugas sehari-hari, dan ekspektasi untuk posisi ini..."
                rows={6}
                {...register('description')}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirements">Persyaratan *</Label>
              <Textarea
                id="requirements"
                placeholder="Sebutkan kualifikasi, skill, pengalaman, dan pendidikan yang dibutuhkan..."
                rows={6}
                {...register('requirements')}
                className={errors.requirements ? 'border-red-500' : ''}
              />
              {errors.requirements && (
                <p className="text-sm text-red-500">{errors.requirements.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Salary & Deadline */}
        <Card>
          <CardHeader>
            <CardTitle>Gaji & Deadline</CardTitle>
            <CardDescription>
              Informasi tambahan untuk menarik kandidat
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="salaryHidden"
                {...register('salaryHidden')}
                className="w-4 h-4 rounded border-gray-300"
              />
              <Label htmlFor="salaryHidden" className="font-normal">
                Sembunyikan informasi gaji
              </Label>
            </div>

            {!salaryHidden && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salaryMin">Gaji Minimum (Rp)</Label>
                  <Input
                    id="salaryMin"
                    type="number"
                    placeholder="contoh: 8000000"
                    {...register('salaryMin')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salaryMax">Gaji Maksimum (Rp)</Label>
                  <Input
                    id="salaryMax"
                    type="number"
                    placeholder="contoh: 12000000"
                    {...register('salaryMax')}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="applicationDeadline">Batas Waktu Lamaran</Label>
              <Input
                id="applicationDeadline"
                type="date"
                {...register('applicationDeadline')}
              />
              <p className="text-sm text-gray-500">
                Kosongkan jika tidak ada batas waktu
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-4 pt-4">
          <Button variant="outline" type="button" onClick={() => navigate('/jobs')} data-testid="cancel-button">
            Batal
          </Button>
          <div className="flex gap-3">
            <Button
              variant="outline"
              type="button"
              disabled={isSavingDraft || !!eligibilityError}
              onClick={handleSubmit(onSaveDraft)}
              className="gap-2"
              data-testid="save-draft-button"
            >
              {isSavingDraft ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Simpan Draft
            </Button>
            <Button
              type="button"
              disabled={isLoading || !!eligibilityError}
              onClick={handleSubmit(onPublish)}
              className="gap-2"
              data-testid="publish-button"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Publikasikan
            </Button>
          </div>
        </div>
      </form>

      {/* Publish Confirmation Dialog */}
      <AlertDialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publikasikan Lowongan?</AlertDialogTitle>
            <AlertDialogDescription>
              Lowongan akan direview oleh tim kami sebelum dipublikasikan. 
              Anda akan mendapat notifikasi ketika lowongan sudah aktif.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPublish}>
              Ya, Publikasikan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Payment Required Dialog */}
      <AlertDialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kuota Gratis Habis</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Kuota lowongan gratis Anda sudah habis. Untuk mempublikasikan lowongan ini, 
                Anda perlu melakukan pembayaran sebesar:
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(mockQuota.pricePerJob)}
              </p>
              <p>
                Setelah pembayaran dikonfirmasi, lowongan akan direview dan dipublikasikan.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={goToPayment}>
              Lanjut ke Pembayaran
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
