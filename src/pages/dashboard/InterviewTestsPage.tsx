import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Plus, Trash2, Edit, Upload, Copy, Clock, Target, BookOpen,
  ChevronDown, ChevronUp, CheckCircle2, FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  interviewTestsApi,
  type InterviewTest,
  type CreateInterviewTestRequest,
  type CreateQuestionRequest,
  type CreateQuestionOptionRequest,
} from '@/api/interview-tests'

// ─── Status helpers ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: InterviewTest['status'] }) {
  const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    draft: { label: 'Draft', variant: 'secondary' },
    active: { label: 'Aktif', variant: 'default' },
    archived: { label: 'Diarsipkan', variant: 'outline' },
  }
  const { label, variant } = map[status] ?? { label: status, variant: 'outline' }
  return <Badge variant={variant}>{label}</Badge>
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <FileText className="w-12 h-12 text-gray-300 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-1">Belum ada tes</h3>
      <p className="text-sm text-gray-500 mb-6">Buat tes wawancara pertama Anda untuk menyeleksi kandidat</p>
      <Button onClick={onAdd}>
        <Plus className="w-4 h-4 mr-2" />
        Buat Tes Baru
      </Button>
    </div>
  )
}

// ─── Default form values ──────────────────────────────────────────────────────

function defaultOption(): CreateQuestionOptionRequest {
  return { option_text: '', is_correct: false }
}

function defaultQuestion(): CreateQuestionRequest {
  return {
    question_text: '',
    question_type: 'multiple_choice',
    points: 10,
    difficulty: 'medium',
    explanation: '',
    options: [defaultOption(), defaultOption(), defaultOption(), defaultOption()],
  }
}

function defaultForm(): CreateInterviewTestRequest {
  return {
    title: '',
    description: '',
    duration_minutes: 30,
    passing_score: 70,
    shuffle_questions: false,
    show_results_immediately: true,
    questions: [defaultQuestion()],
  }
}

function testToForm(test: InterviewTest): CreateInterviewTestRequest {
  return {
    title: test.title,
    description: test.description,
    duration_minutes: test.duration_minutes,
    passing_score: test.passing_score,
    shuffle_questions: test.shuffle_questions,
    show_results_immediately: test.show_results_immediately,
    questions: (test.questions ?? []).map(q => ({
      question_text: q.question_text,
      question_type: q.question_type,
      points: q.points,
      difficulty: q.difficulty,
      explanation: q.explanation ?? '',
      options: q.options?.map(o => ({ option_text: o.option_text, is_correct: o.is_correct })) ?? [],
    })),
  }
}

// ─── Question Form ────────────────────────────────────────────────────────────

