// Restaurant Hours Management
// Location: Yokosuka, Japan (Asia/Tokyo timezone)

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type RestaurantHours = {
  day: DayOfWeek;
  isOpen: boolean;
  openTime: string; // Format: "HH:mm" (24-hour)
  closeTime: string; // Format: "HH:mm" (24-hour)
};

// Default restaurant hours (adjust as needed)
export const RESTAURANT_HOURS: RestaurantHours[] = [
  { day: 'monday', isOpen: true, openTime: '11:00', closeTime: '22:00' },
  { day: 'tuesday', isOpen: true, openTime: '11:00', closeTime: '22:00' },
  { day: 'wednesday', isOpen: true, openTime: '11:00', closeTime: '22:00' },
  { day: 'thursday', isOpen: true, openTime: '11:00', closeTime: '22:00' },
  { day: 'friday', isOpen: true, openTime: '11:00', closeTime: '23:00' },
  { day: 'saturday', isOpen: true, openTime: '11:00', closeTime: '23:00' },
  { day: 'sunday', isOpen: true, openTime: '11:00', closeTime: '22:00' },
];

// Time before closing to stop accepting orders (in minutes)
export const ORDER_CUTOFF_MINUTES = 30;

/**
 * Get current time in Japan (Asia/Tokyo timezone)
 */
export function getJapanTime(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
}

/**
 * Get day of week from date (0=Sunday, 1=Monday, etc.)
 */
export function getDayOfWeek(date: Date): DayOfWeek {
  const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
}

/**
 * Parse time string "HH:mm" to minutes since midnight
 */
function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Get minutes since midnight from date
 */
function getMinutesSinceMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/**
 * Check if restaurant is currently open
 */
export function isRestaurantOpen(): {
  isOpen: boolean;
  reason?: string;
  opensAt?: string;
  closesAt?: string;
} {
  const now = getJapanTime();
  const dayOfWeek = getDayOfWeek(now);
  const todayHours = RESTAURANT_HOURS.find(h => h.day === dayOfWeek);

  if (!todayHours) {
    return { isOpen: false, reason: 'Restaurant hours not configured for today' };
  }

  if (!todayHours.isOpen) {
    return {
      isOpen: false,
      reason: `We are closed on ${dayOfWeek}s`,
    };
  }

  const currentMinutes = getMinutesSinceMidnight(now);
  const openMinutes = parseTimeToMinutes(todayHours.openTime);
  const closeMinutes = parseTimeToMinutes(todayHours.closeTime);
  const cutoffMinutes = closeMinutes - ORDER_CUTOFF_MINUTES;

  // Before opening
  if (currentMinutes < openMinutes) {
    return {
      isOpen: false,
      reason: `We open at ${todayHours.openTime}`,
      opensAt: todayHours.openTime,
    };
  }

  // After closing or too close to closing
  if (currentMinutes >= closeMinutes) {
    // Find next open day
    const nextOpenDay = getNextOpenDay(dayOfWeek);
    return {
      isOpen: false,
      reason: `We are closed. Opens tomorrow at ${nextOpenDay.openTime}`,
      opensAt: nextOpenDay.openTime,
    };
  }

  // Too close to closing time (within cutoff window)
  if (currentMinutes >= cutoffMinutes) {
    return {
      isOpen: false,
      reason: `Kitchen closes soon. Last orders at ${formatMinutesToTime(cutoffMinutes)}`,
      closesAt: formatMinutesToTime(cutoffMinutes),
    };
  }

  // Restaurant is open and accepting orders
  return {
    isOpen: true,
    closesAt: todayHours.closeTime,
  };
}

/**
 * Get next open day
 */
function getNextOpenDay(currentDay: DayOfWeek): RestaurantHours {
  const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentIndex = days.indexOf(currentDay);

  for (let i = 1; i <= 7; i++) {
    const nextIndex = (currentIndex + i) % 7;
    const nextDay = RESTAURANT_HOURS.find(h => h.day === days[nextIndex]);
    if (nextDay && nextDay.isOpen) {
      return nextDay;
    }
  }

  // Fallback to Monday if no open days found
  return RESTAURANT_HOURS[1];
}

/**
 * Format minutes since midnight to "HH:mm" format
 */
function formatMinutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Get restaurant status message for display
 */
export function getRestaurantStatusMessage(): {
  isOpen: boolean;
  title: string;
  message: string;
  variant: 'success' | 'error' | 'warning';
} {
  const status = isRestaurantOpen();

  if (status.isOpen) {
    return {
      isOpen: true,
      title: '🍛 We\'re Open!',
      message: `Accepting orders until ${status.closesAt}`,
      variant: 'success',
    };
  }

  return {
    isOpen: false,
    title: '😔 Currently Closed',
    message: status.reason || 'We are currently closed',
    variant: 'error',
  };
}

/**
 * Get formatted hours for display
 */
export function getFormattedHours(): string[] {
  return RESTAURANT_HOURS.map(hours => {
    if (!hours.isOpen) {
      return `${hours.day.charAt(0).toUpperCase() + hours.day.slice(1)}: Closed`;
    }
    return `${hours.day.charAt(0).toUpperCase() + hours.day.slice(1)}: ${hours.openTime} - ${hours.closeTime}`;
  });
}

/**
 * Validate if order can be placed at specific time
 */
export function canPlaceOrder(): {
  allowed: boolean;
  message: string;
} {
  const status = isRestaurantOpen();

  if (!status.isOpen) {
    return {
      allowed: false,
      message: status.reason || 'Restaurant is currently closed',
    };
  }

  return {
    allowed: true,
    message: 'Order can be placed',
  };
}
