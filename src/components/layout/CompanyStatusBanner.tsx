import { Clock, XCircle, Ban } from 'lucide-react'
import type { CompanyStatus } from '@/types'
import { cn } from '@/lib/utils'

interface CompanyStatusBannerProps {
  status: CompanyStatus
}

const statusConfig: Record<Exclude<CompanyStatus, 'verified'>, {
  icon: React.ElementType
  title: string
  message: string
  bgColor: string
  textColor: string
  iconColor: string
}> = {
  pending: {
    icon: Clock,
    title: 'Menunggu Verifikasi',
    message: 'Akun perusahaan Anda sedang dalam proses verifikasi. Anda belum dapat mempublikasikan lowongan hingga akun terverifikasi.',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-800',
    iconColor: 'text-amber-500',
  },
  rejected: {
    icon: XCircle,
    title: 'Verifikasi Ditolak',
    message: 'Maaf, verifikasi akun Anda ditolak. Silakan hubungi tim support untuk informasi lebih lanjut.',
    bgColor: 'bg-red-50',
    textColor: 'text-red-800',
    iconColor: 'text-red-500',
  },
  suspended: {
    icon: Ban,
    title: 'Akun Ditangguhkan',
    message: 'Akun perusahaan Anda telah ditangguhkan. Anda tidak dapat mempublikasikan lowongan atau mengelola kandidat. Hubungi tim support.',
    bgColor: 'bg-red-50',
    textColor: 'text-red-800',
    iconColor: 'text-red-500',
  },
}

export default function CompanyStatusBanner({ status }: CompanyStatusBannerProps) {
  if (status === 'verified') return null

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div className={cn('px-6 py-3 border-b', config.bgColor)}>
      <div className="flex items-start gap-3">
        <Icon className={cn('w-5 h-5 mt-0.5 shrink-0', config.iconColor)} />
        <div>
          <p className={cn('font-medium', config.textColor)}>{config.title}</p>
          <p className={cn('text-sm mt-0.5', config.textColor, 'opacity-80')}>
            {config.message}
          </p>
        </div>
      </div>
    </div>
  )
}
