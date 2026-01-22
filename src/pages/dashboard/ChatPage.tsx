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
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
    mutationFn: ({ conversationId, message }: { conversationId: number; message: string }) =>
      chatApi.sendMessage(conversationId, { message }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', selectedConversationId] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      setNewMessage('')
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

  // Filter conversations
  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.subject.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversationId) return
    sendMessageMutation.mutate({
      conversationId: selectedConversationId,
      message: newMessage,
    })
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
            <Button size="sm" onClick={() => setShowNewConversationDialog(true)}>
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
                <div>
                  <CardTitle className="text-lg">{conversationDetail.conversation.title}</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">{conversationDetail.conversation.subject}</p>
                </div>
                <div className="flex gap-2">
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
                conversationDetail.messages.map((msg) => (
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
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  </div>
                ))
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
                <div className="flex gap-2">
                  <Input
                    placeholder="Ketik pesan..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    disabled={sendMessageMutation.isPending}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  >
                    {sendMessageMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Kirim
                      </>
                    )}
                  </Button>
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
