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
  const name = func.name;

  try {
    let args: Record<string, any>;
    try {
      args = JSON.parse(func.arguments);
    } catch {
      args = func.arguments as unknown as Record<string, any>;
    }

    let result: any;

    switch (name) {
      case 'get_weather': {
        const location = args.location;
        const units = (args.units || 'celsius') as 'celsius' | 'fahrenheit';
        result = await getWeather(location, units);
        return {
          tool_call_id: toolCall.id,
          role: 'tool',
          content: JSON.stringify(result),
        };
      }

      case 'get_news': {
        const query = args.query;
        const category = args.category;
        const limit = Math.min(parseInt(args.limit || '5'), 10);
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
          throw new Error(`Invalid timezone: ${timezone}`);
        }
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
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
