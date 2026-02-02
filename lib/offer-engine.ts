// Offer Engine: Automatic offer detection and application
// Handles time-based validation, discount calculations, and offer eligibility

import { getJapanTime, parseTimeToMinutes, getMinutesSinceMidnight } from './restaurant-hours'

export type OfferType = 'percentage' | 'fixed_amount' | 'bogo' | 'bundle'

/**
 * Get day of week as number (1=Mon, 2=Tue, ..., 7=Sun)
 */
function getDayNumber(date: Date): number {
  const day = date.getDay()
  // Convert from JavaScript day (0=Sun) to our format (1=Mon, 7=Sun)
  return day === 0 ? 7 : day
}

export type TimeWindow = {
  start: string  // "HH:mm" format
  end: string    // "HH:mm" format
  days: number[] // 1=Mon, 2=Tue, ..., 7=Sun
}

export type OfferRule = {
  id: string
  type: OfferType
  title: string
  titleJp: string
  description: string
  descriptionJp: string
  applicableItems: string[]  // menu item IDs, or ['all'] for everything
  discountValue: number      // percentage (15), fixed amount (500), or 0 for BOGO
  timeWindows: TimeWindow[]
  minQuantity?: number       // Minimum items required
  maxApplications?: number   // Max times offer can be used
  combinable: boolean        // Can combine with other offers
  restrictions: string
  restrictionsJp: string
  emoji: string
  color: 'orange' | 'green' | 'red' | 'blue' | 'purple'
  isActive: boolean
}

export type CartItem = {
  itemId: string
  quantity: number
  price: number
  name?: string
  spiceLevel?: string
}

export type AppliedOffer = {
  offerId: string
  offerName: string
  offerType: OfferType
  itemIds: string[]
  discountAmount: number
  accepted: boolean
  reason?: string  // Why offer was applied or not
}

export type EligibilityResult = {
  eligible: boolean
  reason?: string
}

/**
 * Check if an offer is currently eligible based on time and day
 */
export function checkOfferEligibility(
  offer: OfferRule,
  currentTime?: Date
): EligibilityResult {
  if (!offer.isActive) {
    return { eligible: false, reason: 'Offer is not active' }
  }

  const now = currentTime || getJapanTime()
  const currentMinutes = getMinutesSinceMidnight(now)
  const currentDay = getDayNumber(now)

  // Check if current time falls within any of the offer's time windows
  const isInTimeWindow = offer.timeWindows.some(window => {
    // Check day of week
    if (!window.days.includes(currentDay)) {
      return false
    }

    // Check time range
    const startMinutes = parseTimeToMinutes(window.start)
    const endMinutes = parseTimeToMinutes(window.end)

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes
  })

  if (!isInTimeWindow) {
    // Find next available window for messaging
    const nextWindow = offer.timeWindows[0]
    const days = nextWindow.days.map(d => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][d - 1]).join(', ')
    return {
      eligible: false,
      reason: `Available ${nextWindow.start} - ${nextWindow.end} (${days})`
    }
  }

  return { eligible: true }
}

/**
 * Calculate discount for a percentage-based offer
 */
function calculatePercentageDiscount(
  offer: OfferRule,
  items: CartItem[]
): number {
  const applicableItems = items.filter(item =>
    offer.applicableItems.includes('all') || offer.applicableItems.includes(item.itemId)
  )

  const subtotal = applicableItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  return Math.floor(subtotal * (offer.discountValue / 100))
}

/**
 * Calculate discount for a fixed amount offer
 */
function calculateFixedDiscount(
  offer: OfferRule,
  items: CartItem[]
): number {
  const applicableItems = items.filter(item =>
    offer.applicableItems.includes('all') || offer.applicableItems.includes(item.itemId)
  )

  if (applicableItems.length === 0) return 0

  // Fixed discount applies once if conditions are met
  return offer.discountValue
}

/**
 * Calculate discount for a Buy-One-Get-One (BOGO) offer
 */
function calculateBOGODiscount(
  offer: OfferRule,
  items: CartItem[]
): number {
  const applicableItems = items.filter(item =>
    offer.applicableItems.includes(item.itemId)
  )

  if (applicableItems.length === 0) return 0

  // For BOGO: count total quantity, pair them up, free item = cheapest in each pair
  const totalQty = applicableItems.reduce((sum, item) => sum + item.quantity, 0)

  // Check minimum quantity requirement
  if (offer.minQuantity && totalQty < offer.minQuantity) {
    return 0
  }

  // Number of free items = floor(totalQty / 2)
  const freePairs = Math.floor(totalQty / 2)

  // Apply max applications limit
  const actualPairs = offer.maxApplications
    ? Math.min(freePairs, offer.maxApplications)
    : freePairs

  // Discount = price of cheapest item × number of pairs
  const cheapestPrice = Math.min(...applicableItems.map(i => i.price))
  return cheapestPrice * actualPairs
}

