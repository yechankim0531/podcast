import { useAudioPlayerContext } from '@/contexts/audio-player-context';

export function useAudioPlayer() {
  return useAudioPlayerContext();
}
