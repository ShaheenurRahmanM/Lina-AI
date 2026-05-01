// Tool definitions for AI function calling
export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, {
        type: string;
        description: string;
        enum?: string[];
      }>;
      required: string[];
    };
  };
}

export const AI_TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get current weather information for a location. Returns temperature, conditions, humidity, wind speed, and other weather details.',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'City name, coordinates, or zip code (e.g., "London", "New York", "-33.8,-151.2")',
          },
          units: {
            type: 'string',
            description: 'Temperature units',
            enum: ['celsius', 'fahrenheit'],
          },
        },
        required: ['location'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_news',
      description: 'Get latest news articles on a specific topic or category. Returns headlines, descriptions, and source information.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search topic or keyword (e.g., "technology", "climate", "sports")',
          },
          category: {
            type: 'string',
            description: 'News category',
            enum: ['business', 'entertainment', 'health', 'science', 'sports', 'technology', 'general'],
          },
          limit: {
            type: 'string',
            description: 'Number of articles to return (1-10)',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_time',
      description: 'Get current time and date for a specific timezone or location.',
      parameters: {
        type: 'object',
        properties: {
          timezone: {
            type: 'string',
            description: 'Timezone in IANA format (e.g., "America/New_York", "Europe/London", "Asia/Tokyo")',
          },
        },
        required: ['timezone'],
      },
    },
  },
];
