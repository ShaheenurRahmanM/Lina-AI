import create from 'zustand';
import { devtools } from 'zustand/middleware';
import { Conversation, Message } from '../types';
import {
  createConversation,
  deleteConversation,
  getAppSettings,
  getConversationHistory,
  saveAppSettings,
  updateConversation,
  updateMessage,
  createMessage
} from '../db/client';
import { db } from '../db/schema';
import { nanoid } from '../utils/format';

interface ChatState {
  conversations: Conversation[];
  messages: Message[];
  activeConversationId: string | null;
  loading: boolean;
  query: string;
  filteredConversations: Conversation[];
  setQuery: (value: string) => void;
  loadConversations: () => Promise<void>;
  setActiveConversation: (conversationId: string) => void;
  addConversation: () => Promise<void>;
  renameConversation: (conversationId: string, title: string) => Promise<void>;
  togglePin: (conversationId: string) => Promise<void>;
  removeConversation: (conversationId: string) => Promise<void>;
  addMessage: (message: Omit<Message, 'id' | 'status' | 'createdAt' | 'edited'>) => Promise<Message>;
  updateMessageContent: (messageId: string, content: string) => Promise<void>;
  refreshMessages: () => Promise<void>;
  clearAllConversations: () => Promise<void>;
}

const filterConversations = (conversations: Conversation[], query: string) => {
  const lowered = query.toLowerCase().trim();
  return lowered
    ? conversations.filter((conversation) => conversation.title.toLowerCase().includes(lowered))
    : conversations;
};

export const useChatStore = create<ChatState>()(
  devtools((set, get) => ({
    conversations: [],
    messages: [],
    activeConversationId: null,
    loading: true,
    query: '',
    filteredConversations: [],
    setQuery: (value) => {
      const lowered = value.toLowerCase().trim();
      const filtered = lowered
        ? get().conversations.filter((conversation) => conversation.title.toLowerCase().includes(lowered))
        : get().conversations;
      set({ query: value, filteredConversations: filtered });
    },
    loadConversations: async () => {
      const settings = await getAppSettings();
      const conversations = await db.conversations.orderBy('updatedAt').reverse().toArray();
      const activeConversationId = conversations[0]?.id ?? null;
      let messages: Message[] = [];
      if (activeConversationId) {
        messages = await getConversationHistory(activeConversationId);
      }
      set({
        conversations,
        messages,
        activeConversationId,
        loading: false,
        filteredConversations: filterConversations(conversations, get().query),
        query: ''
      });
      if (!activeConversationId) {
        const conversation = await createConversation('New chat', settings?.systemPrompt ?? '', settings?.model ?? 'llama-3.1-70b-versatile');
        const conversationsAfter = [conversation];
        set({
          conversations: conversationsAfter,
          activeConversationId: conversation.id,
          filteredConversations: filterConversations(conversationsAfter, get().query)
        });
      }
    },
    setActiveConversation: async (conversationId) => {
      const messages = await getConversationHistory(conversationId);
      set({ activeConversationId: conversationId, messages });
    },
    addConversation: async () => {
      const settings = await getAppSettings();
      const conversation = await createConversation('New chat', settings?.systemPrompt ?? '', settings?.model ?? 'llama-3.3-70b-versatile');
      const conversations = await db.conversations.orderBy('updatedAt').reverse().toArray();
      set({
        conversations,
        activeConversationId: conversation.id,
        messages: [],
        filteredConversations: filterConversations(conversations, get().query)
      });
    },
    renameConversation: async (conversationId, title) => {
      await updateConversation({ id: conversationId, title });
      const conversations = await db.conversations.orderBy('updatedAt').reverse().toArray();
      set({
        conversations,
        filteredConversations: filterConversations(conversations, get().query)
      });
    },
    togglePin: async (conversationId) => {
      const conversation = await db.conversations.get(conversationId);
      if (conversation) {
        await updateConversation({ id: conversationId, pinned: !conversation.pinned });
      }
      const conversations = await db.conversations.orderBy('updatedAt').reverse().toArray();
      set({
        conversations,
        filteredConversations: filterConversations(conversations, get().query)
      });
    },
    removeConversation: async (conversationId) => {
      await deleteConversation(conversationId);
      const conversations = await db.conversations.orderBy('updatedAt').reverse().toArray();
      const nextActive = conversations[0]?.id ?? null;
      let messages: Message[] = [];
      if (nextActive) messages = await getConversationHistory(nextActive);
      set({
        conversations,
        activeConversationId: nextActive,
        messages,
        filteredConversations: filterConversations(conversations, get().query)
      });
    },
    addMessage: async ({ conversationId, role, content }) => {
      const message = {
        id: nanoid(),
        conversationId,
        role,
        content,
        createdAt: Date.now(),
        edited: false,
        status: 'pending' as const
      };
      await createMessage(message);
      await updateConversation({ id: conversationId, updatedAt: Date.now() });
      const messages = await getConversationHistory(conversationId);
      set({ messages, conversations: await db.conversations.orderBy('updatedAt').reverse().toArray() });
      return message;
    },
    updateMessageContent: async (messageId, content) => {
      await updateMessage({ id: messageId, content, edited: true });
      const activeConversationId = get().activeConversationId;
      if (activeConversationId) {
        const messages = await getConversationHistory(activeConversationId);
        set({ messages });
      }
    },
    refreshMessages: async () => {
      const activeConversationId = get().activeConversationId;
      if (activeConversationId) {
        const messages = await getConversationHistory(activeConversationId);
        set({ messages });
      }
    },
    clearAllConversations: async () => {
      await db.conversations.clear();
      await db.messages.clear();
      set({ conversations: [], activeConversationId: null, messages: [] });
    }
  }))
);