/**
 * Calculate discount for a bundle offer
 */
function calculateBundleDiscount(
  offer: OfferRule,
  items: CartItem[]
): number {
  // Check if all required items are in cart
  const hasAllItems = offer.applicableItems.every(requiredId =>
    items.some(item => item.itemId === requiredId)
  )

  if (!hasAllItems) return 0

  // Calculate total price of bundle items
  const bundleItems = items.filter(item => offer.applicableItems.includes(item.itemId))
  const bundleTotal = bundleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  // Discount = (bundle total - fixed bundle price)
  // discountValue for bundles is the BUNDLE PRICE, not the discount amount
  const discount = bundleTotal - offer.discountValue

  return discount > 0 ? discount : 0
}

/**
 * Calculate the discount amount for a specific offer
 */
export function calculateOfferDiscount(
  offer: OfferRule,
  items: CartItem[]
): number {
  switch (offer.type) {
    case 'percentage':
      return calculatePercentageDiscount(offer, items)
    case 'fixed_amount':
      return calculateFixedDiscount(offer, items)
    case 'bogo':
      return calculateBOGODiscount(offer, items)
    case 'bundle':
      return calculateBundleDiscount(offer, items)
    default:
      return 0
  }
}

/**
 * Detect all applicable offers for the current cart
 */
export function detectApplicableOffers(
  cartItems: CartItem[],
  offerRules: OfferRule[],
  currentTime?: Date
): AppliedOffer[] {
  const applicableOffers: AppliedOffer[] = []

  for (const offer of offerRules) {
    // Check time eligibility
    const eligibility = checkOfferEligibility(offer, currentTime)

    if (!eligibility.eligible) {
      // Still return ineligible offers with reason for UI display
      applicableOffers.push({
        offerId: offer.id,
        offerName: offer.title,
        offerType: offer.type,
        itemIds: [],
        discountAmount: 0,
        accepted: false,
        reason: eligibility.reason
      })
      continue
    }

    // Calculate discount
    const discountAmount = calculateOfferDiscount(offer, cartItems)

    if (discountAmount > 0) {
      // Identify which items this offer applies to
      const applicableItemIds = cartItems
        .filter(item =>
          offer.applicableItems.includes('all') || offer.applicableItems.includes(item.itemId)
        )
        .map(item => item.itemId)

      applicableOffers.push({
        offerId: offer.id,
        offerName: offer.title,
        offerType: offer.type,
        itemIds: applicableItemIds,
        discountAmount,
        accepted: true,  // Default to accepted
        reason: eligibility.reason
      })
    }
  }

  return applicableOffers.filter(offer => offer.discountAmount > 0)
}

/**
 * Apply offers to cart and calculate final totals
 */
export function applyOffersToCart(
  cartItems: CartItem[],
  detectedOffers: AppliedOffer[],
  acceptedOfferIds: string[]
): {
  originalTotal: number
  discountTotal: number
  appliedOffers: AppliedOffer[]
  savings: number
} {
  // Calculate original total
  const originalTotal = cartItems.reduce(
    (sum, item) => sum + (item.price * item.quantity),
    0
  )

  // Filter to only accepted offers
  const appliedOffers = detectedOffers
    .filter(offer => acceptedOfferIds.includes(offer.offerId))
    .filter(offer => offer.accepted)

  // Calculate total discount (handle non-combinable offers)
  let totalDiscount = 0

  // Check if any non-combinable offers are present
  const hasNonCombinable = appliedOffers.some(offer =>
    !detectedOffers.find(o => o.offerId === offer.offerId)
  )

  if (hasNonCombinable) {
    // If there are non-combinable offers, use only the best one
    totalDiscount = Math.max(...appliedOffers.map(o => o.discountAmount))
  } else {
    // All offers are combinable, sum them up
    totalDiscount = appliedOffers.reduce((sum, offer) => sum + offer.discountAmount, 0)
  }

  const discountTotal = Math.max(originalTotal - totalDiscount, 0)

  return {
    originalTotal,
    discountTotal,
    appliedOffers,
    savings: totalDiscount
  }
}

/**
 * Format offer time window for display
 */
export function formatOfferTimeWindow(offer: OfferRule): string {
  if (offer.timeWindows.length === 0) return 'Anytime'

  const window = offer.timeWindows[0]
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const days = window.days.map(d => dayNames[d - 1]).join(', ')

  return `${window.start} - ${window.end} (${days})`
}
