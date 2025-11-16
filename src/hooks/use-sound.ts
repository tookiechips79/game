import { useCallback, useRef, useEffect } from 'react';

interface UseSoundOptions {
  volume?: number; // 0 to 1
  playbackRate?: number; // 0.5 to 2
}

// Global audio pool for preloading and reusing audio elements
const audioPool: { [key: string]: HTMLAudioElement } = {};

export const useSound = (soundUrl: string, options: UseSoundOptions = {}) => {
  const { volume = 0.7, playbackRate = 1 } = options;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // Preload audio on mount
  useEffect(() => {
    if (!audioPool[soundUrl]) {
      try {
        const audio = new Audio(soundUrl);
        audio.preload = 'auto';
        audioPool[soundUrl] = audio;
        console.log(`🎵 [PRELOAD] Preloaded audio: ${soundUrl}`);
      } catch (e) {
        console.warn(`🔊 [PRELOAD ERROR] Failed to preload: ${soundUrl}`, e);
      }
    }
  }, [soundUrl]);

  const play = useCallback(() => {
    try {
      // Check if sounds are globally muted (e.g., during arena transitions)
      if ((window as any).__MUTE_SOUNDS) {
        return;
      }

      // CRITICAL: Stop any currently playing audio first to prevent echoes
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          audioRef.current.src = ''; // Clear the source to fully stop playback
        } catch (e) {
          // Silently fail
        }
      }

      // Use preloaded audio from pool if available
      let audio: HTMLAudioElement;
      if (audioPool[soundUrl]) {
        audio = audioPool[soundUrl].cloneNode() as HTMLAudioElement;
        console.log(`🔊 [SOUND POOL] Using pooled audio: ${soundUrl}`);
      } else {
        audio = new Audio(soundUrl);
        console.log(`🔊 [SOUND NEW] Creating new audio instance: ${soundUrl}`);
      }
      
      audioRef.current = audio;
      
      // Set volume and playback rate
      audio.volume = Math.max(0, Math.min(1, volume));
      audio.playbackRate = playbackRate;
      
      // Reset time to start from beginning
      audio.currentTime = 0;
      
      // Add error event listener with retry logic
      audio.addEventListener('error', (e) => {
        console.warn(`🔊 [SOUND ERROR] Failed to load: ${soundUrl}`, e);
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          console.log(`🔄 [SOUND RETRY] Attempting retry ${retryCountRef.current}/${maxRetries}`);
          setTimeout(() => play(), 100); // Retry after 100ms
        }
      }, { once: true });
      
      // Attempt to play with error handling
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log(`🔊 [SOUND PLAYING] ▶️  ${soundUrl}`);
            retryCountRef.current = 0; // Reset retry count on success
          })
          .catch((error) => {
            console.warn(`🔊 [SOUND BLOCKED] Browser blocked: ${soundUrl}`, error.name);
          });
      }
    } catch (error) {
      console.warn(`🔊 [SOUND EXCEPTION] Error: ${soundUrl}`, error);
    }
  }, [soundUrl, volume, playbackRate]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = ''; // Clear the source to fully stop playback
        console.log(`🔇 [SOUND STOPPED] Stopped and cleared: ${soundUrl}`);
      } catch (e) {
        console.warn(`🔊 [SOUND STOP ERROR] Error stopping audio:`, e);
      }
    }
  }, [soundUrl]);

  return { play, stop };
};

