import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import {
  CreditCard,
  Upload,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Copy,
  Loader2,
  Gift,
  Sparkles,
  Image,
  Download,
  Eye,
  Calendar,
  FileText,
} from 'lucide-react'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { quotaApi } from '@/api/quota'
import type { TopUpPackage } from '@/api/quota'
import type { PaymentStatus, PaymentProof } from '@/types'

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

export default function QuotaPage() {
  const queryClient = useQueryClient()
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<TopUpPackage | null>(null)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<PaymentProof | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch quota data
  const { data: quotaData, isLoading: isLoadingQuota } = useQuery({
    queryKey: ['quota'],
    queryFn: quotaApi.getQuota,
  })

  // Fetch payment info (includes packages)
  const { data: paymentInfoData, isLoading: isLoadingPaymentInfo } = useQuery({
    queryKey: ['payment-info'],
    queryFn: quotaApi.getPaymentInfo,
  })

  // Fetch payment history
  const { data: paymentsData, isLoading: isLoadingPayments } = useQuery({
    queryKey: ['payments'],
    queryFn: () => quotaApi.getPaymentHistory(),
  })

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: ({ file, packageId }: { file: File; packageId?: string }) => 
      quotaApi.submitPaymentProof(file, { packageId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['quota'] })
      toast.success('Bukti pembayaran berhasil diunggah!')
      setShowPaymentDialog(false)
      setProofFile(null)
      setSelectedPackage(null)
    },
    onError: () => {
      toast.error('Gagal mengunggah bukti pembayaran')
    },
  })

  const quota = quotaData?.data
  const paymentInfo = paymentInfoData?.data
  const payments = paymentsData?.data || []
  const packages = paymentInfo?.packages || []

  const quotaPercentage = quota ? (quota.used_free_quota / quota.free_quota) * 100 : 0

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

  const handleCopyAccountNumber = () => {
    if (paymentInfo?.account_number) {
      navigator.clipboard.writeText(paymentInfo.account_number)
      toast.success('Nomor rekening berhasil disalin!')
    }
  }

  const handleSelectPackage = (pkg: TopUpPackage) => {
    setSelectedPackage(pkg)
    setShowPaymentDialog(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 5MB')
        return
      }
      setProofFile(file)
    }
  }

  const handleUploadProof = async () => {
    if (!proofFile) {
      toast.error('Pilih file bukti pembayaran')
      return
    }
    uploadMutation.mutate({ file: proofFile, packageId: selectedPackage?.id })
  }

  return (
    <div className="space-y-6" data-testid="quota-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900" data-testid="page-title">Kuota & Pembayaran</h1>
        <p className="text-gray-600 mt-1">
          Kelola kuota lowongan dan riwayat pembayaran
        </p>
      </div>

      {/* Total Quota Summary */}
      {quota && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-900">{quota.remaining_free_quota + quota.paid_quota}</p>
                <p className="text-sm text-blue-700 mt-1">Total Kuota Tersedia</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-900">{quota.remaining_free_quota}</p>
                <p className="text-sm text-green-700 mt-1">Kuota Gratis Tersisa</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-900">{quota.paid_quota}</p>
                <p className="text-sm text-purple-700 mt-1">Kuota Berbayar</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quota Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Free Quota Card */}
        <Card data-testid="free-quota-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Kuota Lowongan Gratis
            </CardTitle>
            <CardDescription>
              Setiap perusahaan mendapat {paymentInfo?.free_quota_limit ?? 3} lowongan gratis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingQuota ? (
              <>
                <div className="flex items-end justify-between">
                  <div>
                    <Skeleton className="h-10 w-16 mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-3 w-full" />
              </>
            ) : (
              <>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-4xl font-bold text-gray-900" data-testid="quota-value">
                      {quota?.remaining_free_quota ?? 0}
                    </p>
                    <p className="text-sm text-gray-500">lowongan tersisa</p>
                  </div>
                  <p className="text-sm text-gray-500" data-testid="quota-usage">
                    {quota?.used_free_quota ?? 0} / {quota?.free_quota ?? 5} terpakai
                  </p>
                </div>
                <Progress value={quotaPercentage} className="h-3" />
                {quota && quota.remaining_free_quota === 0 && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg" data-testid="quota-warning">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">
                        Kuota gratis habis
                      </p>
                      <p className="text-sm text-amber-700">
                        Lowongan berikutnya akan dikenakan biaya {formatCurrency(quota.price_per_job)}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Payment Info Card */}
        <Card data-testid="payment-info-card">
          <CardHeader>
            <CardTitle>Informasi Pembayaran</CardTitle>
            <CardDescription>
              Transfer ke rekening berikut untuk pembayaran kuota tambahan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingPaymentInfo ? (
              <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                <Skeleton className="h-4 w-full" />
                <Separator />
                <Skeleton className="h-4 w-full" />
                <Separator />
                <Skeleton className="h-4 w-full" />
                <Separator />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Bank</span>
                  <span className="font-semibold">{paymentInfo?.bank || '-'}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Nomor Rekening</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold font-mono">{paymentInfo?.account_number || '-'}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleCopyAccountNumber}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-600">Atas Nama</span>
                  <span className="font-semibold">{paymentInfo?.account_name || '-'}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-600">Biaya per Lowongan</span>
                  <span className="font-semibold text-primary">
                    {formatCurrency(paymentInfo?.price_per_job || quota?.price_per_job || 0)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top-Up Packages */}
      <Card data-testid="topup-packages">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Paket Top-Up Kuota
          </CardTitle>
          <CardDescription>
            Pilih paket yang sesuai dengan kebutuhan Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingPaymentInfo ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-48 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {packages.map((pkg) => (
                <Card
                  key={pkg.id}
                  className={cn(
                    "relative cursor-pointer transition-all hover:shadow-md",
                    pkg.is_best_value && "border-2 border-primary ring-2 ring-primary/20"
                  )}
                  onClick={() => handleSelectPackage(pkg)}
                >
                  {pkg.is_best_value && (
                    <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">
                      <Gift className="w-3 h-3 mr-1" />
                      Best Value
                    </Badge>
                  )}
                  <CardContent className="pt-6 text-center">
                    <h3 className="font-bold text-lg">{pkg.name}</h3>
                    <p className="text-3xl font-bold text-primary mt-2">
                      {formatCurrency(pkg.price)}
                    </p>
                    {pkg.bonus_quota > 0 && (
                      <Badge variant="secondary" className="mt-2 bg-green-100 text-green-700">
                        <Gift className="w-3 h-3 mr-1" />
                        +{pkg.bonus_quota} Gratis!
                      </Badge>
                    )}
                    <p className="text-sm text-gray-500 mt-2">
                      {pkg.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatCurrency(pkg.price_per_job)}/lowongan
                    </p>
                    <Button 
                      className="w-full mt-4" 
                      variant={pkg.is_best_value ? "default" : "outline"}
                    >
                      Pilih Paket
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card data-testid="payment-history">
        <CardHeader>
          <CardTitle>Riwayat Pembayaran</CardTitle>
          <CardDescription>
            Daftar pembayaran kuota lowongan Anda
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoadingPayments ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="p-4 border rounded-lg">
                  <Skeleton className="h-20 w-full" />
                </div>
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8">
              <div className="flex flex-col items-center">
                <CreditCard className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-gray-500">Belum ada riwayat pembayaran</p>
              </div>
            </div>
          ) : (
            payments.map((payment) => {
              const config = statusConfig[payment.status]
              const Icon = config.icon
              return (
                <div
                  key={payment.id}
                  className={cn('p-4 rounded-lg border-l-4 hover:shadow-md transition-all cursor-pointer', config.bgColor)}
                  onClick={() => {
                    setSelectedPayment(payment)
                    setDetailOpen(true)
                  }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="font-semibold text-gray-900">
                          {payment.package_name || payment.job_title || 'Pembayaran Kuota'}
                        </h4>
                        <Badge variant="secondary" className="text-xs">
                          #{payment.id}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(payment.submitted_at)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="font-bold text-blue-600">
                        {formatCurrency(payment.amount)}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedPayment(payment)
                            setDetailOpen(true)
                          }}
                          className="gap-1"
                        >
                          <Eye className="w-4 h-4" />
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
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* Payment Detail Modal */}
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
                    const StatusIcon = statusConfig[selectedPayment.status].icon
                    return <StatusIcon className={cn('w-5 h-5', statusConfig[selectedPayment.status].color)} />
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

      {/* Upload Payment Proof Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={(open) => {
        setShowPaymentDialog(open)
        if (!open) {
          setSelectedPackage(null)
          setProofFile(null)
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Bukti Pembayaran</DialogTitle>
            <DialogDescription>
              Upload bukti transfer untuk konfirmasi pembayaran kuota lowongan
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Selected Package Info */}
            {selectedPackage && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold">{selectedPackage.name}</h4>
                    <p className="text-sm text-gray-500">{selectedPackage.description}</p>
                    {selectedPackage.bonus_quota > 0 && (
                      <Badge variant="secondary" className="mt-1 bg-green-100 text-green-700">
                        <Gift className="w-3 h-3 mr-1" />
                        +{selectedPackage.bonus_quota} Gratis!
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(selectedPackage.price)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Total: {selectedPackage.total_quota} lowongan
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Penting:</strong> Pastikan Anda sudah transfer {selectedPackage ? formatCurrency(selectedPackage.price) : ''} ke rekening yang tertera 
                sebelum mengupload bukti pembayaran.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Bukti Pembayaran</Label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              {proofFile ? (
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Image className="w-8 h-8 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{proofFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(proofFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setProofFile(null)
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ''
                      }
                    }}
                  >
                    Hapus
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full h-24 border-dashed"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-6 h-6 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Klik untuk upload gambar (Max 5MB)
                    </span>
                  </div>
                </Button>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleUploadProof} disabled={!proofFile || !selectedPackage || uploadMutation.isPending}>
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Mengunggah...
                </>
              ) : (
                'Upload'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
