import { useCountdown } from '@/hooks/useCountdown';
import { Clock } from 'lucide-react';

export const CountdownTimer = ({ deadline, compact = false }) => {
  const { days, hours, minutes, seconds, isExpired } = useCountdown(deadline);

  if (isExpired) {
    return (
      <span className="badge-red flex items-center gap-1">
        <Clock className="w-3 h-3" /> Expired
      </span>
    );
  }

  if (compact) {
    const label = days > 0
      ? `${days}d ${hours}h`
      : hours > 0
      ? `${hours}h ${minutes}m`
      : `${minutes}m ${seconds}s`;
    const urgent = days === 0 && hours < 2;
    return (
      <span className={`badge flex items-center gap-1 ${urgent ? 'badge-red' : 'badge-yellow'}`}>
        <Clock className="w-3 h-3" /> {label}
      </span>
    );
  }

  const urgent = days === 0 && hours < 2;
  return (
    <div className={`flex items-center gap-3 ${urgent ? 'text-red-400' : 'text-yellow-400'}`}>
      <Clock className="w-4 h-4 flex-shrink-0" />
      <div className="flex gap-2 text-xs font-mono">
        {days > 0 && (
          <span className="flex flex-col items-center">
            <span className="text-base font-bold">{days}</span>
            <span className="text-slate-500">d</span>
          </span>
        )}
        <span className="flex flex-col items-center">
          <span className="text-base font-bold">{String(hours).padStart(2, '0')}</span>
          <span className="text-slate-500">h</span>
        </span>
        <span className="flex flex-col items-center">
          <span className="text-base font-bold">{String(minutes).padStart(2, '0')}</span>
          <span className="text-slate-500">m</span>
        </span>
        <span className="flex flex-col items-center">
          <span className="text-base font-bold">{String(seconds).padStart(2, '0')}</span>
          <span className="text-slate-500">s</span>
        </span>
      </div>
    </div>
  );
};
