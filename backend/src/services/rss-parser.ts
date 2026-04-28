const MAX_EPISODES_PER_PODCAST = 25;

export interface Episode {
  id: string;
  title: string;
  description: string;
  audioUrl: string;
  publishDate: string;
  duration?: string;
  thumbnail?: string;
  transcriptUrl?: string;
  transcriptType?: string;
  transcriptLanguage?: string;
  guid?: string;
}

export interface PodcastMetadata {
  title: string;
  description: string;
  author: string;
  imageUrl?: string;
  websiteUrl?: string;
  rssFeedUrl: string;
  language?: string;
  category?: string;
}

export interface ParsedPodcastData {
  metadata: PodcastMetadata;
  episodes: Episode[];
}

async function fetchRSSFeed(rssUrl: string): Promise<string> {
  const response = await fetch(rssUrl, {
    headers: {
      'User-Agent': 'PodcastApp/1.0 (RSS Reader)',
      Accept: 'application/rss+xml, application/xml, text/xml, */*',
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch RSS feed: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

function parseXMLWithRegex(xmlString: string): any {
  const result: any = { channel: {}, items: [] };

  const titleMatch = xmlString.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) result.channel.title = titleMatch[1].trim();

  const descMatch =
    xmlString.match(/<description[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i) ||
    xmlString.match(/<description[^>]*>([\s\S]*?)<\/description>/i) ||
    xmlString.match(/<itunes:summary[^>]*>([^<]+)<\/itunes:summary>/i);
  if (descMatch) result.channel.description = descMatch[1].trim();

  const imageMatch =
    xmlString.match(/<image[^>]*>[\s\S]*?<url[^>]*>([^<]+)<\/url>/i) ||
    xmlString.match(/<itunes:image[^>]*href=["']([^"']+)["']/i);
  if (imageMatch) result.channel.image = imageMatch[1].trim();

  const authorMatch =
    xmlString.match(/<itunes:author[^>]*>([^<]+)<\/itunes:author>/i) ||
    xmlString.match(/<author[^>]*>([^<]+)<\/author>/i) ||
    xmlString.match(/<managingEditor[^>]*>([^<]+)<\/managingEditor>/i);
  if (authorMatch) result.channel.author = authorMatch[1].trim();

  const linkMatch = xmlString.match(/<link[^>]*>([^<]+)<\/link>/i);
  if (linkMatch) result.channel.link = linkMatch[1].trim();

  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let itemMatch;

  while ((itemMatch = itemRegex.exec(xmlString)) !== null && result.items.length < MAX_EPISODES_PER_PODCAST) {
    const itemXml = itemMatch[1];
    const item: any = {};

    const itemTitleMatch =
      itemXml.match(/<title[^>]*><!\[CDATA\[(.*?)\]\]><\/title>/i) ||
      itemXml.match(/<title[^>]*>([^<]+)<\/title>/i) ||
      itemXml.match(/<itunes:title[^>]*>([^<]+)<\/itunes:title>/i);
    if (itemTitleMatch) item.title = itemTitleMatch[1].trim();

    const itemDescMatch =
      itemXml.match(/<description[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i) ||
      itemXml.match(/<description[^>]*>([^<]+)<\/description>/i) ||
      itemXml.match(/<itunes:summary[^>]*>([^<]+)<\/itunes:summary>/i);
    if (itemDescMatch) item.description = itemDescMatch[1].trim();

    const enclosureMatch = itemXml.match(/<enclosure[^>]*url=["']([^"']+)["']/i);
    if (enclosureMatch) item.audioUrl = enclosureMatch[1].trim();

    const pubDateMatch = itemXml.match(/<pubDate[^>]*>([^<]+)<\/pubDate>/i);
    if (pubDateMatch) item.pubDate = pubDateMatch[1].trim();

    const durationMatch = itemXml.match(/<itunes:duration[^>]*>([^<]+)<\/itunes:duration>/i);
    if (durationMatch) item.duration = durationMatch[1].trim();

    const guidMatch = itemXml.match(/<guid[^>]*>([^<]+)<\/guid>/i);
    if (guidMatch) item.guid = guidMatch[1].trim();

    const itemImageMatch = itemXml.match(/<itunes:image[^>]*href=["']([^"']+)["']/i);
    if (itemImageMatch) item.image = itemImageMatch[1].trim();

    const transcriptMatch = itemXml.match(/<(?:podcast:)?transcript\b[^>]*>/i);
    if (transcriptMatch) {
      const tag = transcriptMatch[0];
      const urlMatch = tag.match(/\burl=["']([^"']+)["']/i);
      const typeMatch = tag.match(/\btype=["']([^"']+)["']/i);
      const langMatch = tag.match(/\blanguage=["']([^"']+)["']/i);
      if (urlMatch) item.transcriptUrl = urlMatch[1].trim();
      if (typeMatch) item.transcriptType = typeMatch[1].trim();
      if (langMatch) item.transcriptLanguage = langMatch[1].trim();
    }

    if (item.title && item.audioUrl) {
      result.items.push(item);
    }
  }

  return result;
}

export async function parseRSSFeed(rssUrl: string): Promise<ParsedPodcastData> {
  const xmlString = await fetchRSSFeed(rssUrl);
  const parsed = parseXMLWithRegex(xmlString);

  const metadata: PodcastMetadata = {
    title: parsed.channel?.title || 'Unknown Podcast',
    description: parsed.channel?.description || '',
    author: parsed.channel?.author || 'Unknown Author',
    imageUrl: parsed.channel?.image,
    websiteUrl: parsed.channel?.link,
    rssFeedUrl: rssUrl,
  };

  const episodes: Episode[] = (parsed.items ?? []).map((item: any, index: number) => ({
    id: item.guid || `episode-${index}`,
    title: item.title || 'Untitled Episode',
    description: item.description || '',
    audioUrl: item.audioUrl || '',
    publishDate: item.pubDate || new Date().toISOString(),
    duration: item.duration,
    thumbnail: item.image,
    transcriptUrl: item.transcriptUrl,
    transcriptType: item.transcriptType,
    transcriptLanguage: item.transcriptLanguage,
    guid: item.guid,
  }));

  return { metadata, episodes };
}
