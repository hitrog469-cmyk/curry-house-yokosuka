'use client';

import { useEffect, useState } from 'react';
import { getRestaurantStatusMessage } from '@/lib/restaurant-hours';

export default function RestaurantStatus() {
  const [status, setStatus] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: 'success' | 'error' | 'warning';
  } | null>(null);

  useEffect(() => {
    // Update status immediately
    updateStatus();

    // Update every minute
    const interval = setInterval(updateStatus, 60000);

    return () => clearInterval(interval);
  }, []);

  function updateStatus() {
    setStatus(getRestaurantStatusMessage());
  }

  if (!status) return null;

  const bgColor =
    status.variant === 'success'
      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      : status.variant === 'error'
      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
      : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';

  const textColor =
    status.variant === 'success'
      ? 'text-green-800 dark:text-green-300'
      : status.variant === 'error'
      ? 'text-red-800 dark:text-red-300'
      : 'text-yellow-800 dark:text-yellow-300';

  return (
    <div
      className={`${bgColor} border rounded-lg p-4 mb-6 transition-all duration-300`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-2xl">{status.isOpen ? '✅' : '🔒'}</div>
        <div className="flex-1">
          <h3 className={`font-bold text-lg ${textColor} mb-1`}>
            {status.title}
          </h3>
          <p className={`text-sm ${textColor}`}>{status.message}</p>
        </div>
      </div>
    </div>
  );
}
