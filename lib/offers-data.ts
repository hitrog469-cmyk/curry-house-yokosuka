// Current Offers and Promotions at The Curry House Yokosuka

export type Offer = {
  id: string
  title: string
  titleJp: string
  description: string
  descriptionJp: string
  discount?: string  // e.g. "15% OFF", "¥500 OFF"
  validUntil: string  // e.g. "11:00 TO 15:00", "MON - FRI", "EVERYDAY"
  restrictions?: string
  restrictionsJp?: string
  emoji: string
  color: 'orange' | 'green' | 'red' | 'blue' | 'purple'
  isActive: boolean
}

export const offers: Offer[] = [
  {
    id: 'happy-hour',
    title: 'HAPPY HOUR',
    titleJp: 'ハッピーアワー',
    description: '**BUY 1 DRAFT BEER GET ANOTHER FOR FREE @ ¥500',
    descriptionJp: '生ビール1杯購入で、もう1杯無料 @ ¥500',
    validUntil: 'EVERYDAY 20+ ONLY',
    restrictions: 'PUNCH 2:3-2:7PM ONLY • ONE TIME FOR ONE CUSTOMER',
    restrictionsJp: 'パンチ 14時～19時のみ • お一人様1回限り',
    emoji: '🍺',
    color: 'orange',
    isActive: true
  },
  {
    id: 'lunch-discount',
    title: 'LUNCH TIME ONLY',
    titleJp: 'ランチタイム限定',
    description: '15% OFF Total Discount',
    descriptionJp: '合計15%割引',
    validUntil: '11:00 TO 15:00',
    restrictions: '@thecurryh',
    restrictionsJp: '@thecurryh',
    emoji: '🌞',
    color: 'green',
    isActive: true
  },
  {
    id: 'happy-hour-extended',
    title: 'HAPPY HOUR',
    titleJp: 'ハッピーアワー',
    description: 'Only @ ¥1000',
    descriptionJp: 'たったの¥1000',
    discount: '¥1000 ONLY',
    validUntil: 'EVERYDAY MON - FRI',
    restrictions: 'Fruit Margarita + Chips & Guacamole | Chips & Pico de Gallo or | Only @ ¥1000 | Regular Margarita + Chips & Pico de Gallo or | Chips & Guacamole',
    restrictionsJp: 'フルーツマルガリータ + チップス&グアカモレ / ピコデガヨ または レギュラーマルガリータ + チップス&ピコデガヨ / グアカモレ',
    emoji: '🎉',
    color: 'purple',
    isActive: true
  }
]

export const getActiveOffers = () => offers.filter(offer => offer.isActive)
