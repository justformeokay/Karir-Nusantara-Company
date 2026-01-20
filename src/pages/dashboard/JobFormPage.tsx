import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
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
import { jobsApi } from '@/api'
import { useAuthStore } from '@/stores/authStore'
import type { JobFormData } from '@/types'

const jobFormSchema = z.object({
  title: z.string().min(5, 'Judul minimal 5 karakter'),
  category: z.string().min(1, 'Pilih kategori'),
  employment_type: z.string().min(1, 'Pilih tipe pekerjaan'),
  work_type: z.string().min(1, 'Pilih lokasi kerja'),
  location: z.string().min(2, 'Masukkan lokasi'),
  description: z.string().min(50, 'Deskripsi minimal 50 karakter'),
  requirements: z.string().min(30, 'Persyaratan minimal 30 karakter'),
  experience_level: z.string().min(1, 'Pilih level pengalaman'),
  salary_min: z.number().optional().or(z.nan()).transform(val => val === undefined || Number.isNaN(val) ? undefined : val),
  salary_max: z.number().optional().or(z.nan()).transform(val => val === undefined || Number.isNaN(val) ? undefined : val),
  salary_visible: z.boolean().default(true),
  salary_currency: z.string().default('IDR'),
  skills: z.array(z.string()).default([]),
  responsibilities: z.string().optional(),
  benefits: z.string().optional(),
  application_email: z.string().email('Email tidak valid').optional().or(z.literal('')),
  expires_at: z.string().optional(),
})

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

