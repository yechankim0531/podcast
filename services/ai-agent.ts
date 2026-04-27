import type { AudioTrack } from '@/contexts/audio-player-context';

type WebSearchResult = {
  title: string;
  snippet: string;
  url?: string;
};

export type ChatMessage = {
  role: 'user' | 'assistant';
  text: string;
};

const transcriptCache = new Map<string, string>();

const toPlainText = (text: string): string =>
  text
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

const normalizeTranscript = (raw: string, contentType?: string): string => {
  const type = contentType?.toLowerCase() ?? '';

  if (type.includes('json') || raw.trim().startsWith('{') || raw.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(raw);
      const collectText = (value: unknown): string[] => {
        if (typeof value === 'string') return [value];
        if (Array.isArray(value)) return value.flatMap(collectText);
        if (value && typeof value === 'object') {
          const obj = value as Record<string, unknown>;
          if (typeof obj.text === 'string') return [obj.text];
          if (typeof obj.transcript === 'string') return [obj.transcript];
          return Object.values(obj).flatMap(collectText);
        }
        return [];
      };
      return toPlainText(collectText(parsed).join(' '));
    } catch {
      return toPlainText(raw);
    }
  }

  return toPlainText(
    raw
      .replace(/^WEBVTT[\s\S]*?\n/i, ' ')
      .replace(/^\d+\s*$/gm, ' ')
      .replace(/\d{1,2}:\d{2}:\d{2}[,.]\d{3}\s+-->\s+\d{1,2}:\d{2}:\d{2}[,.]\d{3}.*$/gm, ' ')
      .replace(/\d{2}:\d{2}[,.]\d{3}\s+-->\s+\d{2}:\d{2}[,.]\d{3}.*$/gm, ' ')
      .replace(/^NOTE[\s\S]*?(?=\n\n|$)/gim, ' ')
  );
};

const fetchTranscript = async (track: AudioTrack): Promise<string | null> => {
  const url = track.episodeTranscriptUrl;
  if (!url) return null;

  const cached = transcriptCache.get(url);
  if (cached) return cached;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const raw = await response.text();
    const text = normalizeTranscript(raw, response.headers.get('content-type') ?? track.episodeTranscriptType);
    if (!text) return null;

    transcriptCache.set(url, text);
    return text;
  } catch {
    return null;
  }
};

const termsForQuestion = (question: string): string[] =>
  question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((term) => term.length > 2)
    .filter(
      (term) =>
        ![
          'the',
          'and',
          'for',
          'are',
          'you',
          'this',
          'that',
          'with',
          'about',
          'what',
          'when',
          'where',
          'who',
          'why',
          'how',
          'episode',
          'podcast',
        ].includes(term)
    );

const findRelevantTranscriptSnippets = (question: string, transcript: string, maxSnippets = 3): string[] => {
  const terms = termsForQuestion(question);
  const sentences = transcript
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 35);

  const scored = sentences.map((sentence, index) => {
    const lower = sentence.toLowerCase();
    const score = terms.reduce((total, term) => total + (lower.includes(term) ? 1 : 0), 0);
    return { sentence, score, index };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, maxSnippets)
    .map((item) => item.sentence);
};

const shouldSearchWeb = (question: string): boolean => {
  const query = question.toLowerCase();
  return (
    query.length > 12 ||
    query.includes('search') ||
    query.includes('web') ||
    query.includes('internet') ||
    query.includes('latest') ||
    query.includes('current') ||
    query.includes('news') ||
    query.includes('recent') ||
    query.includes('compare') ||
    query.includes('fact') ||
    query.includes('who is') ||
    query.includes('what is') ||
    query.includes('where is') ||
    query.includes('why') ||
    query.includes('how') ||
    query.includes('explain')
  );
};

const isFollowUpQuestion = (question: string): boolean => {
  const query = question.toLowerCase().trim();
  return (
    query.length < 80 &&
    (query.includes('that') ||
      query.includes('this') ||
      query.includes('they') ||
      query.includes('them') ||
      query.includes('he') ||
      query.includes('she') ||
      query.includes('it') ||
      query.startsWith('what about') ||
      query.startsWith('how about') ||
      query.startsWith('why') ||
      query.startsWith('how so') ||
      query.startsWith('tell me more'))
  );
};

const buildContextualQuestion = (question: string, history: ChatMessage[]): string => {
  const recentHistory = history.slice(-4);
  if (!isFollowUpQuestion(question) || recentHistory.length === 0) {
    return question;
  }

  const context = recentHistory
    .map((message) => `${message.role}: ${message.text}`)
    .join(' ');

  return `${question} Context from the previous chat: ${context}`;
};

