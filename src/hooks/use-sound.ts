import { useCallback } from 'react';

interface UseSoundOptions {
  volume?: number; // 0 to 1
  playbackRate?: number; // 0.5 to 2
}

export const useSound = (soundUrl: string, options: UseSoundOptions = {}) => {
  const { volume = 0.7, playbackRate = 1 } = options;

  const play = useCallback(() => {
    try {
      const audio = new Audio(soundUrl);
      audio.volume = Math.max(0, Math.min(1, volume));
      audio.playbackRate = playbackRate;
      audio.play().catch((error) => {
        console.warn('Failed to play sound:', error);
      });
    } catch (error) {
      console.warn('Error creating audio:', error);
    }
  }, [soundUrl, volume, playbackRate]);

  return { play };
};
