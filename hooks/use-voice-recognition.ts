/**
 * React Hook for voice recognition using React Native Voice
 * 
 * Handles speech-to-text functionality
 */

import { useState, useEffect } from 'react';
import Voice from '@react-native-voice/voice';

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
    Voice.onSpeechStart = () => {
      setIsListening(true);
      setError(null);
      console.log('🎤 Speech recognition started');
    };

    Voice.onSpeechEnd = () => {
      setIsListening(false);
      console.log('🎤 Speech recognition ended');
    };

    Voice.onSpeechResults = (event) => {
      if (event.value && event.value.length > 0) {
        const text = event.value[0];
        setTranscript(text);
        console.log('📝 Transcribed text:', text);
      }
    };

    Voice.onSpeechError = (event) => {
      const errorMessage = event.error?.message || 'Speech recognition error';
      setError(errorMessage);
      setIsListening(false);
      console.error('❌ Speech recognition error:', event.error);
    };

    Voice.onSpeechPartialResults = (event) => {
      if (event.value && event.value.length > 0) {
        // Update transcript in real-time as user speaks
        setTranscript(event.value[0]);
      }
    };

    // Cleanup on unmount
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const startListening = async () => {
    try {
      setError(null);
      setTranscript('');
      await Voice.start('en-US'); // Start listening for English
      console.log('🎤 Started listening...');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start listening';
      setError(errorMessage);
      console.error('❌ Failed to start listening:', err);
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
      setIsListening(false);
      console.log('🎤 Stopped listening');
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
