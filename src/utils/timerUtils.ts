
import React, { useState, useEffect, useRef } from 'react';

export interface TimerProps {
  timer: number;
  isTimerRunning: boolean;
  toggleTimer: () => void;
  resetTimer: () => void;
}

export const useGameTimer = (initialValue: number = 0) => {
  const [timer, setTimer] = useState<number>(initialValue);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  
  // Use refs to track the start time and accumulated time
  const startTimeRef = useRef<number | null>(null);
  const accumulatedTimeRef = useRef<number>(initialValue);
  const rafIdRef = useRef<number | null>(null);
  
  // Function to update the timer based on elapsed time
  const updateTimer = () => {
    if (!isTimerRunning || startTimeRef.current === null) return;
    
    const now = Date.now();
    const elapsed = Math.floor((now - startTimeRef.current) / 1000);
    setTimer(accumulatedTimeRef.current + elapsed);
    
    // Continue updating with requestAnimationFrame for smooth updates
    rafIdRef.current = requestAnimationFrame(updateTimer);
  };
  
  useEffect(() => {
    if (isTimerRunning) {
      // Store the start time when the timer starts running
      startTimeRef.current = Date.now();
      // Start the animation frame loop
      rafIdRef.current = requestAnimationFrame(updateTimer);
    } else if (startTimeRef.current !== null) {
      // When paused, accumulate the elapsed time
      const now = Date.now();
      const elapsed = Math.floor((now - startTimeRef.current) / 1000);
      accumulatedTimeRef.current += elapsed;
      startTimeRef.current = null;
      
      // Cancel the animation frame
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    }
    
    // Clean up animation frame on unmount
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [isTimerRunning]);
  
  const toggleTimer = () => {
    setIsTimerRunning(prev => !prev);
  };
  
  const resetTimer = () => {
    setTimer(0);
    accumulatedTimeRef.current = 0;
    if (!isTimerRunning) {
      // If timer is not already running, start it
      setIsTimerRunning(true);
    } else {
      // If timer is already running, reset the start time
      startTimeRef.current = Date.now();
    }
  };
  
  return {
    timer,
    isTimerRunning,
    toggleTimer,
    resetTimer,
    setTimer
  };
};
