import { decryptApiKey } from './crypto';
import { Message } from '../types';
import { AI_TOOLS, ToolDefinition } from './tools';
import { executeTool, ToolCall } from './toolExecutor';

// Map deprecated or decommissioned model IDs to current equivalents
export const MODEL_ALIASES: Record<string, string> = {
  // Deprecated models redirect to currently supported default
  'llama-3.1-70b-versatile': 'llama-3.1-8b-instant',
  'llama-3.3-70b-versatile': 'llama-3.1-8b-instant',
  'llama3-70b-8192': 'llama-3.1-8b-instant',
  'llama3-8b-8192': 'llama-3.1-8b-instant',
  // Supported models map to themselves
  'llama-3.1-8b-instant': 'llama-3.1-8b-instant',
  'mixtral-8x7b-32768': 'mixtral-8x7b-32768',
  'gemma2-9b-it': 'gemma2-9b-it',
};

// Ordered list of fallback models to try if the primary fails
export const FALLBACK_MODELS = [
  'llama-3.1-8b-instant',
];

export const AVAILABLE_MODELS = [
  { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B — Ultra Fast & High Rate Limits' },
  { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B — 32k Context Window' },
  { value: 'gemma2-9b-it', label: 'Gemma 2 9B — Google Compact Model' },
];

/**
 * Estimate tokens for a string (~4 chars per token)
 */
function estimateTokens(text: string): number {
  return Math.ceil((text || '').length / 4);
}

/**
 * Prune conversation messages to fit safely inside the TPM / Context budget.
 * Always retains system prompt and the latest user query.
 * Keeps previous messages up to maxBudget tokens.
 */
function pruneMessagesForContext(messages: any[], maxBudget: number = 3000): any[] {
  if (messages.length <= 2) return messages;

  const systemMessages = messages.filter((m) => m.role === 'system');
  const chatMessages = messages.filter((m) => m.role !== 'system');

  let currentTokens = systemMessages.reduce((sum, m) => sum + estimateTokens(m.content || ''), 0);
  const result: any[] = [];

  // Traverse from the latest message backwards
  for (let i = chatMessages.length - 1; i >= 0; i--) {
    const msg = chatMessages[i];
    const msgTokens = estimateTokens(msg.content || '') + (msg.tool_calls ? 50 : 0);

    // Always include the very last user message
    if (i === chatMessages.length - 1 || currentTokens + msgTokens <= maxBudget) {
      result.unshift(msg);
      currentTokens += msgTokens;
    } else {
      // Reached budget limit, stop adding older messages
      break;
    }
  }

  return [...systemMessages, ...result];
}

/**
 * Format messages for OpenAI / Groq API specs
 */
function formatMessages(messages: Message[]): any[] {
  return messages.map((m) => {
    const formatted: any = {
      role: m.role,
      content: m.content ?? '',
    };
    if (m.tool_call_id) {
      formatted.tool_call_id = m.tool_call_id;
    }
    if (m.tool_calls && m.tool_calls.length > 0) {
      formatted.tool_calls = m.tool_calls;
    }
    return formatted;
  });
}

function parseErrorMessage(status: number, errorData: any): string {
  const msg = errorData?.error?.message || '';
  if (status === 401) {
    return 'Invalid Groq API key. Please check your API key in Settings.';
  }
  if (status === 429 || msg.includes('Rate limit') || msg.includes('rate_limit')) {
    return 'Groq rate limit reached (tokens per minute). Please wait a moment or switch to Llama 3.1 8B Instant.';
  }
  if (msg.includes('decommissioned')) {
    return 'The requested AI model was decommissioned. Retrying with updated model...';
  }
  if (msg) return msg;
  return `Groq API error (${status})`;
}

export async function streamGroqResponse(
  messages: Message[],
  model: string,
  onChunk: (chunk: string) => void,
  onError: (error: string) => void,
  options?: {
    temperature?: number;
    maxTokens?: number;
    signal?: AbortSignal;
  }
) {
  const apiKey = await decryptApiKey();
  if (!apiKey) {
    onError('No API key found. Please add your Groq API key in Settings.');
    return;
  }

  // Resolve model alias to an active model
  const activeModel = MODEL_ALIASES[model] ?? model;
  const modelsToTry = [activeModel, ...FALLBACK_MODELS.filter((m) => m !== activeModel)];

  // Prepare and prune messages to avoid token rate limit overflow
  const rawFormatted = formatMessages(messages);
  const formattedMessages = pruneMessagesForContext(rawFormatted, 3500);

  // Safe max_tokens (default 2048, safe upper bound to preserve TPM)
  const maxTokens = Math.min(Math.max(options?.maxTokens ?? 2048, 256), 4096);

  for (let i = 0; i < modelsToTry.length; i++) {
    const tryModel = modelsToTry[i];
    const isLastModel = i === modelsToTry.length - 1;

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: tryModel,
          messages: formattedMessages,
          temperature: Math.min(Math.max(options?.temperature ?? 0.7, 0), 2),
          max_tokens: maxTokens,
          stream: true,
        }),
        signal: options?.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const rawMsg = errorData?.error?.message ?? '';
        const isRetryable =
          response.status === 429 ||
          response.status === 400 ||
          response.status === 503 ||
          rawMsg.includes('decommissioned') ||
          rawMsg.includes('not found') ||
          rawMsg.includes('rate_limit') ||
          rawMsg.includes('Rate limit');

        if (isRetryable && !isLastModel) {
          console.warn(`Model ${tryModel} failed (${response.status}), retrying with fallback ${modelsToTry[i + 1]}...`);
          continue;
        }

        throw new Error(parseErrorMessage(response.status, errorData));
      }

      if (!response.body) throw new Error('No response stream received from Groq API.');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (trimmed.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(trimmed.slice(6));
              const chunk = parsed.choices?.[0]?.delta?.content ?? '';
              if (chunk) onChunk(chunk);
            } catch {
              // Ignore partial or unparseable SSE chunks
            }
          }
        }
      }

      return; // Success!
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      if (isLastModel) {
        onError((err as Error).message ?? 'Unable to connect to Groq API. Please check your network and API key.');
      }
    }
  }
}

