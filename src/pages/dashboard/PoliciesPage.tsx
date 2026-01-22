import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ChevronDown,
  FileText,
  BookOpen,
  Mail,
  Phone,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { policiesApi } from '@/api/policies'

interface PolicySection {
  title: string
  icon: React.ElementType
  content: string
}

interface FAQItem {
  question: string
  answer: string
  category: string
}

const policySections: PolicySection[] = [
  {
    title: 'Kebijakan Penggunaan Platform',
    icon: FileText,
    content: `Karir Nusantara adalah platform perekrutan yang dirancang untuk membantu perusahaan menemukan talenta terbaik. Dengan menggunakan platform ini, Anda setuju untuk:

• Memberikan informasi yang akurat dan lengkap tentang perusahaan Anda
• Tidak melakukan aktivitas yang melanggar hukum atau etika bisnis
• Menghormati privasi data calon karyawan
• Tidak menggunakan platform untuk tujuan yang merugikan atau ilegal
• Mematuhi semua peraturan dan kebijakan yang berlaku di platform

Pelanggaran terhadap kebijakan ini dapat mengakibatkan penghentian akun dan tindakan hukum lebih lanjut.`,
  },
  {
    title: 'Kebijakan Privasi & Data',
    icon: FileText,
    content: `Kami berkomitmen melindungi privasi dan keamanan data Anda:

• Semua data perusahaan dan calon karyawan dienkripsi dan disimpan dengan aman
• Data hanya digunakan untuk keperluan perekrutan dan pelayanan platform
• Kami tidak membagikan data dengan pihak ketiga tanpa izin eksplisit
• Anda memiliki hak untuk mengakses, mengubah, atau menghapus data Anda
• Kami menggunakan SSL/TLS untuk semua transmisi data
• Audit keamanan dilakukan secara berkala

Untuk informasi lebih detail, silakan baca Kebijakan Privasi lengkap kami.`,
  },
  {
    title: 'Kebijakan Pembayaran & Refund',
    icon: FileText,
    content: `Pembayaran di platform Karir Nusantara bersifat final. Berikut adalah kebijakan kami:

• Harga kuota lowongan pekerjaan adalah Rp 10.000 per lowongan
• Pembayaran dapat dilakukan melalui transfer bank ke rekening yang tersedia
• Invoice otomatis akan dikirim ke email Anda setelah pembayaran dikonfirmasi
• Gratis 1 lowongan pertama kali untuk setiap perusahaan baru
• Tidak ada biaya pembatalan langganan - Anda bebas kapan saja
• Bonus kuota diberikan untuk pembelian paket top-up
• Refund hanya dapat dilakukan jika ada kesalahan pembayaran dari sistem kami

Untuk klaim refund, silakan hubungi tim support kami.`,
  },
  {
    title: 'Kebijakan Lowongan Pekerjaan',
    icon: BookOpen,
    content: `Standar untuk membuat lowongan pekerjaan di platform kami:

• Lowongan harus berisikan deskripsi pekerjaan yang jelas dan detail
• Salary range harus transparan dan kompetitif
• Tidak boleh melakukan diskriminasi berdasarkan usia, gender, suku, agama, atau status sosial
• Lowongan tidak boleh mengandung konten yang melanggar hukum
• Tim kami berhak menolak atau menghapus lowongan yang tidak sesuai kebijakan
• Lowongan yang dibuat otomatis aktif dan dapat diakses oleh calon karyawan
• Anda dapat mengedit atau menonaktifkan lowongan kapan saja

Pelanggaran kebijakan lowongan pekerjaan dapat mengakibatkan penghapusan lowongan dan sanksi akun.`,
  },
  {
    title: 'Kebijakan Komunikasi & Customer Support',
    icon: Mail,
    content: `Kami menyediakan berbagai channel komunikasi untuk membantu Anda:

• Chat Support: Tersedia di dashboard untuk pertanyaan umum dan bantuan teknis
• Email Support: admin@karirnusantara.com untuk pertanyaan formal
• Response Time: Tim support kami berusaha merespons dalam 24 jam
• Jam Kerja: Senin - Jumat, 09:00 - 17:00 WIB (tidak termasuk hari libur nasional)
• Priority Support: Komplain urgent akan ditangani lebih prioritas
• Feedback: Kami menerima saran untuk peningkatan platform

Anda juga bisa mengunjungi Help Center untuk FAQ dan panduan lengkap.`,
  },
  {
    title: 'Kebijakan Penghentian Akun',
    icon: AlertCircle,
    content: `Akun dapat dihentikan dalam kondisi berikut:

• Pelanggaran berulang terhadap kebijakan platform
• Aktivitas mencurigakan atau fraud
• Tidak ada aktivitas selama 12 bulan berturut-turut
• Atas permintaan pengguna sendiri

Jika akun Anda dihentikan:
• Semua data lowongan yang aktif akan dihapus
• Calon karyawan tidak akan bisa lagi menemukan lowongan Anda
• Data pembayaran disimpan untuk keperluan administrasi (sesuai hukum)
• Anda dapat mengajukan banding dalam 30 hari

Untuk menghubungi tim support tentang penghentian akun, silakan gunakan fitur chat support.`,
  },
]

