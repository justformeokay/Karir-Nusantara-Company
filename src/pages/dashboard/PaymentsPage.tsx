import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Download, CreditCard, CheckCircle, Clock, XCircle } from 'lucide-react'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { quotaApi } from '@/api/quota'
import type { PaymentStatus } from '@/types'
import { toast } from 'sonner'

const statusConfig: Record<PaymentStatus, { label: string; icon: React.ElementType; color: string }> = {
  pending: { label: 'Menunggu Konfirmasi', icon: Clock, color: 'text-amber-600 bg-amber-100' },
  confirmed: { label: 'Dikonfirmasi', icon: CheckCircle, color: 'text-green-600 bg-green-100' },
  rejected: { label: 'Ditolak', icon: XCircle, color: 'text-red-600 bg-red-100' },
}

export default function PaymentsPage() {
  // Fetch payment history
  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: () => quotaApi.getPaymentHistory(),
  })

  const payments = paymentsData?.data || []

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Pembayaran</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {payments.length}</div>
            <p className="text-xs text-gray-500 mt-1">Total transaksi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Dikonfirmasi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {payments.filter((p) => p.status === 'confirmed').length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Pembayaran sukses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Menunggu Konfirmasi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {payments.filter((p) => p.status === 'pending').length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Sedang diverifikasi</p>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pembayaran</CardTitle>
          <CardDescription>
            Lihat semua transaksi pembayaran kuota lowongan kerja Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Pembayaran</TableHead>
                  <TableHead>Lowongan</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanggal Pembayaran</TableHead>
                  <TableHead>Tanggal Konfirmasi</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-12" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-24 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-20 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
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
                        <TableCell className="font-medium">#{payment.id}</TableCell>
                        <TableCell>{payment.job_title || '-'}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
                        <TableCell>
                          <Badge className={cn('gap-1 font-normal', config.color)}>
                            <Icon className="w-3 h-3" />
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(payment.submitted_at)}</TableCell>
                        <TableCell className="text-sm">
                          {payment.confirmed_at ? formatDate(payment.confirmed_at) : '-'}
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
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-900">
            <strong>💡 Tip:</strong> Anda dapat mendownload invoice untuk pembayaran yang sudah dikonfirmasi.
            Invoice akan dikirim otomatis ke email Anda juga.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
