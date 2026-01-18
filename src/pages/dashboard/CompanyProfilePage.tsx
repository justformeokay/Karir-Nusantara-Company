import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
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
} from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
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
  const [isLoading, setIsLoading] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      // API call to update profile
      await new Promise((resolve) => setTimeout(resolve, 1500))
      
      // Update local state
      if (company) {
        updateCompany({
          ...company,
          ...data,
        })
      }
      
      toast.success('Profil perusahaan berhasil diperbarui!')
    } catch (error) {
      toast.error('Gagal memperbarui profil')
    } finally {
      setIsLoading(false)
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
    </div>
  )
}