const faqItems: FAQItem[] = [
  {
    question: 'Berapa biaya untuk membuat lowongan di Karir Nusantara?',
    category: 'Pembayaran',
    answer:
      'Setiap lowongan pekerjaan dikenakan biaya Rp 10.000. Anda mendapatkan 1 lowongan gratis untuk pertama kali. Paket top-up juga tersedia dengan harga yang lebih ekonomis.',
  },
  {
    question: 'Bagaimana cara membayar kuota lowongan?',
    category: 'Pembayaran',
    answer:
      'Anda dapat melakukan transfer bank ke rekening yang tersedia di menu Pembayaran > Info Pembayaran. Setelah transfer, silakan upload bukti pembayaran untuk verifikasi oleh admin kami.',
  },
  {
    question: 'Berapa lama admin memverifikasi pembayaran saya?',
    category: 'Pembayaran',
    answer:
      'Biasanya verifikasi pembayaran dilakukan dalam 1-2 jam jam kerja. Anda akan menerima email notifikasi saat pembayaran dikonfirmasi beserta invoice PDF.',
  },
  {
    question: 'Bagaimana cara membuat lowongan pekerjaan baru?',
    category: 'Lowongan Pekerjaan',
    answer:
      'Klik menu "Lowongan" > "Buat Lowongan Baru" di dashboard. Isi form dengan detail pekerjaan seperti posisi, deskripsi, requirements, dan salary range. Setelah submit, lowongan akan langsung aktif dan dapat diakses oleh calon karyawan.',
  },
  {
    question: 'Bisakah saya mengedit lowongan yang sudah dipublikasikan?',
    category: 'Lowongan Pekerjaan',
    answer:
      'Ya, Anda dapat mengedit lowongan kapan saja melalui menu Lowongan > Kelola Lowongan. Perubahan akan berlaku secara real-time. Anda juga dapat menonaktifkan atau menghapus lowongan jika diperlukan.',
  },
  {
    question: 'Apa itu kuota lowongan? Bagaimana cara meningkatkannya?',
    category: 'Lowongan Pekerjaan',
    answer:
      'Kuota lowongan menunjukkan berapa banyak lowongan yang dapat Anda posting. Kuota dapat ditingkatkan dengan membeli paket top-up di menu Pembayaran > Paket Top-up. Bonus kuota juga diberikan untuk pembelian paket tertentu.',
  },
  {
    question: 'Bagaimana cara melihat calon karyawan yang melamar?',
    category: 'Kandidat',
    answer:
      'Semua lamaran masuk akan ditampilkan di menu "Kandidat" atau detail lowongan. Anda dapat melihat CV, profile, dan riwayat lamaran calon karyawan. Anda juga bisa memberikan feedback atau mengundang untuk interview.',
  },
  {
    question: 'Bagaimana cara menghubungi support jika ada masalah?',
    category: 'Support',
    answer:
      'Anda dapat menghubungi tim support melalui fitur Chat Support di dashboard. Silakan jelaskan masalah Anda dan kategori yang sesuai (Complaint, Help Desk, atau Urgent). Tim support kami siap membantu dalam 24 jam.',
  },
  {
    question: 'Apakah ada jaminan keamanan data perusahaan saya?',
    category: 'Keamanan',
    answer:
      'Ya, semua data perusahaan dan calon karyawan dienkripsi dan disimpan dengan aman menggunakan standar keamanan internasional. Kami melakukan audit keamanan secara berkala dan mematuhi regulasi perlindungan data.',
  },
  {
    question: 'Bisakah saya mengekspor data lowongan dan lamaran?',
    category: 'Data',
    answer:
      'Fitur export data sedang dalam pengembangan. Untuk sementara, Anda dapat melihat semua informasi di dashboard dan mengambil screenshot jika diperlukan. Hubungi support untuk kebutuhan export data khusus.',
  },
]

