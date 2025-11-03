import { useCallback, useRef } from 'react';

interface UseSoundOptions {
  volume?: number; // 0 to 1
  playbackRate?: number; // 0.5 to 2
}

export const useSound = (soundUrl: string, options: UseSoundOptions = {}) => {
  const { volume = 0.7, playbackRate = 1 } = options;
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = useCallback(() => {
    try {
      // If a sound is already playing, stop it first
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      // Create new audio instance
      const audio = new Audio(soundUrl);
      audioRef.current = audio;
      
      // Set volume and playback rate
      audio.volume = Math.max(0, Math.min(1, volume));
      audio.playbackRate = playbackRate;
      
      // Reset time to start from beginning
      audio.currentTime = 0;
      
      // Add error event listener
      audio.addEventListener('error', (e) => {
        console.warn(`🔊 [SOUND ERROR] Failed to load sound: ${soundUrl}`, e);
      });
      
      // Add canplay event listener for debugging
      audio.addEventListener('canplay', () => {
        console.log(`🔊 [SOUND READY] Sound loaded and ready: ${soundUrl}`);
      });
      
      // Attempt to play with error handling
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log(`🔊 [SOUND PLAYING] Now playing: ${soundUrl}`);
          })
          .catch((error) => {
            console.warn(`🔊 [SOUND BLOCKED] Browser blocked sound playback: ${soundUrl}`, error.name);
            // This is common on mobile or when user hasn't interacted with page
          });
      }
    } catch (error) {
      console.warn(`🔊 [SOUND EXCEPTION] Error creating or playing audio: ${soundUrl}`, error);
    }
  }, [soundUrl, volume, playbackRate]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      console.log(`🔇 [SOUND STOPPED] Stopped: ${soundUrl}`);
    }
  }, [soundUrl]);

  return { play, stop };
};
