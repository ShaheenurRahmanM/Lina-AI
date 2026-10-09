import { db } from './schema';
import { AppSettings, Conversation, Message, UserProfile } from '../types';
import { nanoid } from '../utils/format';

const DEFAULT_MODEL = 'llama-3.1-8b-instant';
const DEFAULT_PROMPT = 'You are Lina AI, an intelligent, helpful, professional and friendly AI assistant. You are concise, accurate, and always aim to provide the most useful response possible.';

const DEFAULT_SETTINGS: AppSettings = {
  id: 'settings',
  theme: 'dark',
  model: DEFAULT_MODEL,
  systemPrompt: DEFAULT_PROMPT,
  temperature: 0.7,
  maxTokens: 2048,
  voiceEnabled: false,
  voiceName: 'default',
  voiceRate: 1,
  voicePitch: 1,
  voiceVolume: 1,
  showWelcome: true,
};

export async function initializeDatabase() {
  try {
    const count = await db.settings.count();
    if (count === 0) {
      await db.settings.add(DEFAULT_SETTINGS);
    } else {
      // Auto-migrate any decommissioned model in existing settings
      const existing = await db.settings.get('settings');
      if (existing && (existing.model === 'llama-3.1-70b-versatile' || !existing.model)) {
        await db.settings.update('settings', { model: DEFAULT_MODEL });
      }
    }
  } catch (error) {
    console.warn('Database initialization warning:', error);
  }
}

export async function fetchUserProfile(): Promise<UserProfile | null> {
  try {
    const user = await db.users.orderBy('createdAt').first();
    return user ?? null;
  } catch (error) {
    console.warn('Failed to fetch user profile:', error);
    return null;
  }
}

export async function createUserProfile(fullName: string, assistantName: string) {
  const profile: UserProfile = {
    id: nanoid(),
    fullName: fullName.trim() || 'User',
    assistantName: assistantName.trim() || 'Lina AI',
    createdAt: Date.now(),
  };
  try {
    await db.users.add(profile);
  } catch (error) {
    console.warn('Failed to add user profile to DB:', error);
  }
  return profile;
}

export async function getAppSettings(): Promise<AppSettings | null> {
  try {
    const settings = await db.settings.get('settings');
    if (!settings) return DEFAULT_SETTINGS;

    // Migrate decommissioned model
    if (settings.model === 'llama-3.1-70b-versatile') {
      settings.model = DEFAULT_MODEL;
      await db.settings.update('settings', { model: DEFAULT_MODEL }).catch(() => {});
    }

    return {
      ...DEFAULT_SETTINGS,
      ...settings,
    } as AppSettings;
  } catch (error) {
    console.warn('Failed to get app settings:', error);
    return DEFAULT_SETTINGS;
  }
}

export async function saveAppSettings(settings: Partial<AppSettings>) {
  try {
    const existing = await db.settings.get('settings');
    const modelToSave =
      settings.model === 'llama-3.1-70b-versatile' ? DEFAULT_MODEL : (settings.model ?? existing?.model ?? DEFAULT_MODEL);

    if (existing) {
      await db.settings.put({
        ...existing,
        ...settings,
        model: modelToSave,
      });
    } else {
      await db.settings.add({
        ...DEFAULT_SETTINGS,
        ...settings,
        model: modelToSave,
      });
    }
  } catch (error) {
    console.error('Failed to save app settings:', error);
  }
}

export async function createConversation(title: string, systemPrompt: string, model: string): Promise<Conversation> {
  const resolvedModel =
    !model || model === 'llama-3.1-70b-versatile' ? DEFAULT_MODEL : model;

  const conversation: Conversation = {
    id: nanoid(),
    title: title.trim() || 'New chat',
    pinned: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    model: resolvedModel,
    systemPrompt: systemPrompt || DEFAULT_PROMPT,
    temperature: 0.7,
    maxTokens: 2048,
  };

  try {
    await db.conversations.add(conversation);
  } catch (error) {
    console.error('Failed to create conversation in DB:', error);
  }
  return conversation;
}

export async function updateConversation(conversation: Partial<Conversation> & { id: string }) {
  try {
    await db.conversations.update(conversation.id, { ...conversation, updatedAt: Date.now() });
  } catch (error) {
    console.error('Failed to update conversation:', error);
  }
}

export async function deleteConversation(conversationId: string) {
  try {
    await db.conversations.delete(conversationId);
    await db.messages.where('conversationId').equals(conversationId).delete();
  } catch (error) {
    console.error('Failed to delete conversation:', error);
  }
}

export async function getConversationHistory(conversationId: string) {
  try {
    const messages = await db.messages.where('conversationId').equals(conversationId).toArray();
    return messages.sort((a, b) => a.createdAt - b.createdAt);
  } catch (error) {
    console.error('Failed to get conversation history:', error);
    return [];
  }
}

export async function getAllConversations() {
  try {
    return await db.conversations.orderBy('updatedAt').reverse().toArray();
  } catch (error) {
    console.error('Failed to get all conversations:', error);
    return [];
  }
}

export async function getAllMessages() {
  try {
    return await db.messages.orderBy('createdAt').toArray();
  } catch (error) {
    console.error('Failed to get all messages:', error);
    return [];
  }
}

export async function importData(payload: {
  conversations?: Conversation[];
  messages?: Message[];
  settings?: Partial<AppSettings>;
  user?: UserProfile;
}) {
  await db.transaction('rw', db.conversations, db.messages, db.settings, db.users, async () => {
    if (payload.conversations?.length) await db.conversations.bulkPut(payload.conversations);
    if (payload.messages?.length) await db.messages.bulkPut(payload.messages);
    if (payload.settings) await saveAppSettings(payload.settings);
    if (payload.user) {
      const existing = await db.users.get(payload.user.id);
      if (!existing) await db.users.add(payload.user);
    }
  });
}

export async function createMessage(message: Message) {
  try {
    await db.messages.add(message);
  } catch (error) {
    console.error('Failed to create message in DB:', error);
  }
}

export async function updateMessage(message: Partial<Message> & { id: string }) {
  try {
    await db.messages.update(message.id, message);
  } catch (error) {
    console.error('Failed to update message:', error);
  }
}

export async function deleteAllData() {
  try {
    await db.transaction('rw', db.users, db.settings, db.conversations, db.messages, async () => {
      await Promise.all([db.users.clear(), db.settings.clear(), db.conversations.clear(), db.messages.clear()]);
    });
  } catch (error) {
    console.error('Failed to clear database data:', error);
  }
}
