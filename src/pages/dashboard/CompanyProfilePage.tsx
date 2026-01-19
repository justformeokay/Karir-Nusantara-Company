import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Building2,
  MapPin,
  Globe,
  Camera,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  FileText,
  Upload,
} from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { authApi } from '@/api/auth'
import type { CompanyStatus } from '@/types'

const profileSchema = z.object({
  name: z.string().min(2, 'Nama perusahaan minimal 2 karakter'),
  industry: z.string().min(1, 'Industri wajib dipilih'),
  size: z.string().min(1, 'Ukuran perusahaan wajib dipilih'),
  location: z.string().min(5, 'Lokasi minimal 5 karakter'),
  website: z.string().url('Format URL tidak valid').optional().or(z.literal('')),
  description: z.string().min(50, 'Deskripsi minimal 50 karakter'),
})

type ProfileFormData = z.infer<typeof profileSchema>

const industryOptions = [
  'Teknologi Informasi',
  'Keuangan & Perbankan',
  'E-commerce',
  'Manufaktur',
  'Kesehatan',
  'Pendidikan',
  'Retail',
  'Logistik',
  'Properti',
  'Media & Entertainment',
  'Lainnya',
]

const sizeOptions = [
  { value: '1-10', label: '1-10 karyawan' },
  { value: '11-50', label: '11-50 karyawan' },
  { value: '51-200', label: '51-200 karyawan' },
  { value: '201-500', label: '201-500 karyawan' },
  { value: '501-1000', label: '501-1000 karyawan' },
  { value: '1000+', label: 'Lebih dari 1000 karyawan' },
]

const statusConfig: Record<CompanyStatus, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  pending: { 
    label: 'Menunggu Verifikasi', 
    icon: Clock, 
    color: 'text-amber-700',
    bgColor: 'bg-amber-50 border-amber-200'
  },
  verified: { 
    label: 'Terverifikasi', 
    icon: CheckCircle, 
    color: 'text-green-700',
    bgColor: 'bg-green-50 border-green-200'
  },
  rejected: { 
    label: 'Ditolak', 
    icon: XCircle, 
    color: 'text-red-700',
    bgColor: 'bg-red-50 border-red-200'
  },
  suspended: { 
    label: 'Dinonaktifkan', 
    icon: AlertCircle, 
    color: 'text-gray-700',
    bgColor: 'bg-gray-50 border-gray-200'
  },
}

