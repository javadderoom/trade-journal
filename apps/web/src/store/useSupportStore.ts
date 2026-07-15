import { create } from 'zustand';
import { api } from '../lib/api';

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  attachments: string[];
  read_at: string | null;
  created_at: string;
}

export interface ConversationActivity {
  id: string;
  conversation_id: string;
  actor_id: string;
  action: string;
  details: any;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  subject: string;
  status: 'OPEN' | 'WAITING' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  category: string;
  assigned_admin_id: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  closed_at: string | null;
  messages?: ConversationMessage[];
  activities?: ConversationActivity[];
  user?: { id: string; name: string | null; email: string; plan: string };
  _count?: { messages: number };
}

export interface SupportStats {
  open: number;
  waiting: number;
  resolved: number;
  closed: number;
  total: number;
}

interface SupportState {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: ConversationMessage[];
  stats: SupportStats | null;
  loading: boolean;
  sending: boolean;

  fetchConversations: (status?: string) => Promise<void>;
  fetchConversation: (id: string) => Promise<void>;
  createConversation: (subject: string, category: string, body: string) => Promise<Conversation>;
  sendMessage: (conversationId: string, body: string, attachments?: File[]) => Promise<void>;
  closeConversation: (id: string) => Promise<void>;

  adminFetchConversations: (filters?: Record<string, string>) => Promise<void>;
  adminFetchStats: () => Promise<void>;
  adminFetchConversation: (id: string) => Promise<void>;
  adminReply: (conversationId: string, body: string, attachments?: File[]) => Promise<void>;
  adminAssign: (conversationId: string, adminId: string | null) => Promise<void>;
  adminChangeStatus: (conversationId: string, status: string) => Promise<void>;
  adminChangePriority: (conversationId: string, priority: string) => Promise<void>;
}

export const useSupportStore = create<SupportState>((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  stats: null,
  loading: false,
  sending: false,

  fetchConversations: async (status?: string) => {
    set({ loading: true });
    try {
      const params = status ? `?status=${status}` : '';
      const res = await api.get(`/api/support/conversations${params}`);
      set({ conversations: res.data, loading: false });
    } catch (err) {
      set({ loading: false });
    }
  },

  fetchConversation: async (id: string) => {
    try {
      const res = await api.get(`/api/support/conversations/${id}`);
      set({ activeConversation: res.data, messages: res.data.messages || [] });
    } catch (err) {
      console.error('Failed to fetch conversation:', err);
    }
  },

  createConversation: async (subject: string, category: string, body: string) => {
    const res = await api.post('/api/support/conversations', { subject, category, body });
    const conv = res.data;
    set((state) => ({ conversations: [conv, ...state.conversations] }));
    return conv;
  },

  sendMessage: async (conversationId: string, body: string, attachments?: File[]) => {
    set({ sending: true });
    try {
      const formData = new FormData();
      if (body) formData.append('body', body);
      attachments?.forEach((f) => formData.append('attachments', f));

      const res = await api.post(`/api/support/conversations/${conversationId}/messages`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      set((state) => ({
        messages: [...state.messages, res.data],
        sending: false,
      }));
    } catch (err) {
      set({ sending: false });
      throw err;
    }
  },

  closeConversation: async (id: string) => {
    await api.patch(`/api/support/conversations/${id}/close`);
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, status: 'CLOSED' as const } : c
      ),
      activeConversation: state.activeConversation?.id === id
        ? { ...state.activeConversation, status: 'CLOSED' as const }
        : state.activeConversation,
    }));
  },

  // ─── Admin actions ──────────────────────────────────────────────────────────

  adminFetchConversations: async (filters?: Record<string, string>) => {
    set({ loading: true });
    try {
      const params = new URLSearchParams(filters || {}).toString();
      const res = await api.get(`/api/admin/support/conversations${params ? `?${params}` : ''}`);
      set({ conversations: res.data, loading: false });
    } catch (err) {
      set({ loading: false });
    }
  },

  adminFetchStats: async () => {
    try {
      const res = await api.get('/api/admin/support/stats');
      set({ stats: res.data });
    } catch (err) {
      console.error('Failed to fetch support stats:', err);
    }
  },

  adminFetchConversation: async (id: string) => {
    try {
      const res = await api.get(`/api/admin/support/conversations/${id}`);
      set({ activeConversation: res.data, messages: res.data.messages || [] });
    } catch (err) {
      console.error('Failed to fetch conversation:', err);
    }
  },

  adminReply: async (conversationId: string, body: string, attachments?: File[]) => {
    set({ sending: true });
    try {
      const formData = new FormData();
      if (body) formData.append('body', body);
      attachments?.forEach((f) => formData.append('attachments', f));

      const res = await api.post(
        `/api/admin/support/conversations/${conversationId}/messages`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      set((state) => ({
        messages: [...state.messages, res.data],
        sending: false,
      }));
    } catch (err) {
      set({ sending: false });
      throw err;
    }
  },

  adminAssign: async (conversationId: string, adminId: string | null) => {
    await api.patch(`/api/admin/support/conversations/${conversationId}/assign`, {
      admin_id: adminId,
    });
    set((state) => ({
      activeConversation: state.activeConversation?.id === conversationId
        ? { ...state.activeConversation, assigned_admin_id: adminId }
        : state.activeConversation,
    }));
  },

  adminChangeStatus: async (conversationId: string, status: string) => {
    await api.patch(`/api/admin/support/conversations/${conversationId}/status`, { status });
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, status: status as any } : c
      ),
      activeConversation: state.activeConversation?.id === conversationId
        ? { ...state.activeConversation, status: status as any }
        : state.activeConversation,
    }));
  },

  adminChangePriority: async (conversationId: string, priority: string) => {
    await api.patch(`/api/admin/support/conversations/${conversationId}/priority`, { priority });
    set((state) => ({
      activeConversation: state.activeConversation?.id === conversationId
        ? { ...state.activeConversation, priority: priority as any }
        : state.activeConversation,
    }));
  },
}));
