import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  MessageCircle,
  Send,
  Plus,
  Search,
  Clock,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  Image as ImageIcon,
  Mic,
  Paperclip,
  XCircle,
  Download,
} from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { chatApi } from '@/api/chat'

const categoryConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  complaint: { label: 'Komplain', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  helpdesk: { label: 'Help Desk', color: 'bg-blue-100 text-blue-700', icon: MessageCircle },
  general: { label: 'Umum', color: 'bg-gray-100 text-gray-700', icon: MessageCircle },
  urgent: { label: 'Urgent', color: 'bg-orange-100 text-orange-700', icon: AlertCircle },
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  open: { label: 'Terbuka', color: 'bg-blue-50 text-blue-700', icon: MessageCircle },
  in_progress: { label: 'Sedang Diproses', color: 'bg-yellow-50 text-yellow-700', icon: Clock },
  resolved: { label: 'Terselesaikan', color: 'bg-green-50 text-green-700', icon: CheckCircle2 },
  closed: { label: 'Ditutup', color: 'bg-gray-50 text-gray-700', icon: X },
}

export default function ChatPage() {
  const queryClient = useQueryClient()
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewConversationDialog, setShowNewConversationDialog] = useState(false)
  const [newConversation, setNewConversation] = useState({
    subject: '',
    category: 'helpdesk' as 'complaint' | 'helpdesk' | 'general' | 'urgent',
  })
  
  // Attachment states
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewURL, setPreviewURL] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch all conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: chatApi.getConversations,
    refetchInterval: 3000, // Auto refresh setiap 3 detik
  })

  // Fetch selected conversation with messages
  const { data: conversationDetail, isLoading: conversationLoading, error: conversationError } = useQuery({
    queryKey: ['conversation', selectedConversationId],
    queryFn: () => chatApi.getConversation(selectedConversationId!),
    enabled: !!selectedConversationId,
    refetchInterval: 2000, // Auto refresh setiap 2 detik
  })

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: chatApi.createConversation,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      setShowNewConversationDialog(false)
      setNewConversation({ subject: '', category: 'helpdesk' })
      setSelectedConversationId(data.id)
      toast.success('Percakapan baru berhasil dibuat')
    },
    onError: (error: any) => {
      console.error('Create conversation error:', error)
      toast.error(error?.response?.data?.message || 'Gagal membuat percakapan baru')
    },
  })

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: ({ conversationId, data }: { conversationId: number; data: any }) =>
      chatApi.sendMessage(conversationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', selectedConversationId] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      setNewMessage('')
      setSelectedFile(null)
      setPreviewURL(null)
      toast.success('Pesan terkirim')
    },
    onError: (error: any) => {
      console.error('Send message error:', error)
      toast.error(error?.response?.data?.message || 'Gagal mengirim pesan')
    },
  })

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversationDetail?.messages])
  
  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (previewURL) {
        URL.revokeObjectURL(previewURL)
      }
    }
  }, [previewURL])

  // Filter conversations
  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.subject.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Check if there's any active conversation (ticketing mode)
  const hasActiveConversation = conversations.some(
    (conv) => conv.status === 'open' || conv.status === 'in_progress'
  )

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validImageTypes.includes(file.type)) {
      toast.error('Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WEBP')
      return
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File terlalu besar. Maksimal 10MB')
      return
    }

    setSelectedFile(file)
    setPreviewURL(URL.createObjectURL(file))
  }

  // Handle voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' })
        const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' })
        setSelectedFile(audioFile)
        stream.getTracks().forEach(track => track.stop())
      }

      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
      setAudioChunks(chunks)
    } catch (error) {
      toast.error('Gagal mengakses mikrofon')
      console.error('Recording error:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      setIsRecording(false)
      setMediaRecorder(null)
    }
  }

  const cancelAttachment = () => {
    setSelectedFile(null)
    if (previewURL) {
      URL.revokeObjectURL(previewURL)
      setPreviewURL(null)
    }
  }

  const handleSendMessage = async () => {
    if (!selectedConversationId) return
    if (!newMessage.trim() && !selectedFile) {
      toast.error('Pesan atau file harus diisi')
      return
    }

    try {
      let messageData: any = { message: newMessage }

      // Upload file if selected
      if (selectedFile) {
        setIsUploading(true)
        const fileType = selectedFile.type.startsWith('image/') ? 'image' : 'audio'
        const uploadResult = await chatApi.uploadAttachment(selectedFile, fileType)
        messageData = {
          message: newMessage || (fileType === 'image' ? '📷 Gambar' : '🎤 Pesan Suara'),
          attachment_url: uploadResult.url,
          attachment_type: uploadResult.type,
          attachment_filename: uploadResult.filename,
        }
        setIsUploading(false)
      }

      sendMessageMutation.mutate({
        conversationId: selectedConversationId,
        data: messageData,
      })
    } catch (error: any) {
      setIsUploading(false)
      toast.error(error?.response?.data?.message || 'Gagal mengunggah file')
    }
  }

  const handleCreateConversation = () => {
    if (!newConversation.subject.trim()) {
      toast.error('Subjek harus diisi')
      return
    }
    createConversationMutation.mutate(newConversation)
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* Conversations List */}
      <Card className="w-96 flex flex-col">
        <CardHeader className="flex-none">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Chat Support</CardTitle>
            <Button 
              size="sm" 
              onClick={() => {
                if (hasActiveConversation) {
                  toast.error('Anda masih memiliki percakapan aktif. Silakan tutup percakapan tersebut terlebih dahulu.')
                } else {
                  setShowNewConversationDialog(true)
                }
              }}
              disabled={hasActiveConversation}
              title={hasActiveConversation ? 'Tutup percakapan aktif terlebih dahulu' : 'Buat percakapan baru'}
            >
              <Plus className="h-4 w-4 mr-1" />
              Baru
            </Button>
          </div>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari percakapan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-0">
          {conversationsLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <MessageCircle className="h-12 w-12 mb-2 opacity-20" />
              <p className="text-sm">Belum ada percakapan</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const categoryInfo = categoryConfig[conv.category]
              const statusInfo = statusConfig[conv.status]
              const CategoryIcon = categoryInfo.icon

              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversationId(conv.id)}
                  className={cn(
                    'p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors',
                    selectedConversationId === conv.id && 'bg-blue-50 border-l-4 border-l-blue-600'
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm line-clamp-1">{conv.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">{conv.subject}</p>
                    </div>
                    {conv.unread_count > 0 && (
                      <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-xs">
                        {conv.unread_count}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {conv.last_message || 'Belum ada pesan'}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      <Badge variant="outline" className={cn('text-xs px-2 py-0', categoryInfo.color)}>
                        <CategoryIcon className="h-3 w-3 mr-1" />
                        {categoryInfo.label}
                      </Badge>
                      <Badge variant="outline" className={cn('text-xs px-2 py-0', statusInfo.color)}>
                        {statusInfo.label}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-400">{formatDate(conv.last_message_at)}</span>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* Chat Messages */}
      <Card className="flex-1 flex flex-col">
        {!selectedConversationId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <MessageCircle className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">Pilih percakapan untuk memulai</p>
            <p className="text-sm">atau buat percakapan baru</p>
          </div>
        ) : conversationLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : conversationError ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-red-500">
              <p className="font-medium">Gagal memuat percakapan</p>
              <p className="text-sm mt-1">{conversationError?.message}</p>
            </div>
          </div>
        ) : conversationDetail ? (
          <>
            {/* Chat Header */}
            <CardHeader className="border-b flex-none">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{conversationDetail.conversation.title}</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">{conversationDetail.conversation.subject}</p>
                </div>
                <div className="flex gap-2 items-start">
                  <Badge
                    variant="outline"
                    className={cn('px-3 py-1', categoryConfig[conversationDetail.conversation.category].color)}
                  >
                    {categoryConfig[conversationDetail.conversation.category].label}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn('px-3 py-1', statusConfig[conversationDetail.conversation.status].color)}
                  >
                    {statusConfig[conversationDetail.conversation.status].label}
                  </Badge>
                  
                  {/* Close Conversation Button */}
                  {(conversationDetail.conversation.status === 'open' || conversationDetail.conversation.status === 'in_progress') && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          await chatApi.closeConversation(conversationDetail.conversation.id)
                          queryClient.invalidateQueries({ queryKey: ['conversations'] })
                          queryClient.invalidateQueries({ queryKey: ['conversation', selectedConversationId] })
                          toast.success('Percakapan berhasil ditutup')
                        } catch (error: any) {
                          toast.error(error?.message || 'Gagal menutup percakapan')
                        }
                      }}
                      className="text-xs"
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      Tutup
                    </Button>
                  )}
                  
                  {/* Download PDF Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      try {
                        await chatApi.downloadConversationPDF(conversationDetail.conversation.id)
                        toast.success('PDF berhasil diunduh')
                      } catch (error: any) {
                        toast.error(error?.message || 'Gagal mengunduh PDF')
                      }
                    }}
                    className="text-xs"
                  >
                    <Download className="h-3.5 w-3.5 mr-1" />
                    PDF
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {(!conversationDetail?.messages || conversationDetail.messages.length === 0) ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <MessageCircle className="h-12 w-12 mb-2 opacity-20" />
                  <p className="text-sm">Belum ada pesan. Kirim pesan pertama Anda!</p>
                </div>
              ) : (
                conversationDetail.messages.map((msg) => {
                  const hasAttachment = msg.attachment_url?.Valid && msg.attachment_url?.String
                  const isImage = msg.attachment_type?.String === 'image'
                  const isAudio = msg.attachment_type?.String === 'audio'
                  
                  // Fix URL: handle both old (/uploads/chat/) and new (/docs/chat/) formats
                  let attachmentURL = ''
                  if (hasAttachment && msg.attachment_url) {
                    const urlString = msg.attachment_url.String || ''
                    // Replace old URL format with new one
                    attachmentURL = urlString.replace('/uploads/chat/', '/docs/chat/')
                    // Ensure it starts with /docs/chat/
                    if (!attachmentURL.startsWith('/docs/') && !attachmentURL.startsWith('http')) {
                      attachmentURL = '/docs/chat/' + attachmentURL.split('/').pop()
                    }
                  }
                  
                  return (
                    <div
                      key={msg.id}
                      className={cn('flex', msg.sender_type === 'company' ? 'justify-end' : 'justify-start')}
                    >
                      <div
                        className={cn(
                          'max-w-[70%] rounded-lg p-3 shadow-sm',
                          msg.sender_type === 'company' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium">{msg.sender_name}</span>
                          <span
                            className={cn(
                              'text-xs',
                              msg.sender_type === 'company' ? 'text-blue-100' : 'text-gray-500'
                            )}
                          >
                            {formatDate(msg.created_at)}
                          </span>
                        </div>
                        
                        {/* Attachment Display */}
                        {hasAttachment && (
                          <div className="mb-2">
                            {isImage && (
                              <img 
                                src={`http://localhost:8081${attachmentURL}`}
                                alt={msg.attachment_filename?.String || 'Image'}
                                className="max-w-full rounded cursor-pointer hover:opacity-90"
                                onClick={() => window.open(`http://localhost:8081${attachmentURL}`, '_blank')}
                              />
                            )}
                            {isAudio && (
                              <audio 
                                controls 
                                className="max-w-full"
                                src={`http://localhost:8081${attachmentURL}`}
                              >
                                Your browser does not support the audio element.
                              </audio>
                            )}
                          </div>
                        )}
                        
                        {msg.message && (
                          <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </CardContent>

            {/* Message Input */}
            <div className="border-t p-4 flex-none">
              {conversationDetail.conversation.status === 'closed' ? (
                <div className="flex items-center justify-center py-3 px-4 bg-gray-50 rounded-lg">
                  <X className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm text-gray-600">Percakapan ini sudah ditutup</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* File Preview */}
                  {selectedFile && (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                      {previewURL && selectedFile.type.startsWith('image/') ? (
                        <img src={previewURL} alt="Preview" className="h-16 w-16 object-cover rounded" />
                      ) : (
                        <div className="flex items-center gap-2">
                          <Mic className="h-4 w-4" />
                          <span className="text-sm">{selectedFile.name}</span>
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={cancelAttachment}
                        className="ml-auto"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  
                  {/* Input Area */}
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading || sendMessageMutation.isPending || isRecording}
                      title="Lampirkan gambar"
                    >
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      type="button"
                      size="icon"
                      variant={isRecording ? "destructive" : "outline"}
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isUploading || sendMessageMutation.isPending}
                      title={isRecording ? "Hentikan rekaman" : "Rekam suara"}
                    >
                      <Mic className="h-4 w-4" />
                    </Button>
                    
                    <Input
                      placeholder={isRecording ? "Merekam..." : "Ketik pesan..."}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      disabled={sendMessageMutation.isPending || isUploading || isRecording}
                      className="flex-1"
                    />
                    
                    <Button
                      onClick={handleSendMessage}
                      disabled={(!newMessage.trim() && !selectedFile) || sendMessageMutation.isPending || isUploading}
                    >
                      {(sendMessageMutation.isPending || isUploading) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Kirim
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : null}
      </Card>

      {/* New Conversation Dialog */}
      <Dialog open={showNewConversationDialog} onOpenChange={setShowNewConversationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Percakapan Baru</DialogTitle>
            <DialogDescription>Buat percakapan baru untuk berkomunikasi dengan tim admin kami</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="subject">Subjek</Label>
              <Input
                id="subject"
                placeholder="Contoh: Tidak bisa posting lowongan"
                value={newConversation.subject}
                onChange={(e) => setNewConversation({ ...newConversation, subject: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="category">Kategori</Label>
              <Select
                value={newConversation.category}
                onValueChange={(value: any) => setNewConversation({ ...newConversation, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="complaint">Komplain</SelectItem>
                  <SelectItem value="helpdesk">Help Desk</SelectItem>
                  <SelectItem value="general">Pertanyaan Umum</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowNewConversationDialog(false)
                setNewConversation({ subject: '', category: 'helpdesk' })
              }}
            >
              Batal
            </Button>
            <Button
              onClick={handleCreateConversation}
              disabled={!newConversation.subject.trim() || createConversationMutation.isPending}
            >
              {createConversationMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Membuat...
                </>
              ) : (
                'Buat Percakapan'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
