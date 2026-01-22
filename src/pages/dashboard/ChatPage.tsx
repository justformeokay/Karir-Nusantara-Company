import { useState, useRef, useEffect } from 'react'
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
  MessageCircle,
  Send,
  Plus,
  Search,
  Clock,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { toast } from 'sonner'

interface ChatMessage {
  id: number
  sender: 'company' | 'admin'
  senderName: string
  message: string
  timestamp: string
  isRead: boolean
}

interface Conversation {
  id: number
  title: string
  subject: string
  category: 'complaint' | 'helpdesk' | 'general' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  messages: ChatMessage[]
}

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

// Mock data - akan diganti dengan API
const mockConversations: Conversation[] = [
  {
    id: 1,
    title: 'Problem: Invoice Payment',
    subject: 'Invoice tidak diterima di email',
    category: 'helpdesk',
    status: 'in_progress',
    lastMessage: 'Tim admin sedang mengecek data pembayaran Anda...',
    lastMessageTime: '2026-01-22T10:30:00',
    unreadCount: 0,
    messages: [
      {
        id: 1,
        sender: 'company',
        senderName: 'Admin PT Karya',
        message: 'Halo, saya tidak menerima invoice di email setelah pembayaran dikonfirmasi.',
        timestamp: '2026-01-22T09:15:00',
        isRead: true,
      },
      {
        id: 2,
        sender: 'admin',
        senderName: 'Admin Support',
        message: 'Halo! Terima kasih telah menghubungi kami. Kami akan membantu Anda.',
        timestamp: '2026-01-22T09:20:00',
        isRead: true,
      },
      {
        id: 3,
        sender: 'admin',
        senderName: 'Admin Support',
        message: 'Tim admin sedang mengecek data pembayaran Anda...',
        timestamp: '2026-01-22T10:30:00',
        isRead: true,
      },
    ],
  },
  {
    id: 2,
    title: 'Pertanyaan: Cara Membuat Lowongan',
    subject: 'Bagaimana cara membuat lowongan pekerjaan baru?',
    category: 'general',
    status: 'resolved',
    lastMessage: 'Terima kasih, sudah terjawab!',
    lastMessageTime: '2026-01-21T14:45:00',
    unreadCount: 0,
    messages: [
      {
        id: 1,
        sender: 'company',
        senderName: 'Admin PT Karya',
        message: 'Bagaimana cara membuat lowongan pekerjaan baru di platform ini?',
        timestamp: '2026-01-21T13:00:00',
        isRead: true,
      },
      {
        id: 2,
        sender: 'admin',
        senderName: 'Admin Support',
        message: 'Silakan klik menu "Lowongan" > "Buat Lowongan Baru" untuk membuat lowongan.',
        timestamp: '2026-01-21T13:30:00',
        isRead: true,
      },
    ],
  },
  {
    id: 3,
    title: 'Komplain: Bug pada Dashboard',
    subject: 'Fitur pencarian tidak berfungsi',
    category: 'complaint',
    status: 'open',
    lastMessage: 'Fitur pencarian sedang kami perbaiki. Mohon bersabar.',
    lastMessageTime: '2026-01-22T08:00:00',
    unreadCount: 1,
    messages: [
      {
        id: 1,
        sender: 'company',
        senderName: 'Admin PT Karya',
        message: 'Fitur pencarian di dashboard tidak berfungsi dengan baik.',
        timestamp: '2026-01-22T07:30:00',
        isRead: true,
      },
      {
        id: 2,
        sender: 'admin',
        senderName: 'Admin Support',
        message: 'Fitur pencarian sedang kami perbaiki. Mohon bersabar.',
        timestamp: '2026-01-22T08:00:00',
        isRead: false,
      },
    ],
  },
]

