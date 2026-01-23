export function formatPrice(price: number): string {
  return `¥${price.toLocaleString()}`
}

export function formatPhoneNumber(phone: string): string {
  return phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
}

export const ORDER_STATUS = {
  PENDING: 'pending',
  PREPARING: 'preparing',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
} as const

export const USER_ROLES = {
  CUSTOMER: 'customer',
  STAFF: 'staff',
  ADMIN: 'admin'
} as const