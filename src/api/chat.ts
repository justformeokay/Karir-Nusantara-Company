import { api } from './client';

export interface Conversation {
  id: number;
  company_id: number;
  title: string;
  subject: string;
  category: 'complaint' | 'helpdesk' | 'general' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
  closed_at?: {
    Time: string;
    Valid: boolean;
  };
  company_name: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

export interface ChatMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_type: 'company' | 'admin';
  message: string;
  attachment_url?: { String: string; Valid: boolean } | null;
  attachment_type?: { String: string; Valid: boolean } | null;
  attachment_filename?: { String: string; Valid: boolean } | null;
  is_read: boolean;
  created_at: string;
  sender_name: string;
  sender_email: string;
}

export interface ConversationDetail {
  conversation: Conversation;
  messages: ChatMessage[];
}

export interface CreateConversationRequest {
  subject: string;
  category: 'complaint' | 'helpdesk' | 'general' | 'urgent';
}

export interface SendMessageRequest {
  message: string;
  attachment_url?: string;
  attachment_type?: string;
  attachment_filename?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const chatApi = {
  // Get all conversations for logged in company
  getConversations: async (): Promise<Conversation[]> => {
    const response = await api.get<ApiResponse<Conversation[]>>('/company/chat/conversations');
    return response.data;
  },

  // Create a new conversation
  createConversation: async (data: CreateConversationRequest): Promise<Conversation> => {
    const response = await api.post<ApiResponse<Conversation>>('/company/chat/conversations', data);
    return response.data;
  },

  // Get a specific conversation with messages
  getConversation: async (id: number): Promise<ConversationDetail> => {
    const response = await api.get<ApiResponse<ConversationDetail>>(`/company/chat/conversations/${id}`);
    return {
      ...response.data,
      messages: response.data.messages || [],
    };
  },

  // Send a message in a conversation
  sendMessage: async (conversationId: number, data: SendMessageRequest): Promise<ChatMessage> => {
    const response = await api.post<ApiResponse<ChatMessage>>(
      `/company/chat/conversations/${conversationId}/messages`,
      data
    );
    return response.data;
  },

  // Upload attachment (image or audio)
  uploadAttachment: async (file: File, type: 'image' | 'audio'): Promise<{ url: string; type: string; filename: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    
    const response = await api.upload<ApiResponse<{ url: string; type: string; filename: string }>>(
      '/company/chat/upload',
      formData
    );
    return response.data;
  },
};

export default chatApi;
