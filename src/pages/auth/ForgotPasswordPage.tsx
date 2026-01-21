import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApi } from '@/api/auth'
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react'

const forgotPasswordSchema = z.object({
  email: z.string().email('Email tidak valid'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)
    try {
      const response = await authApi.forgotPassword(data.email)
      
      if ('success' in response && !response.success) {
        const errorMsg = response.error?.message || 'Gagal mengirim email'
        throw new Error(errorMsg)
      }

      setIsSubmitted(true)
      toast.success('Email reset password telah dikirim!')
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Gagal mengirim email. Silakan coba lagi.'
      toast.error(errorMessage)
      console.error('Forgot password error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Terkirim!</h2>
        <p className="text-gray-600 mb-8">
          Kami telah mengirimkan instruksi reset password ke email Anda. 
          Silakan cek inbox atau folder spam Anda.
        </p>
        <Link to="/login">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Login
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link
        to="/login"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Login
      </Link>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">Lupa Password?</h2>
      <p className="text-gray-600 mb-8">
        Masukkan email perusahaan Anda dan kami akan mengirimkan instruksi untuk reset password.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email Perusahaan</Label>
          <Input
            id="email"
            type="email"
            placeholder="nama@perusahaan.com"
            {...register('email')}
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Mengirim...
            </>
          ) : (
            'Kirim Instruksi Reset'
          )}
        </Button>
      </form>
    </div>
  )
}
