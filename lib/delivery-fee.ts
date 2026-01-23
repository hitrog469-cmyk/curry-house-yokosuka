// Delivery Fee Calculator
// Restaurant Location: 〒238-0041 Kanagawa, Yokosuka, Honcho, 2 Chome−3−2
// Delivery Range: 50 kilometers

// Restaurant coordinates (Yokosuka, Japan)
export const RESTAURANT_LOCATION = {
  lat: 35.2816,
  lng: 139.6703,
  address: '〒238-0041 Kanagawa, Yokosuka, Honcho, 2 Chome−3−2',
};

// Maximum delivery distance in kilometers
export const MAX_DELIVERY_DISTANCE_KM = 50;

// Delivery fee structure (in JPY)
export const DELIVERY_FEE_STRUCTURE = [
  { minKm: 0, maxKm: 3, fee: 300 },      // 0-3km: ¥300
  { minKm: 3, maxKm: 5, fee: 500 },      // 3-5km: ¥500
  { minKm: 5, maxKm: 10, fee: 700 },     // 5-10km: ¥700
  { minKm: 10, maxKm: 15, fee: 1000 },   // 10-15km: ¥1000
  { minKm: 15, maxKm: 20, fee: 1300 },   // 15-20km: ¥1300
  { minKm: 20, maxKm: 30, fee: 1600 },   // 20-30km: ¥1600
  { minKm: 30, maxKm: 50, fee: 2000 },   // 30-50km: ¥2000
];

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate delivery fee based on distance
 */
export function calculateDeliveryFee(distanceKm: number): {
  fee: number;
  isWithinRange: boolean;
  message: string;
} {
  // Check if within delivery range
  if (distanceKm > MAX_DELIVERY_DISTANCE_KM) {
    return {
      fee: 0,
      isWithinRange: false,
      message: `Sorry, this address is ${distanceKm.toFixed(1)}km away. We only deliver within ${MAX_DELIVERY_DISTANCE_KM}km.`,
    };
  }

  // Find appropriate fee tier
  const tier = DELIVERY_FEE_STRUCTURE.find(
    (t) => distanceKm >= t.minKm && distanceKm < t.maxKm
  );

  if (!tier) {
    // Fallback to last tier
    const lastTier = DELIVERY_FEE_STRUCTURE[DELIVERY_FEE_STRUCTURE.length - 1];
    return {
      fee: lastTier.fee,
      isWithinRange: true,
      message: `Delivery fee: ¥${lastTier.fee} (${distanceKm.toFixed(1)}km)`,
    };
  }

  return {
    fee: tier.fee,
    isWithinRange: true,
    message: `Delivery fee: ¥${tier.fee} (${distanceKm.toFixed(1)}km from restaurant)`,
  };
}

/**
 * Geocode address using Google Maps Geocoding API
 * Requires NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable
 */
export async function geocodeAddress(address: string): Promise<{
  success: boolean;
  lat?: number;
  lng?: number;
  formattedAddress?: string;
  error?: string;
}> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error: 'Google Maps API key not configured',
    };
  }

  try {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&region=jp&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      return {
        success: true,
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        formattedAddress: result.formatted_address,
      };
    }

    return {
      success: false,
      error: `Unable to find address: ${data.status}`,
    };
  } catch (error) {
    return {
      success: false,
      error: `Geocoding error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Calculate delivery fee from address
 * This is the main function to use
 */
export async function getDeliveryFeeFromAddress(address: string): Promise<{
  success: boolean;
  fee?: number;
  distance?: number;
  message: string;
  formattedAddress?: string;
}> {
  // Geocode the address
  const geocodeResult = await geocodeAddress(address);

  if (!geocodeResult.success || !geocodeResult.lat || !geocodeResult.lng) {
    return {
      success: false,
      message:
        geocodeResult.error ||
        'Could not find address. Please enter a valid address in Yokosuka area.',
    };
  }

  // Calculate distance
  const distance = calculateDistance(
    RESTAURANT_LOCATION.lat,
    RESTAURANT_LOCATION.lng,
    geocodeResult.lat,
    geocodeResult.lng
  );

  // Calculate fee
  const feeResult = calculateDeliveryFee(distance);

  if (!feeResult.isWithinRange) {
    return {
      success: false,
      distance,
      message: feeResult.message,
    };
  }

  return {
    success: true,
    fee: feeResult.fee,
    distance,
    message: feeResult.message,
    formattedAddress: geocodeResult.formattedAddress,
  };
}

/**
 * Fallback delivery fee calculator without Google API
 * Uses simple distance estimation based on postal code or area keywords
 */
export function estimateDeliveryFee(address: string): {
  fee: number;
  message: string;
} {
  const addressLower = address.toLowerCase();

  // Check for Yokosuka postal codes (238-xxxx)
  if (addressLower.includes('238-') || addressLower.includes('yokosuka') || addressLower.includes('横須賀')) {
    // Within Yokosuka city - assume close
    return {
      fee: 500,
      message: 'Estimated delivery fee: ¥500 (within Yokosuka)',
    };
  }

  // Check for nearby cities
  const nearbyCities = [
    { name: 'yokohama', fee: 1000 },
    { name: '横浜', fee: 1000 },
    { name: 'kamakura', fee: 800 },
    { name: '鎌倉', fee: 800 },
    { name: 'zushi', fee: 600 },
    { name: '逗子', fee: 600 },
    { name: 'miura', fee: 700 },
    { name: '三浦', fee: 700 },
  ];

  for (const city of nearbyCities) {
    if (addressLower.includes(city.name)) {
      return {
        fee: city.fee,
        message: `Estimated delivery fee: ¥${city.fee}`,
      };
    }
  }

  // Default fee
  return {
    fee: 800,
    message: 'Estimated delivery fee: ¥800 (exact fee will be confirmed)',
  };
}
