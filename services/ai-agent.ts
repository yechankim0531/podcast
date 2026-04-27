import type { AudioTrack } from '@/contexts/audio-player-context';

const toPlainText = (html: string): string => html.replace(/<[^>]*>/g, '').trim();

export function generatePodcastAgentResponse(question: string, track: AudioTrack | null): string {
  if (!track) {
    return 'No episode is currently playing. Start playback and ask about the episode.';
  }

  const normalized = question.trim();
  if (!normalized) {
    return 'Please ask a question about the current episode.';
  }

  const query = normalized.toLowerCase();
  const title = track.episodeTitle;
  const podcast = track.podcastTitle;
  const author = track.podcastAuthor ?? 'the host';
  const description = track.episodeDescription ? toPlainText(track.episodeDescription) : null;
  const summary = description
    ? `Here is what I can tell you from the episode description: ${description}`
    : `I don’t have a full transcript yet, but I can answer based on the title and podcast metadata.`;

  if (query.includes('who is the host') || (query.includes('who') && query.includes('host'))) {
    return `The host is ${author}.`;
  }

  if (query.includes('what is this episode about') || query.includes('what is this podcast about') || query.includes('summary') || query.includes('topic')) {
    if (description) {
      return `This episode appears to cover: ${description}`;
    }
    return `This episode is titled "${title}" and is from the podcast "${podcast}."`;
  }

  if (query.includes('which podcast') || query.includes('podcast name') || query.includes('podcast is')) {
    return `This is an episode of "${podcast}"${track.podcastAuthor ? `, hosted by ${author}` : ''}.`;
  }

  if (query.includes('when') && (query.includes('release') || query.includes('published') || query.includes('date'))) {
    return 'I do not currently have the exact publish date from the playback screen, but you can view it on the episode detail page.';
  }

  if (query.includes('duration') || query.includes('length') || query.includes('long')) {
    return 'I do not have the exact runtime from the player screen yet, but the episode detail page may show it.';
  }

  return description
    ? `Based on the available episode description: ${description}`
    : `I don’t have a transcript available yet. You can still ask about the episode title, podcast name, or host.`;
}
