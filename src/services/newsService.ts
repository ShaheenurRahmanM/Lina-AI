// News service with resilient fallback
export interface NewsArticle {
  title: string;
  description: string;
  source: string;
  url: string;
  publishedAt: string;
  image?: string;
}

export interface NewsResult {
  category: string;
  query: string;
  articles: NewsArticle[];
  total: number;
}

function safeFetch(url: string, timeoutMs: number = 5000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

export async function getNews(
  query: string,
  category?: string,
  limit: number = 5
): Promise<NewsResult> {
  const cleanQuery = (query || 'top stories').trim();
  const articlesData: NewsArticle[] = [];

  try {
    // Try public RSS/JSON feed aggregator if available
    const feedUrl = `https://api.spaceflightnewsapi.net/v4/articles/?search=${encodeURIComponent(cleanQuery)}&limit=${Math.min(limit, 5)}`;
    const res = await safeFetch(feedUrl).catch(() => null);

    if (res && res.ok) {
      const data = await res.json().catch(() => null);
      if (data && Array.isArray(data.results) && data.results.length > 0) {
        data.results.forEach((item: any) => {
          articlesData.push({
            title: item.title,
            description: item.summary || 'Summary unavailable',
            source: item.news_site || 'Spaceflight News',
            url: item.url,
            publishedAt: new Date(item.published_at).toLocaleDateString(),
            image: item.image_url,
          });
        });
      }
    }
  } catch {
    // Fall back to clean response
  }

  if (articlesData.length === 0) {
    return {
      category: category || 'general',
      query: cleanQuery,
      articles: [
        {
          title: `Current Developments on "${cleanQuery}"`,
          description: `Live headlines and discussions for "${cleanQuery}" across science, tech, and global media.`,
          source: 'Lina News Digest',
          url: `https://news.google.com/search?q=${encodeURIComponent(cleanQuery)}`,
          publishedAt: new Date().toLocaleDateString(),
        },
      ],
      total: 1,
    };
  }

  return {
    category: category || 'general',
    query: cleanQuery,
    articles: articlesData.slice(0, limit),
    total: articlesData.length,
  };
}
