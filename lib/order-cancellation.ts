// Order Cancellation Logic
// 15-minute cancellation window

export const CANCELLATION_WINDOW_MINUTES = 15;

/**
 * Check if order can be cancelled (client-side check)
 */
export function canCancelOrder(createdAt: string, status: string): {
  canCancel: boolean;
  reason: string;
  minutesRemaining: number;
} {
  // Check if order is already cancelled or delivered
  if (status === 'cancelled') {
    return {
      canCancel: false,
      reason: 'Order is already cancelled',
      minutesRemaining: 0,
    };
  }

  if (status === 'delivered') {
    return {
      canCancel: false,
      reason: 'Order has been delivered',
      minutesRemaining: 0,
    };
  }

  // Calculate minutes since order creation
  const orderDate = new Date(createdAt);
  const now = new Date();
  const minutesSinceCreation = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60));
  const minutesRemaining = CANCELLATION_WINDOW_MINUTES - minutesSinceCreation;

  // Check if within cancellation window
  if (minutesSinceCreation <= CANCELLATION_WINDOW_MINUTES) {
    return {
      canCancel: true,
      reason: `You can cancel within ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}`,
      minutesRemaining: Math.max(0, minutesRemaining),
    };
  }

  return {
    canCancel: false,
    reason: 'Cancellation window expired (15 minutes). Please call restaurant to cancel.',
    minutesRemaining: 0,
  };
}

/**
 * Format time remaining for display
 */
export function formatTimeRemaining(minutes: number): string {
  if (minutes === 0) return 'Expired';
  if (minutes === 1) return '1 minute';
  return `${minutes} minutes`;
}

/**
 * Get cancellation status badge color
 */
export function getCancellationBadgeColor(minutesRemaining: number): {
  bg: string;
  text: string;
  border: string;
} {
  if (minutesRemaining === 0) {
    return {
      bg: 'bg-gray-100',
      text: 'text-gray-600',
      border: 'border-gray-300',
    };
  }

  if (minutesRemaining <= 5) {
    return {
      bg: 'bg-red-100',
      text: 'text-red-700',
      border: 'border-red-300',
    };
  }

  if (minutesRemaining <= 10) {
    return {
      bg: 'bg-yellow-100',
      text: 'text-yellow-700',
      border: 'border-yellow-300',
    };
  }

  return {
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-300',
  };
}