const webSearch = async (query: string): Promise<WebSearchResult[]> => {
  try {
    const response = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
    );
    if (!response.ok) return [];

    const data = await response.json();
    const results: WebSearchResult[] = [];

    if (data.AbstractText) {
      results.push({
        title: data.Heading || 'DuckDuckGo result',
        snippet: data.AbstractText,
        url: data.AbstractURL,
      });
    }

    if (data.Answer) {
      results.push({
        title: 'Direct answer',
        snippet: data.Answer,
      });
    }

    const related = Array.isArray(data.RelatedTopics) ? data.RelatedTopics : [];
    related.forEach((item: any) => {
      const entries = Array.isArray(item.Topics) ? item.Topics : [item];
      entries.forEach((entry: any) => {
        if (entry.Text && results.length < 4) {
          results.push({
            title: entry.Text.split(' - ')[0] || 'Related result',
            snippet: entry.Text,
            url: entry.FirstURL,
          });
        }
      });
    });

    return results.slice(0, 3);
  } catch {
    return [];
  }
};

const summarizeSources = (results: WebSearchResult[]): string => {
  if (results.length === 0) return '';

  return results
    .map((result, index) => {
      const source = result.url ? ` (${result.url})` : '';
      return `${index + 1}. ${result.snippet}${source}`;
    })
    .join('\n');
};

export async function generatePodcastAgentResponse(
  question: string,
  track: AudioTrack | null,
  history: ChatMessage[] = []
): Promise<string> {
  const normalized = question.trim();
  if (!normalized) {
    return 'Please ask a question about the current episode.';
  }

  if (!track) {
    const contextualQuestion = buildContextualQuestion(normalized, history);
    const webResults = await webSearch(contextualQuestion);
    const sourceSummary = summarizeSources(webResults);

    return sourceSummary
      ? `I do not have an episode playing, so I searched the web instead.\n\nWeb context:\n${sourceSummary}`
      : 'No episode is currently playing, and I could not find useful web context for that question.';
  }

  const query = normalized.toLowerCase();
  const title = track.episodeTitle;
  const podcast = track.podcastTitle;
  const author = track.podcastAuthor ?? 'the host';
  const description = track.episodeDescription ? toPlainText(track.episodeDescription) : null;
  const contextualQuestion = buildContextualQuestion(normalized, history);
  const transcript = await fetchTranscript(track);
  const snippets = transcript ? findRelevantTranscriptSnippets(contextualQuestion, transcript) : [];
  const webResults = shouldSearchWeb(contextualQuestion)
    ? await webSearch(`${contextualQuestion} ${podcast} ${title}`)
    : [];

  if (query.includes('who is the host') || (query.includes('who') && query.includes('host'))) {
    return `The host is ${author}.`;
  }

  if (query.includes('which podcast') || query.includes('podcast name') || query.includes('podcast is')) {
    return `This is an episode of "${podcast}"${track.podcastAuthor ? `, hosted by ${author}` : ''}.`;
  }

  if (query.includes('when') && (query.includes('release') || query.includes('published') || query.includes('date'))) {
    if (track.episodePublishDate) {
      return `This episode was published on ${new Date(track.episodePublishDate).toLocaleDateString()}.`;
    }
    return 'I do not have the exact publish date for this episode.';
  }

  if (query.includes('duration') || query.includes('length') || query.includes('long')) {
    return track.episodeDuration
      ? `The listed episode duration is ${track.episodeDuration}.`
      : 'I do not have the exact runtime for this episode.';
  }

  const answerParts: string[] = [];

  if (snippets.length > 0) {
    answerParts.push(`From the episode transcript, the most relevant parts I found are:\n${snippets.join('\n\n')}`);
  } else if (transcript) {
    answerParts.push('I found the episode transcript, but I could not match a specific passage to that question.');
  } else if (description) {
    answerParts.push(`I do not see a transcript URL for this episode, so I am using the episode description: ${description}`);
  } else {
    answerParts.push(`I do not see a transcript or description for this episode. I can still use the title "${title}" from "${podcast}".`);
  }

  const sourceSummary = summarizeSources(webResults);
  if (sourceSummary) {
    answerParts.push(`Web context:\n${sourceSummary}`);
  } else if (shouldSearchWeb(normalized)) {
    answerParts.push('I tried a web search, but did not find a useful instant result.');
  }

  return answerParts.join('\n\n');
}
