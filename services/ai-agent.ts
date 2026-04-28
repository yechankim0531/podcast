import type { AudioTrack } from '@/types/podcast';
import { GoogleGenerativeAI } from '@google/generative-ai';

export type ChatMessage = {
  role: 'user' | 'assistant';
  text: string;
};

// ─── Transcript fetching ────────────────────────────────────────────────────

const transcriptCache = new Map<string, string>();
const MAX_TRANSCRIPT_CHARS = 12000;

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

// ─── Gemini client ──────────────────────────────────────────────────────────

function getGeminiClient() {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) throw new Error('EXPO_PUBLIC_GEMINI_API_KEY is not set in your .env file.');
  return new GoogleGenerativeAI(apiKey);
}

// ─── Step 1: Classify whether transcript is needed ──────────────────────────

async function needsTranscript(
  question: string,
  track: AudioTrack,
  history: ChatMessage[]
): Promise<boolean> {
  // If no transcript URL exists, skip the check entirely
  if (!track.episodeTranscriptUrl) return false;

  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const recentHistory = history
    .slice(-4)
    .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
    .join('\n');

  const classificationPrompt = `You are deciding whether a podcast transcript is needed to answer a question.

Episode: "${track.episodeTitle}" from "${track.podcastTitle}"
${track.episodeDescription ? `Description: ${toPlainText(track.episodeDescription).slice(0, 300)}` : ''}
${recentHistory ? `Recent conversation:\n${recentHistory}` : ''}

Question: "${question}"

Does answering this question require reading the episode transcript? Answer with only YES or NO.
- YES if the question asks about specific things said, discussed, or mentioned in the episode
- NO if the question is general knowledge, about the podcast/host in general, or can be answered without the episode content`;

  const result = await model.generateContent(classificationPrompt);
  return result.response.text().trim().toUpperCase().startsWith('YES');
}

// ─── Step 2: Build answer prompt ─────────────────────────────────────────────

function buildSystemPrompt(track: AudioTrack | null, transcript: string | null): string {
  const lines: string[] = [
    'You are a helpful podcast assistant. Keep answers concise and conversational.',
    'If you genuinely cannot answer something, say so honestly.',
    '',
  ];

  if (!track) {
    lines.push('No episode is currently playing. Answer using your general knowledge.');
    return lines.join('\n');
  }

  lines.push(`Episode: "${track.episodeTitle}"`);
  lines.push(`Podcast: "${track.podcastTitle}"`);
  if (track.podcastAuthor) lines.push(`Host: ${track.podcastAuthor}`);
  if (track.episodePublishDate) {
    lines.push(`Published: ${new Date(track.episodePublishDate).toLocaleDateString()}`);
  }
  if (track.episodeDuration) lines.push(`Duration: ${track.episodeDuration}`);
  if (track.episodeDescription) {
    lines.push(`Description: ${toPlainText(track.episodeDescription).slice(0, 400)}`);
  }

  if (transcript) {
    const trimmed = transcript.slice(0, MAX_TRANSCRIPT_CHARS);
    lines.push('');
    lines.push('--- EPISODE TRANSCRIPT ---');
    lines.push(trimmed);
    if (transcript.length > MAX_TRANSCRIPT_CHARS) lines.push('[transcript truncated]');
    lines.push('--- END OF TRANSCRIPT ---');
    lines.push('');
    lines.push('Use the transcript above to answer the question accurately. Quote it where helpful.');
  }

  return lines.join('\n');
}

// ─── Main export ────────────────────────────────────────────────────────────

export async function generatePodcastAgentResponse(
  question: string,
  track: AudioTrack | null,
  history: ChatMessage[] = []
): Promise<string> {
  const normalized = question.trim();
  if (!normalized) return 'Please ask a question.';

  // Step 1: decide if transcript is needed (only when a track is playing)
  let transcript: string | null = null;
  if (track) {
    const required = await needsTranscript(normalized, track, history);
    if (required) {
      transcript = await fetchTranscript(track);
    }
  }

  // Step 2: answer with or without transcript
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: buildSystemPrompt(track, transcript),
  });

  const geminiHistory = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }],
  }));

  const chat = model.startChat({ history: geminiHistory });
  const result = await chat.sendMessage(normalized);
  return result.response.text();
}
