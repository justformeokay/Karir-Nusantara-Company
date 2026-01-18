import { Outlet } from 'react-router-dom'
import { Briefcase } from 'lucide-react'

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -left-24 w-96 h-96 border border-white rounded-full" />
          <div className="absolute top-1/2 -right-24 w-64 h-64 border border-white rounded-full" />
          <div className="absolute -bottom-12 left-1/3 w-48 h-48 border border-white rounded-full" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-xl">
              <Briefcase className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Karir Nusantara</h1>
              <p className="text-sm text-white/70">Company Portal</p>
            </div>
          </div>

          {/* Headline */}
          <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
            Temukan Talenta Terbaik untuk Perusahaan Anda
          </h2>
          <p className="text-lg text-white/80 leading-relaxed max-w-lg">
            Platform rekrutmen terpercaya yang menghubungkan perusahaan dengan kandidat berkualitas di seluruh Indonesia.
          </p>

          {/* Stats */}
          <div className="flex gap-8 mt-12">
            <div>
              <p className="text-3xl font-bold text-white">10K+</p>
              <p className="text-sm text-white/70">Perusahaan Terdaftar</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">500K+</p>
              <p className="text-sm text-white/70">Kandidat Aktif</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">50K+</p>
              <p className="text-sm text-white/70">Lowongan Berhasil</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-12 xl:px-20 bg-gray-50">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-xl">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Karir Nusantara</h1>
              <p className="text-xs text-gray-500">Company Portal</p>
            </div>
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  )
}
