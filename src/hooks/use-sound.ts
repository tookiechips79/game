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
      // Check if sounds are globally muted (e.g., during arena transitions)
      const isMuted = (window as any).__MUTE_SOUNDS === true;
      if (isMuted) {
        console.log(`🔇 [SOUND MUTED] Skipping sound play (global mute active): ${soundUrl}`);
        return;
      }

      // CRITICAL: Stop any currently playing audio first to prevent echoes
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          audioRef.current.src = ''; // Clear the source to fully stop playback
          audioRef.current = null; // Clear reference
        } catch (e) {
          console.warn(`🔊 [SOUND CLEANUP ERROR] Error stopping previous audio:`, e);
        }
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
      
      // Attempt to play with error handling
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log(`🔊 [SOUND PLAYING] ✓ ${soundUrl.split('/').pop()}`);
          })
          .catch((error) => {
            console.warn(`🔊 [SOUND BLOCKED] Browser blocked playback: ${soundUrl}`, error.name);
          });
      }
    } catch (error) {
      console.warn(`🔊 [SOUND EXCEPTION] Error creating or playing audio: ${soundUrl}`, error);
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