const experienceLevels = [
  { value: 'entry', label: 'Entry Level' },
  { value: 'junior', label: 'Junior (1-2 tahun)' },
  { value: 'mid', label: 'Mid Level (3-5 tahun)' },
  { value: 'senior', label: 'Senior (5+ tahun)' },
  { value: 'lead', label: 'Lead / Manager' },
  { value: 'executive', label: 'Executive' },
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
  const { company } = useAuthStore()
  const queryClient = useQueryClient()

  const [isLoading, setIsLoading] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [showPublishDialog, setShowPublishDialog] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [formData, setFormData] = useState<JobFormData | null>(null)
  const [eligibilityError, setEligibilityError] = useState<{ code: string; message: string; details?: string } | null>(null)
  const [showBlockDialog, setShowBlockDialog] = useState(false)

  const needsPayment = mockQuota.remainingFreeQuota <= 0

  // Fetch job data when editing
  const { data: jobData, isLoading: isLoadingJob } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobsApi.getById(id!),
    enabled: isEdit,
  })

  // Check company eligibility when company data changes
  useEffect(() => {
    if (company) {
      // Check eligibility
      const { canCreate, error } = canCreateJobs(company)
      if (!canCreate) {
        setEligibilityError(error)
        setShowBlockDialog(true) // Show blocking dialog
      } else {
        setEligibilityError(null)
        setShowBlockDialog(false)
      }
    }
  }, [company, canCreateJobs])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<JobFormData>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: '',
      category: '',
      employment_type: '' as any,
      work_type: '' as any,
      location: '',
      description: '',
      requirements: '',
      experience_level: '',
      salary_visible: true,
      salary_currency: 'IDR',
      skills: [],
    },
  })

  const salaryVisible = watch('salary_visible')
  const watchedCategory = watch('category')
  const watchedEmploymentType = watch('employment_type')
  const watchedWorkType = watch('work_type')
  const watchedExperienceLevel = watch('experience_level')

  // Pre-fill form data when editing
  useEffect(() => {
    if (isEdit && jobData?.data) {
      const job = jobData.data
      setValue('title', job.title || '')
      setValue('description', job.description || '')
      setValue('requirements', job.requirements || '')
      setValue('location', job.location || '')
      setValue('salary_min', job.salary_min || 0)
      setValue('salary_max', job.salary_max || 0)
      setValue('salary_currency', job.salary_currency || 'IDR')
      setValue('salary_visible', job.salary_visible ?? true)
      setValue('category', job.category || '')
      setValue('employment_type', job.employment_type || '')
      setValue('work_type', job.work_type || '')
      setValue('experience_level', job.experience_level || '')
      setValue('skills', job.skills || [])
    }
  }, [isEdit, jobData, setValue])

  // Handle form validation errors
  const onFormError = (errors: any) => {
    console.error('Form validation errors:', errors)
    const firstError = Object.values(errors)[0] as any
    if (firstError?.message) {
      toast.error(firstError.message)
    } else {
      toast.error('Mohon lengkapi semua field yang wajib diisi')
    }
  }

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

  const onPublish = async (data: JobFormData) => {
    // Check eligibility before allowing publish
    const { canCreate, error } = canCreateJobs(company ?? undefined)
    if (!canCreate) {
      toast.error(error?.message || 'Anda tidak bisa membuat lowongan')
      return
    }

    if (needsPayment) {
      setShowPaymentDialog(true)
      return
    }
    
    // Store form data for confirmation
    setFormData(data)
    setShowPublishDialog(true)
  }

  const confirmPublish = async () => {
    setIsLoading(true)
    setShowPublishDialog(false)
    try {
      // Validate formData exists
      if (!formData) {
        throw new Error('Form data tidak ditemukan')
      }
      
      let response
      if (isEdit && id) {
        // Update existing job
        response = await jobsApi.update(id, formData)
      } else {
        // Create new job
        response = await jobsApi.create(formData)
      }
      
      if (response.success) {
        // Invalidate jobs cache so list refreshes
        queryClient.invalidateQueries({ queryKey: ['company-jobs'] })
        toast.success(isEdit ? 'Lowongan berhasil diperbarui!' : 'Lowongan berhasil dipublikasikan!')
        navigate('/jobs')
      } else {
        toast.error(response.error?.message || (isEdit ? 'Gagal memperbarui lowongan' : 'Gagal mempublikasikan lowongan'))
      }
    } catch (error: any) {
      console.error('Job operation error:', error)
      toast.error(error?.message || (isEdit ? 'Gagal memperbarui lowongan' : 'Gagal mempublikasikan lowongan'))
    } finally {
      setIsLoading(false)
    }
  }

  const goToPayment = () => {
    setShowPaymentDialog(false)
    // Save as pending payment and redirect to quota page
    navigate('/quota')
  }

  const handleBlockDialogClose = () => {
    // Don't allow closing the dialog, redirect instead
    navigate('/dashboard')
  }

  const handleGoToProfile = () => {
    navigate('/profile')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="job-form-page">
      {/* Access Blocked Dialog - Shows when company is not eligible */}
      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Akses Ditolak
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-3 space-y-3">
              <p className="font-semibold text-gray-900">{eligibilityError?.message}</p>
              {eligibilityError?.details && (
                <p className="text-sm text-gray-700">{eligibilityError.details}</p>
              )}
              
              {/* Show specific instructions based on error code */}
              {eligibilityError?.code === 'INCOMPLETE_PROFILE' && (
                <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
                  <p className="font-medium mb-1">💡 Lengkapi profil perusahaan Anda untuk dapat membuat lowongan</p>
                  <p>Anda akan diarahkan ke halaman profil untuk melengkapi informasi yang masih kurang.</p>
                </div>
              )}
              
              {eligibilityError?.code === 'MISSING_DOCUMENTS' && (
                <div className="bg-orange-50 p-3 rounded text-sm text-orange-800">
                  <p className="font-medium mb-1">📄 Upload semua dokumen yang diperlukan</p>
                  <p>Silakan lengkapi semua dokumen di halaman profil perusahaan.</p>
                </div>
              )}
              
              {eligibilityError?.code === 'PENDING_VERIFICATION' && (
                <div className="bg-amber-50 p-3 rounded text-sm text-amber-800">
                  <p className="font-medium mb-1">⏳ Menunggu Verifikasi Admin</p>
                  <p>Dokumen Anda sedang dalam proses verifikasi. Tim kami akan menyelesaikannya dalam 1-2 hari kerja. Anda akan mendapat notifikasi ketika verifikasi selesai.</p>
                </div>
              )}
              
              {eligibilityError?.code === 'NOT_VERIFIED' && (
                <div className="bg-red-50 p-3 rounded text-sm text-red-800">
                  <p className="font-medium mb-1">❌ Perusahaan Belum Diverifikasi</p>
                  <p>Hubungi tim admin kami untuk informasi lebih lanjut tentang status verifikasi perusahaan Anda.</p>
                </div>
              )}

              {eligibilityError?.code === 'VERIFICATION_REJECTED' && (
                <div className="bg-red-50 p-3 rounded text-sm text-red-800">
                  <p className="font-medium mb-1">⛔ Dokumen Ditolak</p>
                  <p>Silakan upload ulang dokumen yang sesuai dengan ketentuan yang berlaku.</p>
                </div>
              )}

              {eligibilityError?.code === 'ACCOUNT_SUSPENDED' && (
                <div className="bg-red-50 p-3 rounded text-sm text-red-800">
                  <p className="font-medium mb-1">🚫 Akun Di-Suspend</p>
                  <p>Akun perusahaan Anda sementara tidak dapat membuat lowongan. Hubungi tim support kami untuk bantuan.</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 sm:justify-between">
            <AlertDialogCancel onClick={handleBlockDialogClose} className="sm:flex-1">
              Kembali ke Dashboard
            </AlertDialogCancel>
            {eligibilityError?.code !== 'ACCOUNT_SUSPENDED' && (
              <AlertDialogAction onClick={handleGoToProfile} className="sm:flex-1">
                Ke Profil Perusahaan
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Only show form if eligible */}
      {!showBlockDialog && (
        <>
          {/* Loading state for edit mode */}
          {isEdit && isLoadingJob && (
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          )}

          {/* Header */}
          {(!isEdit || !isLoadingJob) && (
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
          )}

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
                <Select value={watchedCategory} onValueChange={(value) => setValue('category', value)}>
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
                <Select value={watchedEmploymentType} onValueChange={(value) => setValue('employment_type', value as any)}>
                  <SelectTrigger className={errors.employment_type ? 'border-red-500' : ''} data-testid="job-type-select">
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
                {errors.employment_type && (
                  <p className="text-sm text-red-500">{errors.employment_type.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Lokasi Kerja *</Label>
                <Select value={watchedWorkType} onValueChange={(value) => setValue('work_type', value as any)}>
                  <SelectTrigger className={errors.work_type ? 'border-red-500' : ''}>
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
                {errors.work_type && (
                  <p className="text-sm text-red-500">{errors.work_type.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Lokasi *</Label>
                <Input
                  id="location"
                  placeholder="contoh: Jakarta Selatan, DKI Jakarta"
                  {...register('location')}
                  className={errors.location ? 'border-red-500' : ''}
                />
                {errors.location && (
                  <p className="text-sm text-red-500">{errors.location.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Level Pengalaman *</Label>
              <Select value={watchedExperienceLevel} onValueChange={(value) => setValue('experience_level', value)}>
                <SelectTrigger className={errors.experience_level ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Pilih level pengalaman" />
                </SelectTrigger>
                <SelectContent>
                  {experienceLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.experience_level && (
                <p className="text-sm text-red-500">{errors.experience_level.message}</p>
              )}
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
                id="salary_visible"
                {...register('salary_visible')}
                className="w-4 h-4 rounded border-gray-300"
              />
              <Label htmlFor="salary_visible" className="font-normal">
                Tampilkan informasi gaji
              </Label>
            </div>

            {salaryVisible && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salary_min">Gaji Minimum (Rp)</Label>
                  <Input
                    id="salary_min"
                    type="number"
                    placeholder="contoh: 8000000"
                    {...register('salary_min', { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salary_max">Gaji Maksimum (Rp)</Label>
                  <Input
                    id="salary_max"
                    type="number"
                    placeholder="contoh: 12000000"
                    {...register('salary_max', { valueAsNumber: true })}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="expires_at">Batas Waktu Lamaran</Label>
              <Input
                id="expires_at"
                type="date"
                {...register('expires_at')}
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
              onClick={handleSubmit(onSaveDraft, onFormError)}
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
              onClick={handleSubmit(onPublish, onFormError)}
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
        </>
      )}
    </div>
  )
}
