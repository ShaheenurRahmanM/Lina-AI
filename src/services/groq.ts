import { decryptApiKey } from './crypto';
import { Message } from '../types';
import { AI_TOOLS, ToolDefinition } from './tools';
import { executeTool, ToolCall } from './toolExecutor';


// Map deprecated or decommissioned model IDs to current equivalents
const MODEL_ALIASES: Record<string, string> = {
  'llama3-70b-8192': 'llama-3.1-70b-versatile',
  'llama3-8b-8192': 'llama-3.1-8b-instant',
  'llama-3.3-70b-versatile': 'llama-3.1-70b-versatile',
  'llama-3.1-70b-versatile': 'llama-3.1-70b-versatile',
  'llama-3.1-8b-instant': 'llama-3.1-8b-instant',
  'mixtral-8x7b-32768': 'llama-3.1-70b-versatile',
};

// Ordered list of fallback models to try if the primary fails
const FALLBACK_MODELS = [
  'llama-3.1-70b-versatile',
  'llama-3.1-8b-instant',
];

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

  // Resolve model alias
  const activeModel = MODEL_ALIASES[model] ?? model;

  // Format messages for OpenAI-compatible endpoint
  const formattedMessages = messages
    .filter((m) => m.content?.trim())
    .map((m) => ({
      role: m.role as 'system' | 'user' | 'assistant',
      content: m.content.trim(),
    }));

  const modelsToTry = [activeModel, ...FALLBACK_MODELS.filter((m) => m !== activeModel)];

  for (const tryModel of modelsToTry) {
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
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? 2048,
          stream: true,
        }),
        signal: options?.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg = errorData?.error?.message ?? `API error ${response.status}`;
        // If model-related error and we have more to try, continue
        if ((msg.includes('decommissioned') || msg.includes('not found') || response.status === 400) && tryModel !== modelsToTry[modelsToTry.length - 1]) {
          console.warn(`Model ${tryModel} failed, trying next...`);
          continue;
        }
        throw new Error(msg);
      }

      if (!response.body) throw new Error('No response body from Groq API.');

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
              // Ignore malformed SSE chunks
            }
          }
        }
      }

      return; // Success — exit loop
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      const isLastModel = tryModel === modelsToTry[modelsToTry.length - 1];
      if (isLastModel) {
        onError((err as Error).message ?? 'Unable to reach Groq API. Check your API key and internet connection.');
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
  const formattedMessages = messages
    .filter((m) => m.content?.trim())
    .map((m) => ({
      role: m.role as 'system' | 'user' | 'assistant',
      content: m.content.trim(),
    }));

  const modelsToTry = [activeModel, ...FALLBACK_MODELS.filter((m) => m !== activeModel)];
  const tools = options?.enableTools !== false ? (options?.tools ?? AI_TOOLS) : undefined;
  const maxToolIterations = 3;
  let currentMessages = [...formattedMessages];
  let toolIterations = 0;

  while (toolIterations < maxToolIterations) {
    for (const tryModel of modelsToTry) {
      try {
        const requestBody: any = {
          model: tryModel,
          messages: currentMessages,
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? 2048,
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
          const msg = errorData?.error?.message ?? `API error ${response.status}`;
          if ((msg.includes('decommissioned') || msg.includes('not found') || response.status === 400) && tryModel !== modelsToTry[modelsToTry.length - 1]) {
            console.warn(`Model ${tryModel} failed, trying next...`);
            continue;
          }
          throw new Error(msg);
        }

        if (!response.body) throw new Error('No response body from Groq API.');

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let fullResponse = '';
        let toolCalls: ToolCall[] = [];
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

                // Check for tool calls
                const toolCall = parsed.choices?.[0]?.delta?.tool_calls?.[0];
                if (toolCall) {
                  if (!toolCalls[toolCall.index]) {
                    toolCalls[toolCall.index] = {
                      id: toolCall.id || `call_${Date.now()}_${toolCall.index}`,
                      function: { name: '', arguments: '' },
                    };
                  }
                  if (toolCall.function?.name) {
                    toolCalls[toolCall.index].function.name = toolCall.function.name;
                  }
                  if (toolCall.function?.arguments) {
                    toolCalls[toolCall.index].function.arguments += toolCall.function.arguments;
                  }
                }

                finishReason = parsed.choices?.[0]?.finish_reason ?? finishReason;
              } catch {
                // Ignore malformed SSE chunks
              }
            }
          }
        }

        // Handle tool calls if any
        if (finishReason === 'tool_calls' && toolCalls.length > 0) {
          toolIterations++;

          // Add assistant response with tool calls
          currentMessages.push({
            role: 'assistant',
            content: fullResponse,
            tool_calls: toolCalls,
          } as any);

          // Execute tools and add results
          for (const toolCall of toolCalls) {
            try {
              const toolResult = await executeTool(toolCall);
              currentMessages.push({
                role: 'tool',
                content: toolResult.content,
                tool_call_id: toolResult.tool_call_id,
              } as any);
            } catch (error) {
              currentMessages.push({
                role: 'tool',
                content: `Error: ${(error as Error).message}`,
                tool_call_id: toolCall.id,
              } as any);
            }
          }

          // Continue to next iteration for final response
          break;
        }

        return; // Success — exit loop
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        const isLastModel = tryModel === modelsToTry[modelsToTry.length - 1];
        if (isLastModel) {
          onError((err as Error).message ?? 'Unable to reach Groq API. Check your API key and internet connection.');
        }
      }
    }
  }
}
