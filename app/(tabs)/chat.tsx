import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { miniPlayerHeight } from '@/components/mini-player';
import { useAudioPlayer } from '@/hooks/use-audio-player';
import { useVoiceRecognition } from '@/hooks/use-voice-recognition';
import { generatePodcastAgentResponse, type ChatMessage } from '@/services/ai-agent';

export default function ChatScreen() {
  const { currentTrack, hasTrackLoaded } = useAudioPlayer();
  const {
    isListening,
    isTranscribing,
    transcript,
    error: voiceError,
    startListening,
    stopListening,
    clearTranscript,
  } = useVoiceRecognition(currentTrack);

  const inputRef = useRef<TextInput | null>(null);
  const sendingRef = useRef(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const focusQueryInput = () => {
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (transcript) {
      setQuery(transcript);
    }
  }, [transcript]);

  const handleSend = async (overrideText?: string) => {
    if (sendingRef.current) return;

    const trimmed = (overrideText ?? query).trim();
    if (!trimmed) return;

    sendingRef.current = true;
    const userMessage = { role: 'user' as const, text: trimmed };
    const previousMessages = messages;
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setIsLoading(true);

    try {
      const answer = await generatePodcastAgentResponse(trimmed, currentTrack, previousMessages);
      setMessages(prev => [...prev, { role: 'assistant', text: answer }]);
      clearTranscript();
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: error instanceof Error ? error.message : 'I could not answer that question right now.',
        },
      ]);
    } finally {
      sendingRef.current = false;
      setIsLoading(false);
    }
  };

  const handleVoicePress = async () => {
    if (isListening) {
      const text = await stopListening();
      if (text) {
        await handleSend(text);
      }
      return;
    }
    await startListening();
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Podcast Chat
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Ask follow-up questions about the episode or similar podcast topics.
        </ThemedText>
      </ThemedView>

      {currentTrack ? (
        <ThemedView style={styles.trackInfo}>
          <ThemedText style={styles.trackLabel}>Now playing</ThemedText>
          <ThemedText numberOfLines={1} style={styles.trackTitle}>
            {currentTrack.episodeTitle}
          </ThemedText>
          <ThemedText numberOfLines={1} style={styles.trackMeta}>
            {currentTrack.podcastTitle}
          </ThemedText>
        </ThemedView>
      ) : (
        <ThemedView style={styles.trackInfoEmpty}>
          <ThemedText style={styles.trackLabel}>No episode playing</ThemedText>
          <ThemedText style={styles.trackMeta}>
            Start playback on any episode so the assistant can answer episode-specific questions.
          </ThemedText>
        </ThemedView>
      )}

      <View style={styles.chatContainer}>
        <ScrollView
          contentContainerStyle={styles.chatContent}
          keyboardShouldPersistTaps="handled"
        >
          {messages.length === 0 ? (
            <TouchableOpacity style={styles.emptyState} onPress={focusQueryInput} activeOpacity={0.85}>
              <ThemedText style={styles.emptyText}>
                Start the conversation by typing below. Tap the mic in the bar to speak instead.
              </ThemedText>
              <View style={styles.emptyVoiceRow}>
                <Ionicons name={isListening ? 'mic' : 'mic-outline'} size={20} color="#007AFF" />
                <ThemedText style={styles.emptyHintText}>
                  Audio input is available in the box below.
                </ThemedText>
              </View>
            </TouchableOpacity>
          ) : (
            messages.map((message, index) => (
              <View
                key={`${message.role}-${index}`}
                style={[
                  styles.messageBubble,
                  message.role === 'assistant' ? styles.assistantBubble : styles.userBubble,
                ]}>
                <ThemedText style={message.role === 'assistant' ? styles.assistantText : styles.userText}>
                  {message.text}
                </ThemedText>
              </View>
            ))
          )}
        </ScrollView>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
        style={[styles.footer, hasTrackLoaded && { marginBottom: miniPlayerHeight + 8 }]}>
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={setQuery}
          placeholder={isListening ? 'Listening...' : isTranscribing ? 'Transcribing...' : 'Ask your podcast question...'}
          placeholderTextColor={isListening ? '#FF3B30' : isTranscribing ? '#007AFF' : '#999'}
          style={styles.input}
          returnKeyType="send"
          onSubmitEditing={() => void handleSend()}
          editable={!isLoading && !isListening && !isTranscribing}
        />
        <TouchableOpacity
          style={[styles.voiceButton, isListening && styles.voiceButtonActive]}
          onPress={handleVoicePress}
          disabled={isTranscribing || isLoading}>
          {isTranscribing ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Ionicons
              name={isListening ? 'stop' : 'mic-outline'}
              size={22}
              color={isListening ? '#FFFFFF' : '#007AFF'}
            />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sendButton, isLoading || !query.trim() ? styles.sendButtonDisabled : null]}
          onPress={() => void handleSend()}
          disabled={isLoading || !query.trim() || isListening || isTranscribing}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="send" size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>

      {voiceError ? <ThemedText style={styles.errorText}>{voiceError}</ThemedText> : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  header: {
    marginBottom: 18,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  trackInfo: {
    borderRadius: 18,
    backgroundColor: '#F3F4F8',
    padding: 14,
    marginBottom: 16,
  },
  trackInfoEmpty: {
    borderRadius: 18,
    backgroundColor: '#F8F7FF',
    padding: 14,
    marginBottom: 16,
  },
  trackLabel: {
    fontSize: 12,
    color: '#888888',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  trackMeta: {
    fontSize: 14,
    color: '#555555',
  },
  chatContainer: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: '#F7F7FA',
    padding: 12,
  },
  chatContent: {
    gap: 12,
    paddingBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginHorizontal: 16,
    marginTop: 30,
  },
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 28,
    gap: 12,
  },
  emptyVoiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  emptyHintText: {
    fontSize: 13,
    color: '#888888',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '85%',
  },
  assistantBubble: {
    backgroundColor: '#E5E5FF',
    alignSelf: 'flex-start',
  },
  userBubble: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
  },
  assistantText: {
    color: '#1C1C1C',
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    minHeight: 44,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    color: '#000000',
  },
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  voiceButtonActive: {
    backgroundColor: '#FF3B30',
    borderColor: '#FF3B30',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(0, 122, 255, 0.4)',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
  },
});
