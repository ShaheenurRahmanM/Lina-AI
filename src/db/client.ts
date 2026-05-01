import { db } from './schema';
import { AppSettings, Conversation, Message, UserProfile } from '../types';
import { nanoid } from '../utils/format';

const DEFAULT_MODEL = 'llama-3.1-70b-versatile';
const DEFAULT_PROMPT = 'You are Lina AI, an intelligent, helpful, professional and friendly AI assistant. You are concise, accurate, and always aim to provide the most useful response possible.';

const DEFAULT_SETTINGS: AppSettings = {
  id: 'settings',
  theme: 'dark',
  model: DEFAULT_MODEL,
  systemPrompt: DEFAULT_PROMPT,
  temperature: 0.7,
  maxTokens: 4096,
  voiceEnabled: false,
  voiceName: 'default',
  voiceRate: 1,
  voicePitch: 1,
  voiceVolume: 1,
  showWelcome: true,
};

export async function initializeDatabase() {
  if ((await db.settings.count()) === 0) {
    await db.settings.add(DEFAULT_SETTINGS);
  }
}

export async function fetchUserProfile(): Promise<UserProfile | null> {
  const user = await db.users.orderBy('createdAt').first();
  return user ?? null;
}

export async function createUserProfile(fullName: string, assistantName: string) {
  const profile: UserProfile = {
    id: nanoid(),
    fullName,
    assistantName,
    createdAt: Date.now(),
  };
  await db.users.add(profile);
  return profile;
}

export async function getAppSettings(): Promise<AppSettings | null> {
  const settings = await db.settings.get('settings');
  return settings ? ({
    ...DEFAULT_SETTINGS,
    ...settings,
  } as AppSettings) : null;
}

export async function saveAppSettings(settings: Partial<AppSettings>) {
  const existing = await db.settings.get('settings');
  if (existing) {
    await db.settings.put({ ...existing, ...settings });
  } else {
    await db.settings.add({
      ...DEFAULT_SETTINGS,
      ...settings,
    });
  }
}

export async function createConversation(title: string, systemPrompt: string, model: string): Promise<Conversation> {
  const conversation: Conversation = {
    id: nanoid(),
    title,
    pinned: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    model: model || DEFAULT_MODEL,
    systemPrompt: systemPrompt || DEFAULT_PROMPT,
    temperature: 0.7,
    maxTokens: 4096,
  };
  await db.conversations.add(conversation);
  return conversation;
}

export async function updateConversation(conversation: Partial<Conversation> & { id: string }) {
  await db.conversations.update(conversation.id, { ...conversation, updatedAt: Date.now() });
}

export async function deleteConversation(conversationId: string) {
  await db.conversations.delete(conversationId);
  await db.messages.where('conversationId').equals(conversationId).delete();
}

export async function getConversationHistory(conversationId: string) {
  const messages = await db.messages.where('conversationId').equals(conversationId).toArray();
  return messages.sort((a, b) => a.createdAt - b.createdAt);
}

export async function getAllConversations() {
  return db.conversations.orderBy('updatedAt').reverse().toArray();
}

export async function getAllMessages() {
  return db.messages.orderBy('createdAt').toArray();
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
  await db.messages.add(message);
}

export async function updateMessage(message: Partial<Message> & { id: string }) {
  await db.messages.update(message.id, message);
}

export async function deleteAllData() {
  await db.transaction('rw', db.users, db.settings, db.conversations, db.messages, async () => {
    await Promise.all([db.users.clear(), db.settings.clear(), db.conversations.clear(), db.messages.clear()]);
  });
}