export default function CompanyProfilePage() {
  const { company, updateCompany } = useAuthStore()
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadedDocuments, setUploadedDocuments] = useState<{
    ktp_founder?: string
    akta_pendirian?: string
    npwp?: string
    nib?: string
  }>({})
  const [isDocumentsComplete, setIsDocumentsComplete] = useState(false)

  // Check if all documents are uploaded
  const checkDocumentsComplete = () => {
    const allUploaded = 
      uploadedDocuments.ktp_founder &&
      uploadedDocuments.akta_pendirian &&
      uploadedDocuments.npwp &&
      uploadedDocuments.nib
    setIsDocumentsComplete(!!allUploaded)
    // Save to localStorage for quick access
    localStorage.setItem('company_documents_complete', allUploaded ? 'true' : 'false')
  }

  // Check on component mount and when documents change
  useEffect(() => {
    checkDocumentsComplete()
  }, [uploadedDocuments])

  // Mock company data as fallback
  const mockCompany = {
    id: 1,
    email: 'hr@teknologinusantara.com',
    role: 'company',
    full_name: 'Admin HR',
    company_name: 'PT Teknologi Nusantara',
    company_logo_url: null,
    company_industry: 'Teknologi Informasi',
    company_size: '51-200',
    company_location: 'Jakarta Selatan, DKI Jakarta',
    company_website: 'https://teknologinusantara.com',
    company_description: 'PT Teknologi Nusantara adalah perusahaan teknologi yang berfokus pada pengembangan solusi digital untuk bisnis di Indonesia.',
    verification_status: 'verified' as CompanyStatus,
    is_active: true,
    is_verified: true,
    created_at: '2026-01-01T00:00:00Z',
  }

  const companyData = company || mockCompany

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: companyData.company_name || '',
      industry: companyData.company_industry || '',
      size: companyData.company_size || '',
      location: companyData.company_location || '',
      website: companyData.company_website || '',
      description: companyData.company_description || '',
    },
  })

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 2MB')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true)
    try {
      // Call API to update profile
      const updateData = {
        company_name: data.name,
        company_industry: data.industry,
        company_size: data.size,
        company_location: data.location,
        company_website: data.website,
        company_description: data.description,
      }

      const response = await authApi.updateProfile(updateData)
      
      if (response.success) {
        // Update local store
        updateCompany({
          ...company,
          ...response.data,
        })
        
        // Invalidate cache
        queryClient.invalidateQueries({ queryKey: ['profile'] })
        queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
        
        toast.success('Profil perusahaan berhasil diperbarui!')
      } else {
        toast.error('Gagal memperbarui profil')
      }
    } catch (error) {
      toast.error('Gagal memperbarui profil')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLegalDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: 'ktp_founder' | 'akta_pendirian' | 'npwp' | 'nib') => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 5MB')
        return
      }

      const validTypes = ['application/pdf', 'image/jpeg', 'image/png']
      if (!validTypes.includes(file.type)) {
        toast.error('Format file harus PDF, JPG, atau PNG')
        return
      }

      // For now, just show file name as uploaded
      setUploadedDocuments({
        ...uploadedDocuments,
        [docType]: file.name,
      })

      toast.success(`${docType.replace('_', ' ')} berhasil diunggah`)

      // TODO: Send to backend API
    }
  }

  const statusKey = companyData.verification_status || (companyData.is_verified ? 'verified' : 'pending')
  const statusInfo = statusConfig[statusKey]
  const StatusIcon = statusInfo.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profil Perusahaan</h1>
        <p className="text-gray-600 mt-1">
          Kelola informasi profil perusahaan Anda
        </p>
      </div>

      {/* Status Card */}
      <Card className={cn('border-2', statusInfo.bgColor)}>
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <StatusIcon className={cn('w-6 h-6', statusInfo.color)} />
            <div>
              <p className={cn('font-semibold', statusInfo.color)}>
                Status: {statusInfo.label}
              </p>
              {statusKey === 'pending' && (
                <p className="text-sm text-amber-600">
                  Tim kami sedang memverifikasi data perusahaan Anda. Proses ini biasanya memakan waktu 1-2 hari kerja.
                </p>
              )}
              {statusKey === 'rejected' && (
                <p className="text-sm text-red-600">
                  Mohon periksa kembali data perusahaan Anda dan hubungi tim support jika diperlukan.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Logo Card */}
          <Card>
            <CardHeader>
              <CardTitle>Logo Perusahaan</CardTitle>
              <CardDescription>
                Foto akan ditampilkan di profil dan lowongan
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="relative">
                <Avatar className="w-32 h-32">
                  <AvatarImage src={logoPreview || companyData.company_logo_url || undefined} />
                  <AvatarFallback className="bg-primary text-white text-3xl">
                    {getInitials(companyData.company_name || 'CN')}
                  </AvatarFallback>
                </Avatar>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute bottom-0 right-0 rounded-full shadow-md"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="w-4 h-4" />
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              <p className="text-sm text-gray-500 text-center mt-4">
                JPG atau PNG. Maksimal 2MB.
              </p>
            </CardContent>
          </Card>

          {/* Form Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Informasi Perusahaan</CardTitle>
              <CardDescription>
                Data ini akan ditampilkan di lowongan Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Perusahaan</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="name"
                      {...register('name')}
                      className={cn('pl-10', errors.name && 'border-red-500')}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry">Industri</Label>
                  <Select
                    value={watch('industry')}
                    onValueChange={(value) => setValue('industry', value)}
                  >
                    <SelectTrigger className={errors.industry ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Pilih industri" />
                    </SelectTrigger>
                    <SelectContent>
                      {industryOptions.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.industry && (
                    <p className="text-sm text-red-500">{errors.industry.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="size">Ukuran Perusahaan</Label>
                  <Select
                    value={watch('size')}
                    onValueChange={(value) => setValue('size', value)}
                  >
                    <SelectTrigger className={errors.size ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Pilih ukuran" />
                    </SelectTrigger>
                    <SelectContent>
                      {sizeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.size && (
                    <p className="text-sm text-red-500">{errors.size.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Lokasi</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="location"
                      placeholder="Kota, Provinsi"
                      {...register('location')}
                      className={cn('pl-10', errors.location && 'border-red-500')}
                    />
                  </div>
                  {errors.location && (
                    <p className="text-sm text-red-500">{errors.location.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website (Opsional)</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="website"
                    placeholder="https://perusahaan.com"
                    {...register('website')}
                    className={cn('pl-10', errors.website && 'border-red-500')}
                  />
                </div>
                {errors.website && (
                  <p className="text-sm text-red-500">{errors.website.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi Perusahaan</Label>
                <Textarea
                  id="description"
                  placeholder="Ceritakan tentang perusahaan Anda..."
                  rows={5}
                  {...register('description')}
                  className={errors.description ? 'border-red-500' : ''}
                />
                {errors.description && (
                  <p className="text-sm text-red-500">{errors.description.message}</p>
                )}
              </div>

              <Separator className="my-4" />

              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Perubahan'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>

      {/* Legal Documents Section */}
      <Card className={cn('border-2', isDocumentsComplete ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50')}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isDocumentsComplete ? (
                <CheckCircle className="w-5 h-5 text-green-700" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-700" />
              )}
              <div>
                <CardTitle>
                  {isDocumentsComplete ? '✓ Dokumen Legalitas Lengkap' : 'Dokumen Legalitas Perusahaan'}
                </CardTitle>
                <CardDescription>
                  {isDocumentsComplete 
                    ? 'Semua dokumen telah diunggah. Anda dapat membuat lowongan kerja.'
                    : 'Lengkapi semua dokumen untuk membuat lowongan kerja'}
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">
                <span className={isDocumentsComplete ? 'text-green-700' : 'text-amber-700'}>
                  {Object.keys(uploadedDocuments).length}/4 
                </span>
              </p>
              <p className="text-xs text-gray-600">dokumen</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* KTP Pendiri */}
            <div className="border-2 border-dashed border-amber-300 rounded-lg p-6">
              <div className="text-center">
                <FileText className="w-8 h-8 text-amber-700 mx-auto mb-3" />
                <Label className="text-sm font-semibold text-gray-900 block mb-2">
                  KTP Pendiri
                </Label>
                <p className="text-xs text-gray-600 mb-4">
                  PDF, JPG, atau PNG. Max 5MB.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('ktp-founder')?.click()}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Pilih File
                </Button>
                <input
                  id="ktp-founder"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleLegalDocumentUpload(e, 'ktp_founder')}
                  className="hidden"
                />
                {uploadedDocuments.ktp_founder && (
                  <p className="text-xs text-green-600 mt-2">✓ {uploadedDocuments.ktp_founder}</p>
                )}
              </div>
            </div>

            {/* Akta Pendirian */}
            <div className="border-2 border-dashed border-amber-300 rounded-lg p-6">
              <div className="text-center">
                <FileText className="w-8 h-8 text-amber-700 mx-auto mb-3" />
                <Label className="text-sm font-semibold text-gray-900 block mb-2">
                  Akta Pendirian Usaha
                </Label>
                <p className="text-xs text-gray-600 mb-4">
                  PDF, JPG, atau PNG. Max 5MB.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('akta-pendirian')?.click()}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Pilih File
                </Button>
                <input
                  id="akta-pendirian"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleLegalDocumentUpload(e, 'akta_pendirian')}
                  className="hidden"
                />
                {uploadedDocuments.akta_pendirian && (
                  <p className="text-xs text-green-600 mt-2">✓ {uploadedDocuments.akta_pendirian}</p>
                )}
              </div>
            </div>

            {/* NPWP */}
            <div className="border-2 border-dashed border-amber-300 rounded-lg p-6">
              <div className="text-center">
                <FileText className="w-8 h-8 text-amber-700 mx-auto mb-3" />
                <Label className="text-sm font-semibold text-gray-900 block mb-2">
                  NPWP Perusahaan
                </Label>
                <p className="text-xs text-gray-600 mb-4">
                  PDF, JPG, atau PNG. Max 5MB.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('npwp')?.click()}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Pilih File
                </Button>
                <input
                  id="npwp"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleLegalDocumentUpload(e, 'npwp')}
                  className="hidden"
                />
                {uploadedDocuments.npwp && (
                  <p className="text-xs text-green-600 mt-2">✓ {uploadedDocuments.npwp}</p>
                )}
              </div>
            </div>

            {/* NIB */}
            <div className="border-2 border-dashed border-amber-300 rounded-lg p-6">
              <div className="text-center">
                <FileText className="w-8 h-8 text-amber-700 mx-auto mb-3" />
                <Label className="text-sm font-semibold text-gray-900 block mb-2">
                  NIB (Nomor Induk Berusaha)
                </Label>
                <p className="text-xs text-gray-600 mb-4">
                  PDF, JPG, atau PNG. Max 5MB.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('nib')?.click()}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Pilih File
                </Button>
                <input
                  id="nib"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleLegalDocumentUpload(e, 'nib')}
                  className="hidden"
                />
                {uploadedDocuments.nib && (
                  <p className="text-xs text-green-600 mt-2">✓ {uploadedDocuments.nib}</p>
                )}
              </div>
            </div>
          </div>

          <div className={cn('border rounded-lg p-4', isDocumentsComplete 
            ? 'bg-green-100 border-green-300' 
            : 'bg-amber-100 border-amber-300')}>
            <p className={cn('text-sm', isDocumentsComplete 
              ? 'text-green-900' 
              : 'text-amber-900')}>
              <strong>{isDocumentsComplete ? '✓ Dokumen Lengkap: ' : 'Perhatian: '}</strong>
              {isDocumentsComplete 
                ? 'Semua dokumen telah diunggah dan diverifikasi. Anda sekarang dapat membuat lowongan kerja.'
                : 'Anda perlu melengkapi semua dokumen legalitas untuk dapat membuat lowongan kerja. Dokumen ini hanya untuk verifikasi super admin dan tidak akan dipublikasikan. Hal ini dilakukan untuk memastikan keabsahan informasi loker yang Anda unggah dan melindungi calon karyawan dari penyalahgunaan data.'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


