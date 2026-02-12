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
  AlertTriangle,
  FileText,
  Upload,
} from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { authApi } from '@/api/auth'
import type { CompanyStatus } from '@/types'

const profileSchema = z.object({
  // Basic information
  name: z.string().min(2, 'Nama perusahaan minimal 2 karakter'),
  description: z.string().min(50, 'Deskripsi minimal 50 karakter'),
  website: z.string().url('Format URL tidak valid').optional().or(z.literal('')),
  
  // Company details
  industry: z.string().optional(),
  size: z.string().optional(),
  established_year: z.string().optional(),
  employee_count: z.string().optional(),
  
  // Contact information
  phone: z.string().optional(),
  email: z.string().email('Format email tidak valid').optional().or(z.literal('')),
  
  // Address information
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postal_code: z.string().optional(),
  location: z.string().optional(),
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
  const [showReVerificationDialog, setShowReVerificationDialog] = useState(false)
  const [pendingFormData, setPendingFormData] = useState<ProfileFormData | null>(null)

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
    company_phone: '+62-21-123456',
    company_email: 'info@teknologinusantara.com',
    company_address: 'Jl. Merdeka No. 123',
    company_city: 'Jakarta',
    company_province: 'DKI Jakarta',
    company_postal_code: '12345',
    established_year: 2015,
    employee_count: 150,
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
    reset,
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: companyData.company_name || '',
      description: companyData.company_description || '',
      website: companyData.company_website || '',
      industry: companyData.company_industry || '',
      size: companyData.company_size || '',
      established_year: companyData.established_year?.toString() || '',
      employee_count: companyData.employee_count?.toString() || '',
      phone: companyData.company_phone || '',
      email: companyData.company_email || '',
      address: companyData.company_address || '',
      city: companyData.company_city || '',
      province: companyData.company_province || '',
      postal_code: companyData.company_postal_code || '',
      location: companyData.company_location || '',
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
      
      // Upload logo immediately
      uploadLogo(file)
    }
  }

  const uploadLogo = async (file: File) => {
    try {
      const response = await authApi.uploadLogo(file)
      if (response.success && response.data) {
        updateCompany(response.data)
        queryClient.invalidateQueries({ queryKey: ['profile'] })
        queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
        toast.success('Logo perusahaan berhasil diunggah!')
      } else {
        toast.error('Gagal mengunggah logo')
      }
    } catch (error) {
      toast.error('Gagal mengunggah logo')
      console.error(error)
    }
  }

  // Sync form with company data when it updates
  useEffect(() => {
    if (company) {
      console.log('Syncing form with company data:', company)
      setValue('name', company.company_name || '')
      setValue('description', company.company_description || '')
      setValue('website', company.company_website || '')
      setValue('industry', company.company_industry || '')
      setValue('size', company.company_size || '')
      setValue('location', company.company_location || '')
      setValue('established_year', company.established_year?.toString() || '')
      setValue('employee_count', company.employee_count?.toString() || '')
      setValue('phone', company.company_phone || '')
      setValue('email', company.company_email || '')
      setValue('address', company.company_address || '')
      setValue('city', company.company_city || '')
      setValue('province', company.company_province || '')
      setValue('postal_code', company.company_postal_code || '')
      
      // Load uploaded documents from company data
      const docs: { [key: string]: string } = {}
      if (company.ktp_founder_url) {
        docs.ktp_founder = company.ktp_founder_url.split('/').pop() || 'KTP Pendiri'
      }
      if (company.akta_pendirian_url) {
        docs.akta_pendirian = company.akta_pendirian_url.split('/').pop() || 'Akta Pendirian'
      }
      if (company.npwp_url) {
        docs.npwp = company.npwp_url.split('/').pop() || 'NPWP'
      }
      if (company.nib_url) {
        docs.nib = company.nib_url.split('/').pop() || 'NIB'
      }
      if (Object.keys(docs).length > 0) {
        setUploadedDocuments(docs)
      }

      // Set logo preview if exists
      if (company.company_logo_url) {
        setLogoPreview(company.company_logo_url)
      }
    }
  }, [company, setValue])

  // Check if company is currently verified
  const isCompanyVerified = companyData.verification_status === 'verified' || companyData.is_verified

  const onSubmit = async (data: ProfileFormData) => {
    // If company is verified, show confirmation dialog first
    if (isCompanyVerified) {
      setPendingFormData(data)
      setShowReVerificationDialog(true)
      return
    }
    
    // Proceed with submission
    await submitProfileUpdate(data)
  }

  const submitProfileUpdate = async (data: ProfileFormData) => {
    setIsLoading(true)
    try {
      const updateData: any = {
        company_name: data.name,
        company_description: data.description,
        company_website: data.website,
        company_industry: data.industry,
        company_size: data.size,
        company_location: data.location,
        company_phone: data.phone,
        company_email: data.email,
        company_address: data.address,
        company_city: data.city,
        company_province: data.province,
        company_postal_code: data.postal_code,
        established_year: data.established_year ? parseInt(data.established_year) : null,
        employee_count: data.employee_count ? parseInt(data.employee_count) : null,
      }

      console.log('Submitting profile update:', updateData)
      const response = await authApi.updateProfile(updateData)
      
      console.log('Profile update response:', response)
      
      if (response.success && response.data) {
        // Update local store with response data
        updateCompany(response.data)
        
        // Reset form with new values
        reset({
          name: response.data.company_name || '',
          description: response.data.company_description || '',
          website: response.data.company_website || '',
          industry: response.data.company_industry || '',
          size: response.data.company_size || '',
          location: response.data.company_location || '',
          established_year: response.data.established_year?.toString() || '',
          employee_count: response.data.employee_count?.toString() || '',
          phone: response.data.company_phone || '',
          email: response.data.company_email || '',
          address: response.data.company_address || '',
          city: response.data.company_city || '',
          province: response.data.company_province || '',
          postal_code: response.data.company_postal_code || '',
        })
        
        // Invalidate cache to refresh data
        queryClient.invalidateQueries({ queryKey: ['profile'] })
        queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
        
        // Show appropriate success message based on previous status
        if (isCompanyVerified) {
          toast.success('Profil berhasil diperbarui! Status perusahaan akan diverifikasi ulang oleh Admin.')
        } else {
          toast.success('Profil perusahaan berhasil diperbarui!')
        }
      } else {
        toast.error('Gagal memperbarui profil')
      }
    } catch (error) {
      toast.error('Gagal memperbarui profil')
      console.error(error)
    } finally {
      setIsLoading(false)
      setPendingFormData(null)
    }
  }

  const handleConfirmReVerification = async () => {
    setShowReVerificationDialog(false)
    if (pendingFormData) {
      await submitProfileUpdate(pendingFormData)
    }
  }

  const handleLegalDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: 'ktp_founder' | 'akta_pendirian' | 'npwp' | 'nib') => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 10MB')
        return
      }

      const validTypes = ['application/pdf', 'image/jpeg', 'image/png']
      if (!validTypes.includes(file.type)) {
        toast.error('Format file harus PDF, JPG, atau PNG')
        return
      }

      try {
        setIsLoading(true)
        
        // Map docType to backend format
        const docTypeMap: Record<string, string> = {
          'ktp_founder': 'ktp',
          'akta_pendirian': 'akta',
          'npwp': 'npwp',
          'nib': 'nib',
        }
        
        const response = await authApi.uploadDocument(file, docTypeMap[docType])
        
        if (response.success) {
          setUploadedDocuments({
            ...uploadedDocuments,
            [docType]: file.name,
          })
          toast.success(`${docType.replace('_', ' ')} berhasil diunggah`)
        } else {
          toast.error(`Gagal mengunggah ${docType.replace('_', ' ')}`)
        }
      } catch (error) {
        toast.error(`Gagal mengunggah ${docType.replace('_', ' ')}`)
        console.error(error)
      } finally {
        setIsLoading(false)
      }
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

      {/* Warning for verified companies */}
      {isCompanyVerified && (
        <Card className="border-2 border-amber-300 bg-amber-50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-amber-800">
                  Perhatian: Perubahan Data Memerlukan Verifikasi Ulang
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  Perusahaan Anda sudah terverifikasi. Jika Anda mengubah informasi profil, 
                  status verifikasi akan direset dan Anda tidak dapat memposting lowongan baru 
                  sampai diverifikasi ulang oleh Super Admin (1-2 hari kerja).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                <Avatar className="w-32 h-32 border border-gray-300">
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
            <CardContent className="space-y-6">
              {/* Basic Information Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Informasi Dasar</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Perusahaan *</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="name"
                        placeholder="PT Teknologi Nusantara"
                        {...register('name')}
                        className={cn('pl-10', errors.name && 'border-red-500')}
                      />
                    </div>
                    {errors.name && (
                      <p className="text-sm text-red-500">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="established_year">Tahun Berdiri</Label>
                      <Input
                        id="established_year"
                        type="number"
                        placeholder="2015"
                        {...register('established_year')}
                        className={errors.established_year ? 'border-red-500' : ''}
                      />
                      {errors.established_year && (
                        <p className="text-sm text-red-500">{errors.established_year.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="employee_count">Jumlah Karyawan</Label>
                      <Input
                        id="employee_count"
                        type="number"
                        placeholder="150"
                        {...register('employee_count')}
                        className={errors.employee_count ? 'border-red-500' : ''}
                      />
                      {errors.employee_count && (
                        <p className="text-sm text-red-500">{errors.employee_count.message}</p>
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
                    <Label htmlFor="description">Deskripsi Perusahaan *</Label>
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
                </div>
              </div>

              <Separator />

              {/* Contact Information Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Informasi Kontak</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Nomor Telepon</Label>
                      <Input
                        id="phone"
                        placeholder="+62-21-123456"
                        {...register('phone')}
                        className={errors.phone ? 'border-red-500' : ''}
                      />
                      {errors.phone && (
                        <p className="text-sm text-red-500">{errors.phone.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Perusahaan</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="info@perusahaan.com"
                        {...register('email')}
                        className={errors.email ? 'border-red-500' : ''}
                      />
                      {errors.email && (
                        <p className="text-sm text-red-500">{errors.email.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Address Information Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Alamat Perusahaan</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Alamat Lengkap</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Textarea
                        id="address"
                        placeholder="Jl. Merdeka No. 123"
                        rows={2}
                        {...register('address')}
                        className={cn('pl-10', errors.address && 'border-red-500')}
                      />
                    </div>
                    {errors.address && (
                      <p className="text-sm text-red-500">{errors.address.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">Kota</Label>
                      <Input
                        id="city"
                        placeholder="Jakarta"
                        {...register('city')}
                        className={errors.city ? 'border-red-500' : ''}
                      />
                      {errors.city && (
                        <p className="text-sm text-red-500">{errors.city.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="province">Provinsi</Label>
                      <Input
                        id="province"
                        placeholder="DKI Jakarta"
                        {...register('province')}
                        className={errors.province ? 'border-red-500' : ''}
                      />
                      {errors.province && (
                        <p className="text-sm text-red-500">{errors.province.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="postal_code">Kode Pos</Label>
                      <Input
                        id="postal_code"
                        placeholder="12345"
                        {...register('postal_code')}
                        className={errors.postal_code ? 'border-red-500' : ''}
                      />
                      {errors.postal_code && (
                        <p className="text-sm text-red-500">{errors.postal_code.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Lokasi Ringkas</Label>
                      <Input
                        id="location"
                        placeholder="Jakarta Selatan, DKI Jakarta"
                        {...register('location')}
                        className={errors.location ? 'border-red-500' : ''}
                      />
                      {errors.location && (
                        <p className="text-sm text-red-500">{errors.location.message}</p>
                      )}
                    </div>
                  </div>
                </div>
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

      {/* Re-Verification Confirmation Dialog */}
      <AlertDialog open={showReVerificationDialog} onOpenChange={setShowReVerificationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <AlertDialogTitle>Konfirmasi Perubahan Profil</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-left space-y-3 pt-2">
              <p>
                Perusahaan Anda saat ini sudah <strong className="text-green-600">terverifikasi</strong>. 
                Jika Anda mengubah informasi profil, status verifikasi akan direset dan perusahaan 
                akan masuk ke antrian verifikasi ulang oleh Super Admin.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-sm">
                <strong>Dampak perubahan:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Status perusahaan akan berubah menjadi "Menunggu Verifikasi"</li>
                  <li>Anda <strong>tidak dapat</strong> memposting lowongan baru sampai diverifikasi ulang</li>
                  <li>Proses verifikasi membutuhkan waktu 1-2 hari kerja</li>
                </ul>
              </div>
              <p className="text-gray-600">
                Apakah Anda yakin ingin melanjutkan perubahan?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingFormData(null)}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmReVerification}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Ya, Lanjutkan Perubahan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}


