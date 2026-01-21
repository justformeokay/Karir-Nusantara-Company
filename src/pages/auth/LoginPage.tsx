import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/authStore'
import { authApi } from '@/api/auth'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      // Call actual backend API
      const response = await authApi.login({
        email: data.email,
        password: data.password,
      })

      // Check if response has success flag
      if ('success' in response && !response.success) {
        // Backend returned error in response body
        const errorMsg = response.error?.message || response.error?.code || 'Login gagal'
        throw new Error(errorMsg)
      }

      if (!response.data) {
        throw new Error('Invalid response from server')
      }

      // Save auth data
      setAuth(response.data.access_token, response.data.user)
      toast.success('Login berhasil!')
      navigate('/dashboard')
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Login gagal. Periksa email dan password Anda.'
      toast.error(errorMessage)
      console.error('Login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div data-testid="login-page">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Masuk ke Dashboard</h2>
      <p className="text-gray-600 mb-8">
        Kelola lowongan dan kandidat perusahaan Anda
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" data-testid="login-form">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="nama@perusahaan.com"
            {...register('email')}
            className={errors.email ? 'border-red-500' : ''}
            data-testid="email-input"
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              to="/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              Lupa password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Masukkan password"
              {...register('password')}
              className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
              data-testid="password-input"
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

        <Button type="submit" className="w-full" disabled={isLoading} data-testid="login-button">
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Masuk...
            </>
          ) : (
            'Masuk'
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Belum punya akun?{' '}
        <Link to="/register" className="text-primary font-medium hover:underline">
          Daftar sekarang
        </Link>
      </p>
    </div>
  )
}
