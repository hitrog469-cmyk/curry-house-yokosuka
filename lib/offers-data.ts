// Current Offers and Promotions at The Curry House Yokosuka
// Updated with proper OfferRule structure for automatic application

import { OfferRule } from './offer-engine'

// Legacy type for backwards compatibility with existing offer display pages
export type Offer = {
  id: string
  title: string
  titleJp: string
  description: string
  descriptionJp: string
  discount?: string
  validUntil: string
  restrictions?: string
  restrictionsJp?: string
  emoji: string
  color: 'orange' | 'green' | 'red' | 'blue' | 'purple'
  isActive: boolean
}

// New offer rules for automatic detection and application
export const offerRules: OfferRule[] = [
  {
    id: 'lunch-discount',
    type: 'percentage',
    title: 'Lunch Time Special',
    titleJp: 'ランチタイム限定',
    description: 'Enjoy 15% off your entire meal when you dine with us during lunch hours!',
    descriptionJp: 'ランチタイムに15%割引でお食事をお楽しみください',
    applicableItems: ['all'],  // All menu items
    discountValue: 15,  // 15% off
    timeWindows: [{
      start: '11:00',
      end: '15:00',
      days: [1, 2, 3, 4, 5, 6, 7]  // Every day
    }],
    combinable: false,  // Cannot combine with other offers
    restrictions: 'Valid Monday through Sunday, 11:00 AM to 3:00 PM. Dine-in orders only. Cannot be combined with other promotional offers or discounts. Discount applied automatically at checkout.',
    restrictionsJp: '毎日11:00～15:00。店内飲食のみ。他の割引との併用不可。チェックアウト時に自動適用されます。',
    emoji: '🌞',
    color: 'green',
    isActive: true
  },
  {
    id: 'happy-hour-beer',
    type: 'bogo',
    title: 'Happy Hour - Draft Beer BOGO',
    titleJp: 'ハッピーアワー生ビール',
    description: 'Buy one draft beer and get another one absolutely free during our punch hours!',
    descriptionJp: 'パンチアワーに生ビールを1杯ご注文で、もう1杯無料！',
    applicableItems: ['drink-beer-draft'],  // TODO: Update with actual beer item IDs from menu
    discountValue: 0,  // BOGO = second item free
    timeWindows: [{
      start: '14:00',
      end: '19:00',
      days: [1, 2, 3, 4, 5, 6, 7]  // Every day
    }],
    minQuantity: 2,  // Must order at least 2 beers
    maxApplications: 1,  // One BOGO per customer
    combinable: true,  // Can combine with other offers
    restrictions: 'Available daily from 2:00 PM to 7:00 PM. Must be 20 years or older to order. Limit one BOGO offer per customer per visit. Valid for draft beer only. Discount applied automatically when you add 2 or more draft beers.',
    restrictionsJp: '毎日14:00～19:00。20歳以上のお客様のみ。お一人様1回限り。生ビールのみ対象。生ビールを2杯以上追加すると自動適用されます。',
    emoji: '🍺',
    color: 'orange',
    isActive: true
  },
  {
    id: 'margarita-combo',
    type: 'bundle',
    title: 'Weekday Margarita Combo',
    titleJp: '平日マルゲリータコンボ',
    description: 'Get our delicious margarita paired with your choice of chips & dip for just ¥1000!',
    descriptionJp: 'マルゲリータとチップス＆ディップのセットでたったの¥1000！',
    applicableItems: ['mar-1', 'start-2'],  // TODO: Update with actual margarita + chips item IDs
    discountValue: 1000,  // Fixed bundle price
    timeWindows: [{
      start: '11:00',
      end: '22:00',
      days: [1, 2, 3, 4, 5]  // Monday to Friday only
    }],
    combinable: false,
    restrictions: 'Available Monday through Friday only, all day long. Choose from Regular Margarita or Fruit Margarita, paired with Chips & Guacamole or Chips & Pico de Gallo. Bundle discount applied automatically when both items are in your cart. While supplies last.',
    restrictionsJp: '月曜日から金曜日のみ、終日利用可能。レギュラーまたはフルーツマルゲリータから選択、チップス＆グアカモレまたはチップス＆ピコデガヨ付き。両方のアイテムがカートに入ると自動的にバンドル割引が適用されます。在庫がなくなり次第終了。',
    emoji: '🎉',
    color: 'purple',
    isActive: true
  }
]

// Legacy offers array for backwards compatibility with existing offer display pages
export const offers: Offer[] = offerRules.map(rule => ({
  id: rule.id,
  title: rule.title,
  titleJp: rule.titleJp,
  description: rule.description,
  descriptionJp: rule.descriptionJp,
  discount: rule.type === 'percentage'
    ? `${rule.discountValue}% OFF`
    : rule.type === 'fixed_amount'
    ? `¥${rule.discountValue} OFF`
    : rule.type === 'bogo'
    ? 'Buy 1 Get 1 Free'
    : `¥${rule.discountValue} Only`,
  validUntil: rule.timeWindows.map(w => `${w.start} - ${w.end}`).join(', '),
  restrictions: rule.restrictions,
  restrictionsJp: rule.restrictionsJp,
  emoji: rule.emoji,
  color: rule.color,
  isActive: rule.isActive
}))

export const getActiveOffers = () => offers.filter(offer => offer.isActive)
export const getActiveOfferRules = () => offerRules.filter(rule => rule.isActive)
