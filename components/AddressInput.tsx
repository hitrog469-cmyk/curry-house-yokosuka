'use client';

import { useState, useEffect, useRef } from 'react';
import { estimateDeliveryFee, getDeliveryFeeFromAddress } from '@/lib/delivery-fee';

type AddressInputProps = {
  value: string;
  onChange: (address: string) => void;
  onDeliveryFeeCalculated: (fee: number, distance?: number) => void;
  required?: boolean;
};

export default function AddressInput({
  value,
  onChange,
  onDeliveryFeeCalculated,
  required = false,
}: AddressInputProps) {
  const [calculating, setCalculating] = useState(false);
  const [deliveryMessage, setDeliveryMessage] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);

  // Load Google Maps script
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.warn('Google Maps API key not configured. Using fallback address input.');
      return;
    }

    // Check if already loaded
    if (window.google?.maps?.places) {
      setIsGoogleMapsLoaded(true);
      return;
    }

    // Load script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&region=JP&language=ja`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsGoogleMapsLoaded(true);
    script.onerror = () => {
      console.error('Failed to load Google Maps');
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, []);

  // Initialize Google Maps Autocomplete
  useEffect(() => {
    if (!isGoogleMapsLoaded || !inputRef.current) return;

    try {
      // Initialize autocomplete
      autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'jp' }, // Restrict to Japan
        fields: ['formatted_address', 'geometry', 'address_components'],
        types: ['address'],
      });

      // Set bias to Yokosuka area
      autocompleteRef.current.setBounds({
        north: 35.32,
        south: 35.24,
        east: 139.72,
        west: 139.62,
      });

      // Listen for place selection
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        if (place?.formatted_address) {
          onChange(place.formatted_address);
          calculateDeliveryFee(place.formatted_address);
        }
      });
    } catch (error) {
      console.error('Error initializing Google Maps Autocomplete:', error);
    }
  }, [isGoogleMapsLoaded]);

  // Calculate delivery fee when address changes (with debounce)
  useEffect(() => {
    if (!value || value.length < 10) {
      setDeliveryMessage('');
      setDeliveryStatus('idle');
      return;
    }

    const timer = setTimeout(() => {
      calculateDeliveryFee(value);
    }, 1000); // Wait 1 second after user stops typing

    return () => clearTimeout(timer);
  }, [value]);

  async function calculateDeliveryFee(address: string) {
    if (!address || address.length < 10) return;

    setCalculating(true);
    setDeliveryStatus('idle');

    try {
      // Try Google Maps API first
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

      if (apiKey) {
        const result = await getDeliveryFeeFromAddress(address);

        if (result.success && result.fee !== undefined) {
          onDeliveryFeeCalculated(result.fee, result.distance);
          setDeliveryMessage(result.message);
          setDeliveryStatus('success');
        } else {
          // Fall back to estimation
          const estimate = estimateDeliveryFee(address);
          onDeliveryFeeCalculated(estimate.fee);
          setDeliveryMessage(estimate.message + ' ⚠️');
          setDeliveryStatus('error');
        }
      } else {
        // Use fallback estimation
        const estimate = estimateDeliveryFee(address);
        onDeliveryFeeCalculated(estimate.fee);
        setDeliveryMessage(estimate.message);
        setDeliveryStatus('success');
      }
    } catch (error) {
      console.error('Error calculating delivery fee:', error);
      const estimate = estimateDeliveryFee(address);
      onDeliveryFeeCalculated(estimate.fee);
      setDeliveryMessage(estimate.message + ' (estimation)');
      setDeliveryStatus('error');
    } finally {
      setCalculating(false);
    }
  }

  return (
    <div>
      <label className="block font-semibold mb-2">
        Delivery Address {required && '*'}
      </label>
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-curry-primary focus:border-transparent h-24 resize-none"
        placeholder={
          isGoogleMapsLoaded
            ? 'Start typing your address... (autocomplete enabled)'
            : 'Enter your full delivery address'
        }
        required={required}
      />

      {/* Calculating indicator */}
      {calculating && (
        <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Calculating delivery fee...</span>
        </div>
      )}

      {/* Delivery fee message */}
      {!calculating && deliveryMessage && (
        <div
          className={`mt-2 p-3 rounded-lg text-sm ${
            deliveryStatus === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : deliveryStatus === 'error'
              ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
              : 'bg-gray-50 text-gray-600'
          }`}
        >
          <div className="flex items-start gap-2">
            <span className="text-lg">
              {deliveryStatus === 'success' ? '✅' : deliveryStatus === 'error' ? '⚠️' : 'ℹ️'}
            </span>
            <div>
              <p className="font-semibold">{deliveryMessage}</p>
              {deliveryStatus === 'error' && (
                <p className="text-xs mt-1 opacity-75">
                  Exact fee will be confirmed after order placement.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Helper text */}
      <p className="text-xs text-gray-500 mt-2">
        {isGoogleMapsLoaded ? (
          <>
            📍 Start typing and select from suggestions for accurate delivery fee calculation.
            Maximum delivery distance: 50km from restaurant.
          </>
        ) : (
          <>📍 Please enter your complete address including postal code for delivery.</>
        )}
      </p>
    </div>
  );
}

// Extend Window interface for Google Maps
declare global {
  interface Window {
    google?: typeof google;
  }
}
