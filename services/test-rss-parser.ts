/**
 * Test file for RSS Parser
 * Run this to test if RSS parsing works correctly
 * 
 * You can test this by importing and calling testRSSParser()
 * in your home.tsx temporarily, or run it in a test environment
 */

import { parseRSSFeed } from './rss-parser';

/**
 * Test RSS feeds (public podcast feeds you can use for testing)
 */
export const TEST_RSS_FEEDS = [
  'https://feeds.npr.org/510289/podcast.xml', // NPR Tech News
  'https://feeds.simplecast.com/54nAGcIl', // Popular podcast
  'https://rss.cnn.com/rss/edition.rss', // CNN (news, not podcast but has similar structure)
];

/**
 * Test a single RSS feed
 */
export async function testRSSParser(rssUrl: string) {
  try {
    console.log('Testing RSS Parser with:', rssUrl);
    console.log('Fetching and parsing RSS feed...');
    
    const startTime = Date.now();
    const podcastData = await parseRSSFeed(rssUrl);
    const endTime = Date.now();
    
    console.log('\n✅ RSS Parser Test Results:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📊 Podcast Metadata:');
    console.log('  Title:', podcastData.metadata.title);
    console.log('  Author:', podcastData.metadata.author);
    console.log('  Description:', podcastData.metadata.description?.substring(0, 100) + '...');
    console.log('  Image URL:', podcastData.metadata.imageUrl || 'Not provided');
    console.log('  Website:', podcastData.metadata.websiteUrl || 'Not provided');
    
    console.log('\n📻 Episodes Found:', podcastData.episodes.length);
    
    if (podcastData.episodes.length > 0) {
      console.log('\n🎙️  First Episode:');
      const firstEpisode = podcastData.episodes[0];
      console.log('  Title:', firstEpisode.title);
      console.log('  Audio URL:', firstEpisode.audioUrl);
      console.log('  Publish Date:', firstEpisode.publishDate);
      console.log('  Duration:', firstEpisode.duration || 'Not provided');
      console.log('  Description:', firstEpisode.description?.substring(0, 100) + '...');
    }
    
    console.log('\n⏱️  Parse Time:', endTime - startTime, 'ms');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    return podcastData;
  } catch (error) {
    console.error('\n❌ RSS Parser Test Failed:');
    console.error('  Error:', error instanceof Error ? error.message : 'Unknown error');
    console.error('  RSS URL:', rssUrl);
    throw error;
  }
}

/**
 * Test all RSS feeds
 */
export async function testAllRSSFeeds() {
  console.log('🧪 Starting RSS Parser Tests...\n');
  
  for (const rssUrl of TEST_RSS_FEEDS) {
    try {
      await testRSSParser(rssUrl);
    } catch (error) {
      console.error('Failed to test:', rssUrl);
    }
    console.log('\n');
  }
}
