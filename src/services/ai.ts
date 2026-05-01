import { streamGroqResponseWithTools } from './groq';
import { Message } from '../types';

export async function generateAssistantResponse(
  messages: Message[],
  model: string,
  onChunk: (token: string) => void,
  onComplete: () => void,
  onError: (message: string) => void,
  options?: {
    temperature?: number;
    maxTokens?: number;
    signal?: AbortSignal;
    enableTools?: boolean;
  }
) {
  await streamGroqResponseWithTools(messages, model, onChunk, onError, {
    ...options,
    enableTools: options?.enableTools !== false, // Enable tools by default
  });
  onComplete();
}
