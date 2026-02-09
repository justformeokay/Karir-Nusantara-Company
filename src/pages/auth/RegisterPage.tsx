import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuthStore } from '@/stores/authStore'
import { authApi } from '@/api/auth'
import { Eye, EyeOff, Loader2, Gift } from 'lucide-react'

const registerSchema = z.object({
  companyName: z.string().min(2, 'Nama perusahaan minimal 2 karakter'),
  email: z.string().email('Email tidak valid'),
  phone: z.string().min(10, 'Nomor telepon tidak valid'),
  industry: z.string().min(1, 'Pilih industri'),
  referralCode: z.string().optional(),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password tidak cocok',
  path: ['confirmPassword'],
})

type RegisterFormData = z.infer<typeof registerSchema>

const industries = [
  'Teknologi',
  'Keuangan & Perbankan',
  'Retail & E-commerce',
  'Manufaktur',
  'Kesehatan',
  'Pendidikan',
  'Media & Hiburan',
  'Konstruksi & Properti',
  'Transportasi & Logistik',
  'Lainnya',
]

export default function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setAuth } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Get referral code from URL (?ref=CODE or ?referral=CODE)
  const urlReferralCode = searchParams.get('ref') || searchParams.get('referral') || ''

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      referralCode: urlReferralCode,
    },
  })

  const referralCode = watch('referralCode')

  // Set referral code from URL on mount
  useEffect(() => {
    if (urlReferralCode) {
      setValue('referralCode', urlReferralCode)
    }
  }, [urlReferralCode, setValue])

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    try {
      // Call actual backend API
      const response = await authApi.register({
        email: data.email,
        password: data.password,
        full_name: 'Admin',
        phone: data.phone,
        role: 'company',
        company_name: data.companyName,
        referral_code: data.referralCode || undefined,
      })

      if (!response.success) {
        throw new Error(response.error?.message || 'Pendaftaran gagal')
      }

      // Save auth data
      setAuth(response.data.access_token, response.data.user)
      
      toast.success('Pendaftaran berhasil! Selamat datang di dashboard.')
      navigate('/dashboard')
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Pendaftaran gagal. Silakan coba lagi.'
      toast.error(errorMessage)
      console.error('Register error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Daftar Akun Perusahaan</h2>
      <p className="text-gray-600 mb-8">
        Mulai rekrut kandidat terbaik untuk perusahaan Anda
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="companyName">Nama Perusahaan</Label>
          <Input
            id="companyName"
            placeholder="PT Nama Perusahaan"
            {...register('companyName')}
            className={errors.companyName ? 'border-red-500' : ''}
          />
          {errors.companyName && (
            <p className="text-sm text-red-500">{errors.companyName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Perusahaan</Label>
          <Input
            id="email"
            type="email"
            placeholder="hr@perusahaan.com"
            {...register('email')}
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Nomor Telepon</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="021-12345678"
            {...register('phone')}
            className={errors.phone ? 'border-red-500' : ''}
          />
          {errors.phone && (
            <p className="text-sm text-red-500">{errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Industri</Label>
          <Select onValueChange={(value) => setValue('industry', value)}>
            <SelectTrigger className={errors.industry ? 'border-red-500' : ''}>
              <SelectValue placeholder="Pilih industri" />
            </SelectTrigger>
            <SelectContent>
              {industries.map((industry) => (
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
          <Label htmlFor="referralCode" className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-primary" />
            Kode Referral (Opsional)
          </Label>
          <Input
            id="referralCode"
            placeholder="Masukkan kode referral dari partner"
            {...register('referralCode')}
            className={referralCode ? 'border-green-500 bg-green-50' : ''}
          />
          <p className="text-xs text-gray-500">
            Jika Anda direferensikan oleh partner kami, masukkan kode referral mereka
          </p>
          {referralCode && (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <Gift className="w-3 h-3" />
              Kode referral akan digunakan: {referralCode}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Minimal 6 karakter"
              {...register('password')}
              className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Ulangi password"
            {...register('confirmPassword')}
            className={errors.confirmPassword ? 'border-red-500' : ''}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Mendaftar...
            </>
          ) : (
            'Daftar'
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Sudah punya akun?{' '}
        <Link to="/login" className="text-primary font-medium hover:underline">
          Masuk di sini
        </Link>
      </p>
    </div>
  )
}
