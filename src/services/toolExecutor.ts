// Tool execution service - handles calling tools based on AI requests
import { getWeather } from './weatherService';
import { getNews } from './newsService';

export interface ToolCall {
  id: string;
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

export interface ToolResult {
  tool_call_id: string;
  role: 'tool';
  content: string;
}

export async function executeTool(toolCall: ToolCall): Promise<ToolResult> {
  const { function: func } = toolCall;
  const name = func?.name || 'unknown';

  try {
    let args: Record<string, any> = {};
    if (typeof func?.arguments === 'object' && func.arguments !== null) {
      args = func.arguments;
    } else if (typeof func?.arguments === 'string' && func.arguments.trim()) {
      try {
        args = JSON.parse(func.arguments);
      } catch {
        args = {};
      }
    }

    let result: any;

    switch (name) {
      case 'get_weather': {
        const location = args.location || 'London';
        const units = (args.units || 'celsius') as 'celsius' | 'fahrenheit';
        result = await getWeather(location, units);
        return {
          tool_call_id: toolCall.id,
          role: 'tool',
          content: JSON.stringify(result),
        };
      }

      case 'get_news': {
        const query = args.query || 'technology';
        const category = args.category;
        const limit = Math.min(parseInt(String(args.limit || '5'), 10) || 5, 10);
        result = await getNews(query, category, limit);
        return {
          tool_call_id: toolCall.id,
          role: 'tool',
          content: JSON.stringify(result),
        };
      }

      case 'get_time': {
        const timezone = args.timezone || 'UTC';
        try {
          const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });
          const time = formatter.format(new Date());
          result = { timezone, time, timestamp: new Date().toISOString() };
          return {
            tool_call_id: toolCall.id,
            role: 'tool',
            content: JSON.stringify(result),
          };
        } catch {
          // If timezone is invalid, fallback to local and UTC
          const localTime = new Date().toLocaleString('en-US');
          result = { timezone: 'Local', time: localTime, timestamp: new Date().toISOString() };
          return {
            tool_call_id: toolCall.id,
            role: 'tool',
            content: JSON.stringify(result),
          };
        }
      }

      default:
        return {
          tool_call_id: toolCall.id,
          role: 'tool',
          content: JSON.stringify({ error: `Tool ${name} is not implemented.` }),
        };
    }
  } catch (error) {
    return {
      tool_call_id: toolCall.id,
      role: 'tool',
      content: `Error executing ${name}: ${(error as Error).message}`,
    };
  }
}

export async function executeToolCalls(toolCalls: ToolCall[]): Promise<ToolResult[]> {
  return Promise.all(toolCalls.map(executeTool));
}
