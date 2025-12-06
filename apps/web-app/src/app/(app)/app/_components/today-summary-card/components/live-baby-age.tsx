'use client';

import { memo, useEffect, useState } from 'react';
import type { AgeUnit } from '../today-summary-card.types';

interface LiveBabyAgeProps {
  birthDate: Date;
}

/**
 * Memoized component to display and update baby's age in real-time.
 * Prevents parent re-renders when age updates every second.
 */
export const LiveBabyAge = memo(function LiveBabyAge({
  birthDate,
}: LiveBabyAgeProps) {
  const [age, setAge] = useState('');
  const [ageUnit, setAgeUnit] = useState<AgeUnit>('days');

  const cycleAgeUnit = () => {
    setAgeUnit((prev) => {
      const units: AgeUnit[] = ['days', 'weeks', 'months', 'years', 'detailed'];
      const currentIndex = units.indexOf(prev);
      const nextIndex = (currentIndex + 1) % units.length;
      return units[nextIndex] ?? units[0] ?? 'days';
    });
  };

  useEffect(() => {
    function updateAge() {
      const now = new Date();
      const birth = new Date(birthDate);
      const diffMs = now.getTime() - birth.getTime();

      const totalDays = diffMs / (1000 * 60 * 60 * 24);

      let formattedAge = '';

      switch (ageUnit) {
        case 'days': {
          const days = Math.floor(totalDays);
          formattedAge = `${days} ${days === 1 ? 'day' : 'days'}`;
          break;
        }
        case 'weeks': {
          const weeks = Math.floor(totalDays / 7);
          const remainingDays = Math.floor(totalDays % 7);
          if (weeks > 0) {
            formattedAge =
              remainingDays > 0
                ? `${weeks}w ${remainingDays}d`
                : `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
          } else {
            formattedAge = `${remainingDays} ${remainingDays === 1 ? 'day' : 'days'}`;
          }
          break;
        }
        case 'months': {
          const months = totalDays / 30.44;
          const wholeMonths = Math.floor(months);
          const remainingDays = Math.floor(totalDays % 30.44);
          if (wholeMonths > 0) {
            formattedAge =
              remainingDays > 0
                ? `${wholeMonths}m ${remainingDays}d`
                : `${wholeMonths} ${wholeMonths === 1 ? 'month' : 'months'}`;
          } else {
            formattedAge = `${remainingDays} ${remainingDays === 1 ? 'day' : 'days'}`;
          }
          break;
        }
        case 'years': {
          const years = totalDays / 365.25;
          const wholeYears = Math.floor(years);
          const remainingMonths = Math.floor((totalDays % 365.25) / 30.44);
          if (wholeYears > 0) {
            formattedAge =
              remainingMonths > 0
                ? `${wholeYears}y ${remainingMonths}m`
                : `${wholeYears} ${wholeYears === 1 ? 'year' : 'years'}`;
          } else {
            formattedAge =
              remainingMonths > 0
                ? `${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`
                : `${Math.floor(totalDays)} ${Math.floor(totalDays) === 1 ? 'day' : 'days'}`;
          }
          break;
        }
        case 'detailed': {
          const days = Math.floor(totalDays);
          const hours = Math.floor(
            (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
          );
          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

          if (days > 0) {
            formattedAge = `${days}d ${hours}h ${minutes}m ${seconds}s`;
          } else if (hours > 0) {
            formattedAge = `${hours}h ${minutes}m ${seconds}s`;
          } else if (minutes > 0) {
            formattedAge = `${minutes}m ${seconds}s`;
          } else {
            formattedAge = `${seconds}s`;
          }
          break;
        }
      }

      setAge(formattedAge);
    }

    updateAge();
    const interval = setInterval(updateAge, 1000);

    return () => clearInterval(interval);
  }, [birthDate, ageUnit]);

  return (
    <button
      className="cursor-pointer hover:opacity-70 transition-opacity bg-transparent border-none p-0 text-inherit"
      onClick={cycleAgeUnit}
      title="Click to cycle between days, weeks, months, years, and detailed timestamp"
      type="button"
    >
      {age}
    </button>
  );
});