function QuestionForm({
  index,
  question,
  onChange,
  onRemove,
}: {
  index: number
  question: CreateQuestionRequest
  onChange: (q: CreateQuestionRequest) => void
  onRemove: () => void
}) {
  const [expanded, setExpanded] = useState(true)

  const updateOption = (i: number, field: keyof CreateQuestionOptionRequest, value: string | boolean) => {
    const newOptions = [...(question.options ?? [])]
    newOptions[i] = { ...newOptions[i], [field]: value }
    // Only one correct answer for simplicity
    if (field === 'is_correct' && value === true) {
      newOptions.forEach((o, idx) => { if (idx !== i) o.is_correct = false })
    }
    onChange({ ...question, options: newOptions })
  }

  const addOption = () => {
    onChange({ ...question, options: [...(question.options ?? []), defaultOption()] })
  }

  const removeOption = (i: number) => {
    const newOptions = (question.options ?? []).filter((_, idx) => idx !== i)
    onChange({ ...question, options: newOptions })
  }

  return (
    <Card className="border border-gray-200">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Soal #{index + 1}
            {question.question_text && (
              <span className="text-gray-400 font-normal truncate max-w-[200px]">
                — {question.question_text}
              </span>
            )}
          </button>
          <Button type="button" variant="ghost" size="sm" onClick={onRemove} className="text-red-500 hover:text-red-700 hover:bg-red-50">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 pb-4 px-4 space-y-4">
          <div>
            <Label className="text-xs">Teks Soal</Label>
            <Textarea
              value={question.question_text}
              onChange={e => onChange({ ...question, question_text: e.target.value })}
              placeholder="Masukkan teks soal..."
              rows={2}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Tipe</Label>
              <Select
                value={question.question_type}
                onValueChange={v => onChange({ ...question, question_type: v as 'multiple_choice' | 'essay', options: v === 'multiple_choice' ? (question.options?.length ? question.options : [defaultOption(), defaultOption()]) : [] })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiple_choice">Pilihan Ganda</SelectItem>
                  <SelectItem value="essay">Essay</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Kesulitan</Label>
              <Select value={question.difficulty} onValueChange={v => onChange({ ...question, difficulty: v as any })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Mudah</SelectItem>
                  <SelectItem value="medium">Sedang</SelectItem>
                  <SelectItem value="hard">Sulit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Poin</Label>
              <Input
                type="number"
                min={1}
                value={question.points}
                onChange={e => onChange({ ...question, points: parseInt(e.target.value) || 0 })}
                className="mt-1"
              />
            </div>
          </div>

          {question.question_type === 'multiple_choice' && (
            <div className="space-y-2">
              <Label className="text-xs">Pilihan Jawaban</Label>
              {(question.options ?? []).map((option, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateOption(i, 'is_correct', true)}
                    className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      option.is_correct
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-gray-300 hover:border-green-400'
                    }`}
                    title="Tandai sebagai jawaban benar"
                  >
                    {option.is_correct && <CheckCircle2 className="w-3 h-3" />}
                  </button>
                  <Input
                    value={option.option_text}
                    onChange={e => updateOption(i, 'option_text', e.target.value)}
                    placeholder={`Pilihan ${String.fromCharCode(65 + i)}`}
                    className="flex-1"
                  />
                  {(question.options?.length ?? 0) > 2 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeOption(i)} className="shrink-0 text-red-400 hover:text-red-600 hover:bg-red-50 px-2">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              {(question.options?.length ?? 0) < 6 && (
                <Button type="button" variant="outline" size="sm" onClick={addOption} className="mt-1">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Pilihan
                </Button>
              )}
            </div>
          )}

          <div>
            <Label className="text-xs">Penjelasan (opsional)</Label>
            <Textarea
              value={question.explanation ?? ''}
              onChange={e => onChange({ ...question, explanation: e.target.value })}
              placeholder="Penjelasan jawaban yang benar..."
              rows={2}
              className="mt-1"
            />
          </div>
        </CardContent>
      )}
    </Card>
  )
}

// ─── Test Form Dialog ─────────────────────────────────────────────────────────

function TestFormDialog({
  open,
  onClose,
  editingTest,
  onSuccess,
}: {
  open: boolean
  onClose: () => void
  editingTest: InterviewTest | null
  onSuccess: () => void
}) {
  const [form, setForm] = useState<CreateInterviewTestRequest>(() =>
    editingTest ? testToForm(editingTest) : defaultForm()
  )
  const [submitting, setSubmitting] = useState(false)

  // Reset form when dialog opens
  useState(() => {
    if (open) {
      setForm(editingTest ? testToForm(editingTest) : defaultForm())
    }
  })

  const updateQuestion = (index: number, q: CreateQuestionRequest) => {
    const qs = [...form.questions]
    qs[index] = q
    setForm({ ...form, questions: qs })
  }

  const addQuestion = () => {
    setForm({ ...form, questions: [...form.questions, defaultQuestion()] })
  }

  const removeQuestion = (index: number) => {
    setForm({ ...form, questions: form.questions.filter((_, i) => i !== index) })
  }

  const handleSubmit = async () => {
    if (!form.title.trim()) { toast.error('Judul tes wajib diisi'); return }
    if (!form.description.trim()) { toast.error('Deskripsi tes wajib diisi'); return }
    if (form.duration_minutes < 1) { toast.error('Durasi harus lebih dari 0 menit'); return }
    if (form.questions.length === 0) { toast.error('Tambahkan minimal satu soal'); return }

    for (let i = 0; i < form.questions.length; i++) {
      const q = form.questions[i]
      if (!q.question_text.trim()) { toast.error(`Soal #${i + 1}: teks soal wajib diisi`); return }
      if (q.question_type === 'multiple_choice') {
        const opts = q.options ?? []
        if (opts.length < 2) { toast.error(`Soal #${i + 1}: tambahkan minimal 2 pilihan`); return }
        if (opts.some(o => !o.option_text.trim())) { toast.error(`Soal #${i + 1}: semua teks pilihan wajib diisi`); return }
        if (!opts.some(o => o.is_correct)) { toast.error(`Soal #${i + 1}: pilih jawaban yang benar`); return }
      }
    }

    setSubmitting(true)
    try {
      if (editingTest) {
        await interviewTestsApi.update(editingTest.id, form)
        toast.success('Tes berhasil diperbarui')
      } else {
        await interviewTestsApi.create(form)
        toast.success('Tes berhasil dibuat')
      }
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err.message ?? 'Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingTest ? 'Edit Tes' : 'Buat Tes Baru'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Test info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Informasi Tes</h3>
            <div>
              <Label>Judul Tes <span className="text-red-500">*</span></Label>
              <Input
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="Contoh: Tes Kemampuan Frontend Developer"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Deskripsi <span className="text-red-500">*</span></Label>
              <Textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Jelaskan tujuan dan konten tes ini..."
                rows={3}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Durasi (menit)</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.duration_minutes}
                  onChange={e => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Nilai Lulus (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={form.passing_score}
                  onChange={e => setForm({ ...form, passing_score: parseInt(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-semibold text-gray-700">
                Soal ({form.questions.length})
              </h3>
              <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                <Plus className="w-4 h-4 mr-1" /> Tambah Soal
              </Button>
            </div>

            {form.questions.map((q, i) => (
              <QuestionForm
                key={i}
                index={i}
                question={q}
                onChange={q => updateQuestion(i, q)}
                onRemove={() => removeQuestion(i)}
              />
            ))}

            {form.questions.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">
                Belum ada soal. Klik "Tambah Soal" untuk mulai.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Batal</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Menyimpan...' : editingTest ? 'Simpan Perubahan' : 'Buat Tes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── My Tests Tab ─────────────────────────────────────────────────────────────

function MyTestsTab() {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editingTest, setEditingTest] = useState<InterviewTest | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['company-interview-tests'],
    queryFn: () => interviewTestsApi.getMyTests(),
  })

  const tests: InterviewTest[] = data?.data ?? []

  const publishMutation = useMutation({
    mutationFn: (id: number) => interviewTestsApi.publish(id),
    onSuccess: () => {
      toast.success('Tes berhasil dipublikasikan')
      queryClient.invalidateQueries({ queryKey: ['company-interview-tests'] })
    },
    onError: (err: any) => toast.error(err.message ?? 'Gagal mempublikasikan tes'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => interviewTestsApi.delete(id),
    onSuccess: () => {
      toast.success('Tes berhasil dihapus')
      queryClient.invalidateQueries({ queryKey: ['company-interview-tests'] })
      setDeleteId(null)
    },
    onError: (err: any) => toast.error(err.message ?? 'Gagal menghapus tes'),
  })

  const handleEdit = (test: InterviewTest) => {
    setEditingTest(test)
    setFormOpen(true)
  }

  const handleNewTest = () => {
    setEditingTest(null)
    setFormOpen(true)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-28 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-medium text-gray-700">
          {tests.length} tes ditemukan
        </h2>
        <Button onClick={handleNewTest}>
          <Plus className="w-4 h-4 mr-2" />
          Buat Tes Baru
        </Button>
      </div>

      {tests.length === 0 ? (
        <EmptyState onAdd={handleNewTest} />
      ) : (
        <div className="space-y-4">
          {tests.map(test => (
            <Card key={test.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-gray-900 truncate">{test.title}</h3>
                      <StatusBadge status={test.status} />
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">{test.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {test.duration_minutes} menit
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        {test.questions?.length ?? 0} soal
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="w-3.5 h-3.5" />
                        Lulus: {test.passing_score}%
                      </span>
                      <span className="font-medium text-gray-700">
                        {test.total_points} poin
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {test.status === 'draft' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-300 hover:bg-green-50"
                        onClick={() => publishMutation.mutate(test.id)}
                        disabled={publishMutation.isPending}
                      >
                        <Upload className="w-3.5 h-3.5 mr-1" />
                        Publikasikan
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => handleEdit(test)}>
                      <Edit className="w-3.5 h-3.5 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-500 border-red-200 hover:bg-red-50"
                      onClick={() => setDeleteId(test.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      {formOpen && (
        <TestFormDialog
          open={formOpen}
          onClose={() => { setFormOpen(false); setEditingTest(null) }}
          editingTest={editingTest}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['company-interview-tests'] })}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={o => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Tes</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus tes ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ─── Library Tab ──────────────────────────────────────────────────────────────

function LibraryTab() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-interview-tests-library'],
    queryFn: () => interviewTestsApi.getLibrary(),
  })

  const tests: InterviewTest[] = data?.data ?? []

  const copyMutation = useMutation({
    mutationFn: (id: number) => interviewTestsApi.copyFromAdmin(id),
    onSuccess: () => {
      toast.success('Tes berhasil disalin ke koleksi Anda')
      queryClient.invalidateQueries({ queryKey: ['company-interview-tests'] })
    },
    onError: (err: any) => toast.error(err.message ?? 'Gagal menyalin tes'),
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-28 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (tests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <BookOpen className="w-12 h-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">Perpustakaan kosong</h3>
        <p className="text-sm text-gray-500">Admin belum menambahkan tes publik</p>
      </div>
    )
  }

  return (
    <>
      <p className="text-sm text-gray-500 mb-6">
        Salin tes dari admin untuk langsung digunakan atau dikustomisasi sesuai kebutuhan Anda.
      </p>
      <div className="space-y-4">
        {tests.map(test => (
          <Card key={test.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-gray-900 truncate">{test.title}</h3>
                    <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                      Admin
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{test.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {test.duration_minutes} menit
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      {test.questions?.length ?? 0} soal
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="w-3.5 h-3.5" />
                      Lulus: {test.passing_score}%
                    </span>
                    <span className="font-medium text-gray-700">
                      {test.total_points} poin
                    </span>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 text-blue-600 border-blue-300 hover:bg-blue-50"
                  onClick={() => copyMutation.mutate(test.id)}
                  disabled={copyMutation.isPending && copyMutation.variables === test.id}
                >
                  <Copy className="w-3.5 h-3.5 mr-1" />
                  Salin
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InterviewTestsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tes Wawancara</h1>
        <p className="text-sm text-gray-500 mt-1">
          Kelola tes wawancara untuk menyeleksi kandidat secara objektif
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="my-tests">
        <TabsList>
          <TabsTrigger value="my-tests">Tes Saya</TabsTrigger>
          <TabsTrigger value="library">Library Admin</TabsTrigger>
        </TabsList>

        <TabsContent value="my-tests" className="mt-6">
          <MyTestsTab />
        </TabsContent>

        <TabsContent value="library" className="mt-6">
          <LibraryTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
