/**
 * React Hook for voice recognition using React Native Voice
 *
 * Handles speech-to-text functionality
 *
 * NOTE: This requires @react-native-voice/voice package and a custom dev client.
 * See VOICE_SETUP.md for installation instructions.
 */

import { useEffect, useState } from 'react';

// Type definitions for voice events
interface SpeechResultsEvent {
  value?: string[];
}

interface SpeechErrorEvent {
  error?: {
    message?: string;
  };
}

// Stub implementation since @react-native-voice/voice is not installed
const VoiceStub = {
  onSpeechStart: null as (() => void) | null,
  onSpeechEnd: null as (() => void) | null,
  onSpeechResults: null as ((event: SpeechResultsEvent) => void) | null,
  onSpeechError: null as ((event: SpeechErrorEvent) => void) | null,
  onSpeechPartialResults: null as ((event: SpeechResultsEvent) => void) | null,
  start: () => Promise.resolve(),
  stop: () => Promise.resolve(),
  destroy: () => Promise.resolve(),
};

interface UseVoiceRecognitionResult {
  isListening: boolean;
  transcript: string;
  error: string | null;
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  clearTranscript: () => void;
}

export function useVoiceRecognition(): UseVoiceRecognitionResult {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set up voice recognition event handlers
    VoiceStub.onSpeechStart = () => {
      setIsListening(true);
      setError(null);
      console.log('🎤 Speech recognition started');
    };

    VoiceStub.onSpeechEnd = () => {
      setIsListening(false);
      console.log('🎤 Speech recognition ended');
    };

    VoiceStub.onSpeechResults = (event: SpeechResultsEvent) => {
      if (event.value && event.value.length > 0) {
        const text = event.value[0];
        setTranscript(text);
        console.log('📝 Transcribed text:', text);
      }
    };

    VoiceStub.onSpeechError = (event: SpeechErrorEvent) => {
      const errorMessage = event.error?.message || 'Speech recognition error';
      setError(errorMessage);
      setIsListening(false);
      console.error('❌ Speech recognition error:', event.error);
    };

    VoiceStub.onSpeechPartialResults = (event: SpeechResultsEvent) => {
      if (event.value && event.value.length > 0) {
        // Update transcript in real-time as user speaks
        setTranscript(event.value[0]);
      }
    };

    // Cleanup on unmount
    return () => {
      VoiceStub.destroy().then(() => {
        // Clear all listeners
        VoiceStub.onSpeechStart = null;
        VoiceStub.onSpeechEnd = null;
        VoiceStub.onSpeechResults = null;
        VoiceStub.onSpeechError = null;
        VoiceStub.onSpeechPartialResults = null;
      });
    };
  }, []);

  const startListening = async () => {
    try {
      setError(null);
      setTranscript('');
      // Note: Voice recognition requires @react-native-voice/voice package and custom dev client
      // See VOICE_SETUP.md for setup instructions
      setError('Voice recognition not available. Requires custom dev client setup.');
      console.log('🎤 Voice recognition requires setup - see VOICE_SETUP.md');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start listening';
      setError(errorMessage);
      console.error('❌ Failed to start listening:', err);
    }
  };

  const stopListening = async () => {
    try {
      // Note: Voice recognition requires @react-native-voice/voice package and custom dev client
      setIsListening(false);
      console.log('🎤 Stopped listening (stub implementation)');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop listening';
      setError(errorMessage);
      console.error('❌ Failed to stop listening:', err);
    }
  };

  const clearTranscript = () => {
    setTranscript('');
    setError(null);
  };

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    clearTranscript,
  };
}
