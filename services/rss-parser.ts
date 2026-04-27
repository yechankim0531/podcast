/**
 * RSS Parser Service
 * 
 * This is a pure TypeScript service that can be used in:
 * - React Native (frontend)
 * - Node.js backend
 * - Any JavaScript/TypeScript environment
 * 
 * It contains NO React dependencies, making it backend-ready.
 */

import type { ParsedPodcastData, Episode, PodcastMetadata } from '@/types/podcast';

const MAX_EPISODES_PER_PODCAST = 25;

/**
 * Fetches RSS feed XML from a URL
 * Works in both React Native and Node.js environments
 */
async function fetchRSSFeed(rssUrl: string): Promise<string> {
  try {
    const response = await fetch(rssUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.status} ${response.statusText}`);
    }
    const xmlText = await response.text();
    return xmlText;
  } catch (error) {
    throw new Error(`Error fetching RSS feed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parses XML string into a simple structure
 * Basic XML parser - can be enhanced with a library like fast-xml-parser
 * 
 * NOTE: DOMParser doesn't work in React Native, so we use regex parsing.
 * For production backend, you could use: fast-xml-parser, xmldom, or node-xml2js
 */
function parseXML(xmlString: string): any {
  // For React Native compatibility, we use regex parsing
  // This works in both frontend and backend environments
  try {
    return parseXMLWithRegex(xmlString);
  } catch (error) {
    throw new Error(`Failed to parse XML: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Simple regex-based XML parser for React Native compatibility
 * Extracts key RSS feed elements
 */
function parseXMLWithRegex(xmlString: string): any {
  const result: any = {
    channel: {},
    items: [],
  };

  // Extract channel title
  const titleMatch = xmlString.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) result.channel.title = titleMatch[1].trim();

  // Extract channel description (handle CDATA and plain text)
  const descMatch = xmlString.match(/<description[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i) ||
                    xmlString.match(/<description[^>]*>([\s\S]*?)<\/description>/i) ||
                    xmlString.match(/<itunes:summary[^>]*>([^<]+)<\/itunes:summary>/i);
  if (descMatch) result.channel.description = descMatch[1].trim();

  // Extract channel image/artwork
  const imageMatch = xmlString.match(/<image[^>]*>[\s\S]*?<url[^>]*>([^<]+)<\/url>/i) ||
                     xmlString.match(/<itunes:image[^>]*href=["']([^"']+)["']/i);
  if (imageMatch) result.channel.image = imageMatch[1].trim();

  // Extract channel author
  const authorMatch = xmlString.match(/<itunes:author[^>]*>([^<]+)<\/itunes:author>/i) ||
                      xmlString.match(/<author[^>]*>([^<]+)<\/author>/i) ||
                      xmlString.match(/<managingEditor[^>]*>([^<]+)<\/managingEditor>/i);
  if (authorMatch) result.channel.author = authorMatch[1].trim();

  // Extract channel link
  const linkMatch = xmlString.match(/<link[^>]*>([^<]+)<\/link>/i);
  if (linkMatch) result.channel.link = linkMatch[1].trim();

  // Extract all items (episodes)
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let itemMatch;
  
  while ((itemMatch = itemRegex.exec(xmlString)) !== null && result.items.length < MAX_EPISODES_PER_PODCAST) {
    const itemXml = itemMatch[1];
    const item: any = {};

    // Extract item title (try iTunes title as fallback)
    const itemTitleMatch = itemXml.match(/<title[^>]*><!\[CDATA\[(.*?)\]\]><\/title>/i) ||
                           itemXml.match(/<title[^>]*>([^<]+)<\/title>/i) ||
                           itemXml.match(/<itunes:title[^>]*>([^<]+)<\/itunes:title>/i);
    if (itemTitleMatch) item.title = itemTitleMatch[1].trim();

    // Extract item description
    const itemDescMatch = itemXml.match(/<description[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i) ||
                          itemXml.match(/<description[^>]*>([^<]+)<\/description>/i) ||
                          itemXml.match(/<itunes:summary[^>]*>([^<]+)<\/itunes:summary>/i);
    if (itemDescMatch) item.description = itemDescMatch[1].trim();

    // Extract audio URL (enclosure)
    const enclosureMatch = itemXml.match(/<enclosure[^>]*url=["']([^"']+)["']/i);
    if (enclosureMatch) item.audioUrl = enclosureMatch[1].trim();

    // Extract publish date
    const pubDateMatch = itemXml.match(/<pubDate[^>]*>([^<]+)<\/pubDate>/i);
    if (pubDateMatch) item.pubDate = pubDateMatch[1].trim();

    // Extract duration
    const durationMatch = itemXml.match(/<itunes:duration[^>]*>([^<]+)<\/itunes:duration>/i);
    if (durationMatch) item.duration = durationMatch[1].trim();

    // Extract GUID
    const guidMatch = itemXml.match(/<guid[^>]*>([^<]+)<\/guid>/i);
    if (guidMatch) item.guid = guidMatch[1].trim();

    // Extract episode image
    const itemImageMatch = itemXml.match(/<itunes:image[^>]*href=["']([^"']+)["']/i);
    if (itemImageMatch) item.image = itemImageMatch[1].trim();

    // Extract podcast transcript metadata when available.
    // Common Podcasting 2.0 shape: <podcast:transcript url="..." type="text/vtt" language="en" />
    const transcriptMatch = itemXml.match(/<(?:podcast:)?transcript\b[^>]*>/i);
    if (transcriptMatch) {
      const transcriptTag = transcriptMatch[0];
      const urlMatch = transcriptTag.match(/\burl=["']([^"']+)["']/i);
      const typeMatch = transcriptTag.match(/\btype=["']([^"']+)["']/i);
      const languageMatch = transcriptTag.match(/\blanguage=["']([^"']+)["']/i);

      if (urlMatch) item.transcriptUrl = urlMatch[1].trim();
      if (typeMatch) item.transcriptType = typeMatch[1].trim();
      if (languageMatch) item.transcriptLanguage = languageMatch[1].trim();
    }

    if (item.title && item.audioUrl) {
      result.items.push(item);
    }
  }

  return result;
}

/**
 * Transforms raw parsed XML into typed podcast data structure
 */
function transformToPodcastData(
  parsedXML: any,
  rssFeedUrl: string
): ParsedPodcastData {
  const metadata: PodcastMetadata = {
    title: parsedXML.channel?.title || 'Unknown Podcast',
    description: parsedXML.channel?.description || '',
    author: parsedXML.channel?.author || 'Unknown Author',
    imageUrl: parsedXML.channel?.image,
    websiteUrl: parsedXML.channel?.link,
    rssFeedUrl,
  };

  const episodes: Episode[] = parsedXML.items?.map((item: any, index: number) => ({
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
  })) || [];

  return {
    metadata,
    episodes,
  };
}

/**
 * Main function to fetch and parse RSS feed
 * 
 * @param rssUrl - The URL of the RSS feed
 * @returns Parsed podcast data with metadata and episodes
 * 
 * @example
 * ```typescript
 * const podcastData = await parseRSSFeed('https://feeds.example.com/podcast.xml');
 * console.log(podcastData.metadata.title);
 * console.log(podcastData.episodes.length);
 * ```
 */
export async function parseRSSFeed(rssUrl: string): Promise<ParsedPodcastData> {
  try {
    // Step 1: Fetch RSS feed XML
    const xmlString = await fetchRSSFeed(rssUrl);

    // Step 2: Parse XML
    const parsedXML = parseXML(xmlString);

    // Step 3: Transform to typed structure
    const podcastData = transformToPodcastData(parsedXML, rssUrl);

    return podcastData;
  } catch (error) {
    throw new Error(
      `Failed to parse RSS feed from ${rssUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Validates if a URL is a valid RSS feed
 * Basic validation - checks for common RSS patterns
 */
export function isValidRSSUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    // Check if it's http or https
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return false;
    }
    // You can add more validation here (e.g., check if it ends with .xml or .rss)
    return true;
  } catch {
    return false;
  }
}
