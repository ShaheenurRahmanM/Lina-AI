export type Role = 'user' | 'assistant' | 'system';

export interface UserProfile {
  id: string;
  fullName: string;
  assistantName: string;
  createdAt: number;
}

export interface AppSettings {
  id: string;
  theme: 'dark' | 'light';
  model: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  voiceEnabled: boolean;
  voiceName: string;
  voiceRate: number;
  voicePitch: number;
  voiceVolume: number;
  showWelcome: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
  model: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
}

export interface Message {
  id: string;
  conversationId: string;
  role: Role;
  content: string;
  createdAt: number;
  edited: boolean;
  status: 'sent' | 'pending' | 'error' | 'streaming';
}