export default function PoliciesPage() {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)
  const faqCategories = Array.from(new Set(faqItems.map((item) => item.category)))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Kebijakan & Bantuan</h1>
        <p className="text-gray-600">
          Pelajari kebijakan platform Karir Nusantara dan dapatkan jawaban atas pertanyaan umum Anda
        </p>
      </div>

      {/* Contact Support Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex gap-3">
              <Mail className="w-6 h-6 text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-sm mb-1">Email Support</h3>
                <p className="text-sm text-gray-600">admin@karirnusantara.com</p>
              </div>
            </div>
            <div className="flex gap-3">
              <MessageCircle className="w-6 h-6 text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-sm mb-1">Chat Support</h3>
                <p className="text-sm text-gray-600">Tersedia di Dashboard</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Phone className="w-6 h-6 text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-sm mb-1">Jam Support</h3>
                <p className="text-sm text-gray-600">Senin - Jumat, 09:00 - 17:00 WIB</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="policies" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="policies">Kebijakan Platform</TabsTrigger>
          <TabsTrigger value="faq">Tanya Jawab</TabsTrigger>
        </TabsList>

        {/* Policies Tab */}
        <TabsContent value="policies" className="space-y-4 mt-6">
          {policySections.map((section, index) => {
            const Icon = section.icon
            return (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <Icon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                    {section.content}
                  </p>
                </CardContent>
              </Card>
            )
          })}

          {/* Download Policies */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-600" />
                Download Dokumen Lengkap
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Unduh versi PDF lengkap dari semua kebijakan platform kami:
              </p>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-between"
                  onClick={async () => {
                    try {
                      await policiesApi.downloadPrivacyPolicyPDF()
                      toast.success('Kebijakan Privasi berhasil diunduh!')
                    } catch (error: any) {
                      toast.error(error?.message || 'Gagal mengunduh Kebijakan Privasi')
                    }
                  }}
                >
                  Kebijakan Privasi Lengkap (PDF)
                  <ExternalLink className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-between"
                  onClick={async () => {
                    try {
                      await policiesApi.downloadTermsOfServicePDF()
                      toast.success('Terms of Service berhasil diunduh!')
                    } catch (error: any) {
                      toast.error(error?.message || 'Gagal mengunduh Terms of Service')
                    }
                  }}
                >
                  Terms of Service Lengkap (PDF)
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FAQ Tab */}
        <TabsContent value="faq" className="space-y-6 mt-6">
          {/* FAQ By Category */}
          {faqCategories.map((category) => {
            const categoryFAQs = faqItems.filter((item) => item.category === category)
            return (
              <div key={category}>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-blue-600" />
                  {category}
                </h3>

                <div className="space-y-3">
                  {categoryFAQs.map((faq, index) => {
                    const faqIndex = faqItems.indexOf(faq)
                    const isExpanded = expandedFAQ === faqIndex

                    return (
                      <Card
                        key={index}
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => setExpandedFAQ(isExpanded ? null : faqIndex)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start gap-3">
                            <ChevronDown
                              className={cn(
                                'w-5 h-5 text-gray-600 flex-shrink-0 mt-1 transition-transform',
                                isExpanded && 'transform rotate-180'
                              )}
                            />
                            <h4 className="font-semibold text-sm leading-relaxed flex-1">
                              {faq.question}
                            </h4>
                          </div>
                        </CardHeader>

                        {isExpanded && (
                          <CardContent className="pb-4 ml-8">
                            <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                          </CardContent>
                        )}
                      </Card>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Still Need Help */}
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex gap-4 items-start">
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">Masih butuh bantuan?</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Tim support kami siap membantu Anda melalui fitur Chat Support yang tersedia di
                    dashboard.
                  </p>
                  <Button size="sm" onClick={() => (window.location.href = '/dashboard/chat')}>
                    Hubungi Support <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Chat icon untuk import
function MessageCircle(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}
