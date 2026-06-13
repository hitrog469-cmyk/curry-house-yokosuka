/**
 * Site-wide feature switches.
 *
 * ORDERING_ENABLED is the master kill switch for online order placement
 * (delivery checkout, table ordering, add-to-cart). Set it to true and
 * redeploy to re-enable ordering. Login, menu browsing and every other
 * feature are unaffected by this flag.
 */
export const ORDERING_ENABLED = false

export const ORDERING_DISABLED_MESSAGE =
  'Online ordering is launching soon. Please call us or visit the restaurant to place your order — we look forward to serving you!'
