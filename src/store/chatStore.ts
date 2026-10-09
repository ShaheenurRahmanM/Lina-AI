import create from 'zustand';
import { devtools } from 'zustand/middleware';
import { Conversation, Message } from '../types';
import {
  createConversation,
  deleteConversation,
  getAppSettings,
  getConversationHistory,
  updateConversation,
  updateMessage,
  createMessage
} from '../db/client';
import { db } from '../db/schema';
import { nanoid } from '../utils/format';

const DEFAULT_MODEL = 'llama-3.1-8b-instant';

interface ChatState {
  conversations: Conversation[];
  messages: Message[];
  activeConversationId: string | null;
  loading: boolean;
  query: string;
  filteredConversations: Conversation[];
  setQuery: (value: string) => void;
  loadConversations: () => Promise<void>;
  setActiveConversation: (conversationId: string) => Promise<void>;
  addConversation: () => Promise<Conversation>;
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
      try {
        const settings = await getAppSettings();
        let conversations = await db.conversations.orderBy('updatedAt').reverse().toArray();

        // Migrate any old conversations with decommissioned model
        for (const conv of conversations) {
          if (conv.model === 'llama-3.1-70b-versatile') {
            conv.model = DEFAULT_MODEL;
            await db.conversations.update(conv.id, { model: DEFAULT_MODEL }).catch(() => {});
          }
        }

        if (conversations.length === 0) {
          const newConv = await createConversation(
            'New chat',
            settings?.systemPrompt ?? '',
            settings?.model ?? DEFAULT_MODEL
          );
          conversations = [newConv];
        }

        const activeId = conversations[0]?.id ?? null;
        let messages: Message[] = [];
        if (activeId) {
          messages = await getConversationHistory(activeId);
        }

        set({
          conversations,
          messages,
          activeConversationId: activeId,
          loading: false,
          filteredConversations: filterConversations(conversations, get().query),
          query: '',
        });
      } catch (err) {
        console.error('Failed to load conversations:', err);
        set({ loading: false });
      }
    },
    setActiveConversation: async (conversationId: string) => {
      try {
        const messages = await getConversationHistory(conversationId);
        set({ activeConversationId: conversationId, messages });
      } catch (err) {
        console.error('Failed to set active conversation:', err);
      }
    },
    addConversation: async () => {
      const settings = await getAppSettings();
      const conversation = await createConversation(
        'New chat',
        settings?.systemPrompt ?? '',
        settings?.model ?? DEFAULT_MODEL
      );
      const conversations = await db.conversations.orderBy('updatedAt').reverse().toArray();
      set({
        conversations,
        activeConversationId: conversation.id,
        messages: [],
        filteredConversations: filterConversations(conversations, get().query),
      });
      return conversation;
    },
    renameConversation: async (conversationId, title) => {
      const cleanTitle = title.trim() || 'Untitled chat';
      await updateConversation({ id: conversationId, title: cleanTitle });
      const conversations = await db.conversations.orderBy('updatedAt').reverse().toArray();
      set({
        conversations,
        filteredConversations: filterConversations(conversations, get().query),
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
        filteredConversations: filterConversations(conversations, get().query),
      });
    },
    removeConversation: async (conversationId) => {
      await deleteConversation(conversationId);
      const conversations = await db.conversations.orderBy('updatedAt').reverse().toArray();
      let nextActive = conversations[0]?.id ?? null;

      // If user deleted the last conversation, automatically create a fresh one
      if (!nextActive) {
        const settings = await getAppSettings();
        const fresh = await createConversation(
          'New chat',
          settings?.systemPrompt ?? '',
          settings?.model ?? DEFAULT_MODEL
        );
        conversations.push(fresh);
        nextActive = fresh.id;
      }

      let messages: Message[] = [];
      if (nextActive) messages = await getConversationHistory(nextActive);

      set({
        conversations,
        activeConversationId: nextActive,
        messages,
        filteredConversations: filterConversations(conversations, get().query),
      });
    },
    addMessage: async ({ conversationId, role, content }) => {
      const message: Message = {
        id: nanoid(),
        conversationId,
        role,
        content,
        createdAt: Date.now(),
        edited: false,
        status: 'sent',
      };

      await createMessage(message);

      // Auto-title conversation on first user message if title is default
      if (role === 'user') {
        const currentConv = await db.conversations.get(conversationId);
        if (currentConv && (currentConv.title === 'New chat' || currentConv.title === 'New Conversation' || !currentConv.title)) {
          const autoTitle = content.trim().slice(0, 36) + (content.length > 36 ? '…' : '');
          await updateConversation({ id: conversationId, title: autoTitle, updatedAt: Date.now() });
        } else {
          await updateConversation({ id: conversationId, updatedAt: Date.now() });
        }
      } else {
        await updateConversation({ id: conversationId, updatedAt: Date.now() });
      }

      const messages = await getConversationHistory(conversationId);
      const conversations = await db.conversations.orderBy('updatedAt').reverse().toArray();

      set({ messages, conversations, filteredConversations: filterConversations(conversations, get().query) });
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
      // Create one fresh default conversation
      const settings = await getAppSettings();
      const fresh = await createConversation('New chat', settings?.systemPrompt ?? '', settings?.model ?? DEFAULT_MODEL);
      set({
        conversations: [fresh],
        activeConversationId: fresh.id,
        messages: [],
        filteredConversations: [fresh],
      });
    },
  }))
);
