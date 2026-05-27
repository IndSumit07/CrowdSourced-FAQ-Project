import { useState, useEffect } from 'react';

/**
 * Counts down to a target deadline date.
 * Returns { days, hours, minutes, seconds, isExpired }
 */
export const useCountdown = (deadline) => {
  const calc = () => {
    const diff = new Date(deadline) - new Date();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return { days, hours, minutes, seconds, isExpired: false };
  };

  const [time, setTime] = useState(calc);

  useEffect(() => {
    if (!deadline) return;
    const interval = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  return time;
};
