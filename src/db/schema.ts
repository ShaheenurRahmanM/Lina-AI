import Dexie, { Table } from 'dexie';
import { AppSettings, Conversation, Message, UserProfile } from '../types';

export class LinaAiDB extends Dexie {
  users!: Table<UserProfile, string>;
  settings!: Table<AppSettings, string>;
  conversations!: Table<Conversation, string>;
  messages!: Table<Message, string>;

  constructor() {
    super('LinaAiDB');
    this.version(1).stores({
      users: 'id, fullName, assistantName, createdAt',
      settings: 'id, theme, model, voiceEnabled, voiceName, voiceRate, voicePitch, voiceVolume, showWelcome',
      conversations: 'id, title, pinned, updatedAt',
      messages: 'id, conversationId, role, createdAt'
    });
  }
}

export const db = new LinaAiDB();