// Enhanced version with tool/function calling support
export async function streamGroqResponseWithTools(
  messages: Message[],
  model: string,
  onChunk: (chunk: string) => void,
  onError: (error: string) => void,
  options?: {
    temperature?: number;
    maxTokens?: number;
    signal?: AbortSignal;
    tools?: ToolDefinition[];
    enableTools?: boolean;
  }
) {
  const apiKey = await decryptApiKey();
  if (!apiKey) {
    onError('No API key found. Please add your Groq API key in Settings.');
    return;
  }

  const activeModel = MODEL_ALIASES[model] ?? model;
  const modelsToTry = [activeModel, ...FALLBACK_MODELS.filter((m) => m !== activeModel)];

  const rawFormatted = formatMessages(messages);
  let currentMessages = pruneMessagesForContext(rawFormatted, 3500);

  const tools = options?.enableTools !== false ? (options?.tools ?? AI_TOOLS) : undefined;
  const maxTokens = Math.min(Math.max(options?.maxTokens ?? 2048, 256), 4096);
  const maxToolIterations = 3;
  let toolIterations = 0;

  while (toolIterations < maxToolIterations) {
    let iterationCompleted = false;

    for (let i = 0; i < modelsToTry.length; i++) {
      const tryModel = modelsToTry[i];
      const isLastModel = i === modelsToTry.length - 1;

      try {
        const requestBody: any = {
          model: tryModel,
          messages: currentMessages,
          temperature: Math.min(Math.max(options?.temperature ?? 0.7, 0), 2),
          max_tokens: maxTokens,
          stream: true,
        };

        if (tools && tools.length > 0) {
          requestBody.tools = tools;
          requestBody.tool_choice = 'auto';
        }

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(requestBody),
          signal: options?.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const rawMsg = errorData?.error?.message ?? '';
          const isRetryable =
            response.status === 429 ||
            response.status === 400 ||
            response.status === 503 ||
            rawMsg.includes('decommissioned') ||
            rawMsg.includes('not found') ||
            rawMsg.includes('rate_limit') ||
            rawMsg.includes('Rate limit');

          if (isRetryable && !isLastModel) {
            console.warn(`Model ${tryModel} failed, trying fallback ${modelsToTry[i + 1]}...`);
            continue;
          }

          throw new Error(parseErrorMessage(response.status, errorData));
        }

        if (!response.body) throw new Error('No response stream received from Groq API.');

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let fullResponse = '';
        const toolCallsMap: Record<number, { id: string; name: string; arguments: string }> = {};
        let finishReason = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === 'data: [DONE]') continue;
            if (trimmed.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(trimmed.slice(6));
                const chunk = parsed.choices?.[0]?.delta?.content ?? '';
                if (chunk) {
                  fullResponse += chunk;
                  onChunk(chunk);
                }

                // Check for tool calls delta
                const deltaToolCalls = parsed.choices?.[0]?.delta?.tool_calls;
                if (Array.isArray(deltaToolCalls)) {
                  for (const tc of deltaToolCalls) {
                    const idx = tc.index ?? 0;
                    if (!toolCallsMap[idx]) {
                      toolCallsMap[idx] = {
                        id: tc.id || `call_${Date.now()}_${idx}`,
                        name: tc.function?.name || '',
                        arguments: tc.function?.arguments || '',
                      };
                    } else {
                      if (tc.id) toolCallsMap[idx].id = tc.id;
                      if (tc.function?.name) toolCallsMap[idx].name += tc.function.name;
                      if (tc.function?.arguments) toolCallsMap[idx].arguments += tc.function.arguments;
                    }
                  }
                }

                finishReason = parsed.choices?.[0]?.finish_reason ?? finishReason;
              } catch {
                // Ignore SSE chunk error
              }
            }
          }
        }

        const toolCallsList: ToolCall[] = Object.values(toolCallsMap).map((tc) => ({
          id: tc.id,
          function: {
            name: tc.name,
            arguments: tc.arguments,
          },
        }));

        // Handle tool calls if any
        if (toolCallsList.length > 0 && finishReason === 'tool_calls') {
          toolIterations++;

          // OpenAI / Groq compliant tool_calls format
          const openAiToolCalls = toolCallsList.map((tc) => ({
            id: tc.id,
            type: 'function' as const,
            function: {
              name: tc.function.name,
              arguments: tc.function.arguments,
            },
          }));

          currentMessages.push({
            role: 'assistant',
            content: fullResponse || '',
            tool_calls: openAiToolCalls,
          });

          // Execute tools and inform user
          for (const toolCall of toolCallsList) {
            try {
              const toolResult = await executeTool(toolCall);
              currentMessages.push({
                role: 'tool',
                content: toolResult.content,
                tool_call_id: toolCall.id,
              });
            } catch (toolErr) {
              currentMessages.push({
                role: 'tool',
                content: `Tool execution failed: ${(toolErr as Error).message}`,
                tool_call_id: toolCall.id,
              });
            }
          }

          iterationCompleted = true;
          break; // Break model loop, proceed to next iteration with tool outputs
        }

        return; // Success without tools or final answer completed!
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        if (isLastModel) {
          onError((err as Error).message ?? 'Unable to connect to Groq API. Please check your settings.');
          return;
        }
      }
    }

    if (!iterationCompleted) {
      break;
    }
  }
}
