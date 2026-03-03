import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Download, 
  CreditCard, 
  CheckCircle, 
  Clock, 
  XCircle,
  Search,
  Eye,
  FileText,
  AlertCircle,
  Calendar,
} from 'lucide-react'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { quotaApi } from '@/api/quota'
import type { PaymentStatus, PaymentProof } from '@/types'
import { toast } from 'sonner'

const statusConfig: Record<PaymentStatus, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  pending: { 
    label: 'Menunggu Konfirmasi', 
    icon: Clock, 
    color: 'text-amber-600', 
    bgColor: 'bg-amber-50 border-amber-200' 
  },
  confirmed: { 
    label: 'Dikonfirmasi', 
    icon: CheckCircle, 
    color: 'text-green-600', 
    bgColor: 'bg-green-50 border-green-200' 
  },
  rejected: { 
    label: 'Ditolak', 
    icon: XCircle, 
    color: 'text-red-600', 
    bgColor: 'bg-red-50 border-red-200' 
  },
}


export default function PaymentsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all')
  const [selectedPayment, setSelectedPayment] = useState<PaymentProof | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // Fetch payment history
  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: () => quotaApi.getPaymentHistory(),
  })

  const allPayments = paymentsData?.data || []

  // Filter payments
  const filteredPayments = allPayments.filter((payment) => {
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter
    const matchesSearch = 
      payment.id.toString().includes(searchQuery) ||
      payment.job_title?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  // Calculate totals
  const totalAmount = allPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
  const confirmedCount = allPayments.filter((p) => p.status === 'confirmed').length
  const pendingCount = allPayments.filter((p) => p.status === 'pending').length
  const rejectedCount = allPayments.filter((p) => p.status === 'rejected').length

  const handleDownloadInvoice = async (paymentId: number) => {
    try {
      const blob = await quotaApi.downloadInvoice(paymentId)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `invoice_${paymentId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('Invoice berhasil didownload!')
    } catch (error) {
      toast.error('Gagal mendownload invoice. Pastikan pembayaran sudah dikonfirmasi.')
      console.error('Download error:', error)
    }
  }

  const openDetail = (payment: PaymentProof) => {
    setSelectedPayment(payment)
    setDetailOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Riwayat Pembayaran</h1>
        <p className="text-gray-600">
          Kelola dan lihat detail semua pembayaran kuota lowongan Anda
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Pembayaran</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalAmount)}</div>
            <p className="text-xs text-gray-500 mt-1">{allPayments.length} transaksi</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Dikonfirmasi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{confirmedCount}</div>
            <p className="text-xs text-gray-500 mt-1">Pembayaran sukses</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Menunggu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
            <p className="text-xs text-gray-500 mt-1">Sedang diverifikasi</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Ditolak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
            <p className="text-xs text-gray-500 mt-1">Pembayaran ditolak</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Cari berdasarkan ID atau judul lowongan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as PaymentStatus | 'all')}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="pending">Menunggu Konfirmasi</SelectItem>
            <SelectItem value="confirmed">Dikonfirmasi</SelectItem>
            <SelectItem value="rejected">Ditolak</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payments Cards Grid */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </div>
        ) : filteredPayments.length === 0 ? (
          <Card className="text-center py-12">
            <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {allPayments.length === 0 
                ? 'Belum ada riwayat pembayaran'
                : 'Tidak ada pembayaran yang cocok dengan filter Anda'}
            </p>
          </Card>
        ) : (
          filteredPayments.map((payment) => {
            const config = statusConfig[payment.status]
            const Icon = config.icon
            return (
              <Card 
                key={payment.id} 
                className={cn('border-l-4 hover:shadow-md transition-all cursor-pointer', config.bgColor)}
                onClick={() => openDetail(payment)}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    {/* Left side - Main Info */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start gap-3">
                        <div className={cn('p-2 rounded-lg', config.bgColor)}>
                          <Icon className={cn('w-5 h-5', config.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900">
                              {payment.package_name || payment.job_title || 'Pembayaran Kuota'}
                            </h3>
                            <Badge variant="secondary" className="text-xs">
                              ID: {payment.id}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(payment.submitted_at)}
                          </p>
                          {payment.job_title && !payment.package_name && (
                            <p className="text-sm text-gray-600 mt-1">Lowongan: {payment.job_title}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right side - Status & Amount */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {formatCurrency(payment.amount)}
                        </div>
                        <Badge className={cn('gap-1 font-normal text-xs', config.bgColor)}>
                          {config.label}
                        </Badge>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            openDetail(payment)
                          }}
                          className="gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="hidden sm:inline">Lihat</span>
                        </Button>
                        {payment.status === 'confirmed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDownloadInvoice(payment.id)
                            }}
                            className="gap-1"
                          >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Invoice</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Detail Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Pembayaran</DialogTitle>
            <DialogDescription>
              Informasi lengkap tentang status pembayaran Anda
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-6">
              {/* Proof Image */}
              {selectedPayment.proof_image_url && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Bukti Transfer</p>
                  <div className="w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                    <img
                      src={`http://localhost:8081${selectedPayment.proof_image_url}`}
                      alt="Bukti pembayaran"
                      className="w-full h-auto object-cover max-h-80"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" font-family="sans-serif" font-size="16" fill="%239ca3af" text-anchor="middle" dy=".3em"%3EGambar bukti tidak ditemukan%3C/text%3E%3C/svg%3E'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Status Header */}
              <div className={cn('p-4 rounded-lg border-l-4', statusConfig[selectedPayment.status].bgColor)}>
                <div className="flex items-center gap-2 mb-2">
                  {(() => {
                    const Icon = statusConfig[selectedPayment.status].icon
                    return <Icon className={cn('w-5 h-5', statusConfig[selectedPayment.status].color)} />
                  })()}
                  <span className={cn('font-semibold', statusConfig[selectedPayment.status].color)}>
                    {statusConfig[selectedPayment.status].label}
                  </span>
                </div>
                <p className="text-sm text-gray-700">
                  {selectedPayment.status === 'pending' && 
                    'Pembayaran Anda sedang menunggu konfirmasi dari tim kami. Biasanya dikonfirmasi dalam 1-2 jam kerja.'}
                  {selectedPayment.status === 'confirmed' && 
                    'Pembayaran Anda telah dikonfirmasi. Kuota telah ditambahkan ke akun Anda.'}
                  {selectedPayment.status === 'rejected' && 
                    'Pembayaran Anda telah ditolak. Silakan hubungi support untuk informasi lebih lanjut.'}
                </p>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase font-semibold">ID Pembayaran</p>
                  <p className="text-sm font-medium">#{selectedPayment.id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Jumlah</p>
                  <p className="text-sm font-bold text-blue-600">{formatCurrency(selectedPayment.amount)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Kuota</p>
                  <p className="text-sm font-medium">{selectedPayment.quota_amount} lowongan</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Tipe Pembayaran</p>
                  <p className="text-sm font-medium">
                    {selectedPayment.package_id ? `Paket: ${selectedPayment.package_name}` : 'Single Posting'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Tanggal Pengajuan</p>
                  <p className="text-sm font-medium">{formatDate(selectedPayment.submitted_at)}</p>
                </div>
                {selectedPayment.confirmed_at && (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Tanggal Konfirmasi</p>
                    <p className="text-sm font-medium">{formatDate(selectedPayment.confirmed_at)}</p>
                  </div>
                )}
              </div>

              {/* Job Title */}
              {selectedPayment.job_title && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Lowongan</p>
                  <p className="text-sm font-medium text-gray-900">{selectedPayment.job_title}</p>
                </div>
              )}

              {/* Note */}
              {selectedPayment.note && (
                <div className={cn('p-3 rounded-lg border-l-4 border-l-blue-400 bg-blue-50', {
                  'border-l-red-400 bg-red-50': selectedPayment.status === 'rejected',
                })}>
                  <div className="flex items-start gap-2">
                    {selectedPayment.status === 'rejected' ? (
                      <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      <p className="text-xs font-semibold text-gray-700 mb-1">Catatan</p>
                      <p className="text-sm text-gray-700">{selectedPayment.note}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="space-y-3">
                <p className="text-xs text-gray-500 uppercase font-semibold">Timeline</p>
                <div className="space-y-2">
                  {/* Submitted */}
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-500 mt-1"></div>
                      <div className="w-0.5 h-8 bg-gray-200 my-1"></div>
                    </div>
                    <div className="pb-2">
                      <p className="text-sm font-medium text-gray-900">Pembayaran Diajukan</p>
                      <p className="text-xs text-gray-500">{formatDate(selectedPayment.submitted_at)}</p>
                    </div>
                  </div>

                  {/* Confirmed/Rejected */}
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        'w-3 h-3 rounded-full',
                        selectedPayment.confirmed_at ? 'bg-green-500' : 'bg-gray-300'
                      )}></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedPayment.confirmed_at ? 'Pembayaran Dikonfirmasi' : 
                         selectedPayment.status === 'rejected' ? 'Pembayaran Ditolak' :
                         'Menunggu Konfirmasi'}
                      </p>
                      {selectedPayment.confirmed_at && (
                        <p className="text-xs text-gray-500">{formatDate(selectedPayment.confirmed_at)}</p>
                      )}
                      {selectedPayment.status === 'pending' && (
                        <p className="text-xs text-amber-600">Dalam proses verifikasi...</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                {selectedPayment.status === 'confirmed' && (
                  <Button 
                    onClick={() => {
                      handleDownloadInvoice(selectedPayment.id)
                      setDetailOpen(false)
                    }}
                    className="flex-1 gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Unduh Invoice
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => setDetailOpen(false)}
                  className="flex-1"
                >
                  Tutup
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-900">
            <strong>💡 Tip:</strong> Pembayaran Anda akan diverifikasi dalam 1-2 jam kerja pada hari kerja. 
            Invoice otomatis akan dikirim ke email Anda setelah dikonfirmasi.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
