import { GoogleGenerativeAI } from '@google/generative-ai';
import { Audio } from 'expo-av';
import { useRef, useState } from 'react';
import type { AudioTrack } from '@/types/podcast';

export interface UseVoiceRecognitionResult {
  isListening: boolean;
  isTranscribing: boolean;
  transcript: string;
  error: string | null;
  startListening: () => Promise<void>;
  stopListening: () => Promise<string | null>;
  clearTranscript: () => void;
}

function getGeminiClient() {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) throw new Error('EXPO_PUBLIC_GEMINI_API_KEY is not set');
  return new GoogleGenerativeAI(apiKey);
}

const transcriptCache = new Map<string, string>();

async function fetchEpisodeTranscript(track: AudioTrack): Promise<string | null> {
  const url = track.episodeTranscriptUrl;
  if (!url) return null;

  const cached = transcriptCache.get(url);
  if (cached) return cached;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const raw = await response.text();
    const text = raw
      .replace(/^WEBVTT[\s\S]*?\n/i, ' ')
      .replace(/^\d+\s*$/gm, ' ')
      .replace(/\d{1,2}:\d{2}:\d{2}[,.]\d{3}\s+-->\s+\d{1,2}:\d{2}:\d{2}[,.]\d{3}.*$/gm, ' ')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!text) return null;
    transcriptCache.set(url, text);
    return text;
  } catch {
    return null;
  }
}

export function useVoiceRecognition(track: AudioTrack | null = null): UseVoiceRecognitionResult {
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const startListening = async () => {
    try {
      setError(null);
      setTranscript('');

      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        setError('Microphone permission denied.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsListening(true);
    } catch (err) {
      console.error('[Voice] startListening error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start recording');
      setIsListening(false);
    }
  };

  const stopListening = async (): Promise<string | null> => {
    if (!recordingRef.current) return null;

    try {
      setIsListening(false);
      setIsTranscribing(true);

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      if (!uri) throw new Error('Recording URI not found');

      // Convert audio file to base64
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = '';
      const chunkSize = 8192;
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        binary += String.fromCharCode(...uint8Array.subarray(i, i + chunkSize));
      }
      const base64Audio = btoa(binary);

      // Fetch episode transcript for context if track is available
      const episodeTranscript = track ? await fetchEpisodeTranscript(track) : null;

      const contextHint = episodeTranscript
        ? `The user is listening to "${track?.episodeTitle}" from "${track?.podcastTitle}". Here is the episode transcript for context:\n${episodeTranscript.slice(0, 6000)}\n\nUse this context to better recognize podcast-specific names and terminology.`
        : track
        ? `The user is listening to "${track.episodeTitle}" from "${track.podcastTitle}".`
        : '';

      const genAI = getGeminiClient();
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

      const result = await model.generateContent([
        {
          inlineData: {
            data: base64Audio,
            mimeType: 'audio/m4a',
          },
        },
        `Transcribe this audio exactly as spoken. Return only the transcribed text with no extra commentary. If the audio is silent or unclear, return an empty string.\n${contextHint}`,
      ]);

      const text = result.response.text().trim();
      setTranscript(text);
      return text;
    } catch (err) {
      console.error('[Voice] stopListening error:', err);
      setError(err instanceof Error ? err.message : 'Failed to transcribe audio');
      return null;
    } finally {
      setIsTranscribing(false);
    }
  };

  const clearTranscript = () => {
    setTranscript('');
    setError(null);
  };

  return {
    isListening,
    isTranscribing,
    transcript,
    error,
    startListening,
    stopListening,
    clearTranscript,
  };
}
