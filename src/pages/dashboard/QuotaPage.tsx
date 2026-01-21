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
} from 'lucide-react'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { quotaApi } from '@/api/quota'
import type { TopUpPackage } from '@/api/quota'
import type { PaymentStatus } from '@/types'

const statusConfig: Record<PaymentStatus, { label: string; icon: React.ElementType; color: string }> = {
  pending: { label: 'Menunggu Konfirmasi', icon: Clock, color: 'text-amber-600 bg-amber-100' },
  confirmed: { label: 'Dikonfirmasi', icon: CheckCircle, color: 'text-green-600 bg-green-100' },
  rejected: { label: 'Ditolak', icon: XCircle, color: 'text-red-600 bg-red-100' },
}

export default function QuotaPage() {
  const queryClient = useQueryClient()
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<TopUpPackage | null>(null)
  const [proofFile, setProofFile] = useState<File | null>(null)
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
              Setiap perusahaan mendapat 10 lowongan gratis
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
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lowongan</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody data-testid="payment-history-list">
              {isLoadingPayments ? (
                [...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-32 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center">
                      <CreditCard className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-gray-500">Belum ada riwayat pembayaran</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => {
                  const config = statusConfig[payment.status]
                  const Icon = config.icon
                  return (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <span className="font-medium">{payment.job_title || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{formatCurrency(payment.amount)}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('gap-1 font-normal', config.color)}>
                          <Icon className="w-3 h-3" />
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{formatDate(payment.submitted_at)}</p>
                          {payment.confirmed_at && (
                            <p className="text-xs text-gray-500">
                              Dikonfirmasi: {formatDate(payment.confirmed_at)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {payment.status === 'confirmed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadInvoice(payment.id)}
                            className="gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Invoice
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
