import { useMemo, useRef } from 'react';
import { generateAssistantResponse } from '../services/ai';
import { Message } from '../types';

export function useGroqStream() {
  const abortControllerRef = useRef<AbortController | null>(null);

  const streamResponse = useMemo(
    () => async (
      messages: Message[],
      model: string,
      onChunk: (chunk: string) => void,
      onError: (message: string) => void = () => undefined,
      options?: { temperature?: number; maxTokens?: number }
    ) => {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;
      return generateAssistantResponse(messages, model, onChunk, () => {}, onError, { ...options, signal: controller.signal });
    },
    []
  );

  const abort = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
  };

  return { streamResponse, abort };
}