export default function ChatPage() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(mockConversations[0])
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations)
  const [searchQuery, setSearchQuery] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [showNewChatDialog, setShowNewChatDialog] = useState(false)
  const [newChatData, setNewChatData] = useState({ subject: '', category: 'general' })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [selectedConversation?.messages])

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.subject.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return

    const updatedConversations = conversations.map((conv) => {
      if (conv.id === selectedConversation.id) {
        const newMsg: ChatMessage = {
          id: conv.messages.length + 1,
          sender: 'company',
          senderName: 'Admin PT Karya',
          message: newMessage,
          timestamp: new Date().toISOString(),
          isRead: true,
        }
        return {
          ...conv,
          messages: [...conv.messages, newMsg],
          lastMessage: newMessage,
          lastMessageTime: new Date().toISOString(),
        }
      }
      return conv
    })

    setConversations(updatedConversations)
    setSelectedConversation(updatedConversations.find((c) => c.id === selectedConversation.id) || null)
    setNewMessage('')
    toast.success('Pesan terkirim!')
  }

  const handleCreateNewChat = () => {
    if (!newChatData.subject.trim()) {
      toast.error('Silakan masukkan judul percakapan')
      return
    }

    const newConversation: Conversation = {
      id: conversations.length + 1,
      title: `${categoryConfig[newChatData.category as keyof typeof categoryConfig].label}: ${newChatData.subject}`,
      subject: newChatData.subject,
      category: (newChatData.category as any) || 'general',
      status: 'open',
      lastMessage: '',
      lastMessageTime: new Date().toISOString(),
      unreadCount: 0,
      messages: [],
    }

    const updatedConversations = [newConversation, ...conversations]
    setConversations(updatedConversations)
    setSelectedConversation(newConversation)
    setShowNewChatDialog(false)
    setNewChatData({ subject: '', category: 'general' })
    toast.success('Percakapan baru dibuat!')
  }

  const CategoryIcon = selectedConversation
    ? categoryConfig[selectedConversation.category].icon
    : MessageCircle
  const categoryLabel = selectedConversation
    ? categoryConfig[selectedConversation.category].label
    : ''
  const StatusIcon = selectedConversation ? statusConfig[selectedConversation.status].icon : MessageCircle
  const statusLabel = selectedConversation ? statusConfig[selectedConversation.status].label : ''

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
      {/* Conversations List */}
      <div className="lg:col-span-1 flex flex-col">
        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Percakapan</CardTitle>
              <Button size="sm" onClick={() => setShowNewChatDialog(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Baru
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden flex flex-col p-0">
            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Cari percakapan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.map((conversation) => {
                const CategoryBadgeIcon =
                  categoryConfig[conversation.category].icon
                return (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
                    className={cn(
                      'p-4 border-b cursor-pointer transition-colors hover:bg-gray-50',
                      selectedConversation?.id === conversation.id && 'bg-blue-50 border-l-4 border-l-blue-500'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <CategoryBadgeIcon className="w-4 h-4 flex-shrink-0" />
                          <h3 className="font-medium text-sm truncate">{conversation.title}</h3>
                          {conversation.unreadCount > 0 && (
                            <Badge className="ml-auto bg-red-500">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {conversation.lastMessage || 'Tidak ada pesan'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(conversation.lastMessageTime)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat Detail */}
      <div className="lg:col-span-2 flex flex-col">
        {selectedConversation ? (
          <Card className="flex flex-col h-full">
            {/* Header */}
            <CardHeader className="pb-4 border-b">
              <div className="space-y-2">
                <h2 className="text-xl font-bold">{selectedConversation.title}</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className={cn('px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1',
                    categoryConfig[selectedConversation.category].color)}>
                    <CategoryIcon className="w-4 h-4" />
                    {categoryLabel}
                  </div>
                  <div className={cn('px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1',
                    statusConfig[selectedConversation.status].color)}>
                    <StatusIcon className="w-4 h-4" />
                    {statusLabel}
                  </div>
                </div>
              </div>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedConversation.messages.map((message) => (
                <div
                  key={message.id}
                  className={cn('flex gap-3', message.sender === 'company' ? 'justify-end' : 'justify-start')}
                >
                  <div className={cn('max-w-xs lg:max-w-md space-y-1')}>
                    {message.sender === 'admin' && (
                      <p className="text-xs font-semibold text-gray-600">{message.senderName}</p>
                    )}
                    <div
                      className={cn(
                        'rounded-lg px-4 py-2 text-sm',
                        message.sender === 'company'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      )}
                    >
                      {message.message}
                    </div>
                    <p className="text-xs text-gray-500">{formatDate(message.timestamp)}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </CardContent>

            {/* Input */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Ketik pesan Anda..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  disabled={selectedConversation.status === 'closed'}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || selectedConversation.status === 'closed'}
                  size="sm"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              {selectedConversation.status === 'closed' && (
                <p className="text-xs text-gray-500 mt-2">Percakapan ini telah ditutup</p>
              )}
            </div>
          </Card>
        ) : (
          <Card className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Pilih percakapan untuk memulai</p>
              <Button onClick={() => setShowNewChatDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Buat Percakapan Baru
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* New Chat Dialog */}
      <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buat Percakapan Baru</DialogTitle>
            <DialogDescription>
              Hubungi admin support untuk complain, pertanyaan, atau bantuan teknis
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Kategori</label>
              <select
                value={newChatData.category}
                onChange={(e) => setNewChatData({ ...newChatData, category: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="general">Umum</option>
                <option value="helpdesk">Help Desk</option>
                <option value="complaint">Komplain</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Judul / Topik</label>
              <Input
                placeholder="Deskripsi singkat tentang topik Anda"
                value={newChatData.subject}
                onChange={(e) => setNewChatData({ ...newChatData, subject: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewChatDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleCreateNewChat}>Buat Percakapan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
