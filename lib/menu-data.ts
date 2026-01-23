// Complete Menu Data from The Curry House Yokosuka
// All prices in Japanese Yen (Tax Included)

export type AddOn = {
  name: string
  price: number
  note?: string
}

export type MenuItem = {
  id: string
  name: string
  nameJp: string
  price: number
  category: string
  subcategory?: string
  description?: string
  isRecommended?: boolean
  spiceLevel?: 'MILD' | 'NORMAL' | 'MEDIUM' | 'HOT' | 'VERY HOT'
  notes?: string
  addOns?: AddOn[]
  variations?: { name: string; price: number }[]
  suggestedItems?: { id: string; name: string; price: number }[] // Related items to suggest
}

export const menuCategories = [
  { id: 'all', name: 'All Items', nameJp: '全て', cuisine: 'All' },
  { id: 'recommended', name: 'Chef\'s Recommendations', nameJp: 'おすすめ', cuisine: 'All' },
  { id: 'sets', name: 'Set Meals', nameJp: 'セット', cuisine: 'Indian/Nepalese' },
  { id: 'starters', name: 'Appetizers', nameJp: '前菜', cuisine: 'Fusion' },
  { id: 'tandoori', name: 'Tandoori Grills', nameJp: 'タンドリー', cuisine: 'Indian' },
  { id: 'vegetable_curry', name: 'Vegetarian Curries', nameJp: '野菜カレー', cuisine: 'Indian' },
  { id: 'seafood_curry', name: 'Seafood Curries', nameJp: 'シーフードカレー', cuisine: 'Indian' },
  { id: 'chicken_curry', name: 'Chicken Curries', nameJp: 'チキンカレー', cuisine: 'Indian' },
  { id: 'mutton_curry', name: 'Lamb Curries', nameJp: 'マトンカレー', cuisine: 'Indian' },
  { id: 'keema_curry', name: 'Minced Meat Curries', nameJp: 'キーマカレー', cuisine: 'Indian' },
  { id: 'special_curry', name: 'Specialty Curries', nameJp: 'スペシャルカレー', cuisine: 'Indian' },
  { id: 'naan', name: 'Indian Breads', nameJp: 'ナーン', cuisine: 'Indian' },
  { id: 'mexican', name: 'Mexican Classics', nameJp: 'メキシカン', cuisine: 'Mexican' },
  { id: 'fried', name: 'Fried Delights', nameJp: '揚げ物', cuisine: 'Fusion' },
  { id: 'rice', name: 'Rice & Biryani', nameJp: 'ライス&ビリヤニ', cuisine: 'Indian/Japanese' },
  { id: 'snacks', name: 'Light Bites', nameJp: 'スナックス', cuisine: 'Fusion' },
  { id: 'drinks', name: 'Soft Drinks', nameJp: 'ドリンク', cuisine: 'All' },
  { id: 'mocktails', name: 'Mocktails', nameJp: 'モクテル', cuisine: 'All' },
  { id: 'cocktails', name: 'Cocktails & Beer', nameJp: 'カクテル', cuisine: 'All' },
  { id: 'margaritas', name: 'Margaritas', nameJp: 'マルゲリータ', cuisine: 'Mexican' },
]

export const sortOptions = [
  { id: 'default', name: 'Default Order' },
  { id: 'name_asc', name: 'Name (A-Z)' },
  { id: 'name_desc', name: 'Name (Z-A)' },
  { id: 'price_asc', name: 'Price (Low to High)' },
  { id: 'price_desc', name: 'Price (High to Low)' },
  { id: 'popular', name: 'Most Popular' },
]

export const menuItems: MenuItem[] = [
  // SET MEALS
  { id: 'set-1', name: 'Cheese Naan Set', nameJp: 'チーズナンセット', price: 1800, category: 'sets', description: 'Choose any 2 curries, cheese naan, soft drink, mini rice & salad' },
  { id: 'set-2', name: '1 Curry Set', nameJp: 'ワンカレーセット', price: 1500, category: 'sets', description: 'Choose any 1 curry, plain or any naan/rice, soft drink, mini rice & salad' },
  { id: 'set-3', name: 'Yokosuka Set', nameJp: '横須賀セット', price: 1700, category: 'sets', description: 'Choose any 2 curries, plain or any naan/rice, soft drink, mini rice & salad' },
  { id: 'set-4', name: 'CFAY Set', nameJp: 'シーフェセット', price: 2200, category: 'sets', description: 'Choose any 2 curries, plain or any naan/rice, soft drink, mini rice & salad, 1 Seek Kabab, 1 Chicken Tikka, 1 Tandoori Chicken' },
  { id: 'set-5', name: 'Nepalese Traditional Thakali Meal', nameJp: 'ネパール伝統のタカリ料理', price: 2000, category: 'sets', description: 'Complete traditional Nepalese meal with rice, lentil curry, vegetable curry, mutton curry, papad, yogurt, cucumber & carrot slice, chutney' },

  // STARTERS
  { id: 'start-1', name: 'Chips & Guacamole', nameJp: 'チップス & グアカモレ', price: 950, category: 'starters' },
  {
    id: 'start-2',
    name: 'Chips & Pico de Gallo',
    nameJp: 'チップス & ピコデガヨ',
    price: 800,
    category: 'starters',
    suggestedItems: [{ id: 'start-queso', name: 'Queso Dip', price: 300 }]
  },
  { id: 'start-queso', name: 'Queso Dip', nameJp: 'ケソディップ', price: 300, category: 'starters', description: 'Creamy cheese dip' },
  {
    id: 'start-3',
    name: 'Mini Quesadilla',
    nameJp: 'ミニケサディヤ',
    price: 650,
    category: 'starters',
    subcategory: 'Mini Quesadilla',
    variations: [
      { name: 'Cheese', price: 650 },
      { name: 'Chicken', price: 700 },
      { name: 'Beef', price: 850 }
    ]
  },
  {
    id: 'start-6',
    name: 'Quesadilla',
    nameJp: 'ケサディヤ',
    price: 950,
    category: 'starters',
    subcategory: 'Full Quesadilla',
    variations: [
      { name: 'Cheese', price: 950 },
      { name: 'Chicken', price: 1000 },
      { name: 'Beef', price: 1150 }
    ]
  },
  { id: 'start-9', name: 'Caesar Salad', nameJp: 'シーザーサラダ', price: 700, category: 'starters' },
  { id: 'start-10', name: 'Kuchumber Salad', nameJp: 'クチュンバーサラダ', price: 700, category: 'starters' },
  { id: 'start-11', name: 'Nachos', nameJp: 'ナチョス', price: 800, category: 'starters' },

  // TANDOORI ITEMS
  { id: 'tand-1', name: 'Tandoori Chicken 3Pcs', nameJp: 'タンドリーチキン3個', price: 1200, category: 'tandoori', isRecommended: true },
  { id: 'tand-2', name: 'Chicken Tikka 3Pcs', nameJp: 'チキンティッカ3個', price: 1100, category: 'tandoori' },
  { id: 'tand-3', name: 'Garlic Chicken Tikka 3Pcs', nameJp: 'ガーリックチキンティッカ3個', price: 1200, category: 'tandoori' },
  { id: 'tand-4', name: 'Spicy Garlic Chicken Tikka 3Pcs', nameJp: 'スパイシーガーリックチキンティッカ3個', price: 1300, category: 'tandoori' },
  { id: 'tand-5', name: 'Seek Kabab 3Pcs', nameJp: 'シーケバブ3個', price: 1100, category: 'tandoori' },
  { id: 'tand-6', name: 'Tandoori Lamb Chop', nameJp: 'タンドリーラムチョップ', price: 1500, category: 'tandoori', isRecommended: true },

  // VEGETABLE CURRIES
  { id: 'veg-1', name: 'Vegetable Curry', nameJp: '野菜カレー', price: 1000, category: 'vegetable_curry', isRecommended: true, spiceLevel: 'NORMAL' },
  { id: 'veg-2', name: 'Paneer Makhani', nameJp: 'パニールマカニー', price: 1000, category: 'vegetable_curry', isRecommended: true, spiceLevel: 'MILD' },
  { id: 'veg-3', name: 'Chana Masala', nameJp: 'チャナマサラ', price: 1000, category: 'vegetable_curry', spiceLevel: 'NORMAL' },
  { id: 'veg-4', name: 'Dal Tadka (Lentils)', nameJp: 'ダルタドカ (レンズ豆)', price: 1000, category: 'vegetable_curry', spiceLevel: 'NORMAL' },
  { id: 'veg-5', name: 'Tomato & Eggplant', nameJp: 'トマト&なす', price: 1000, category: 'vegetable_curry', spiceLevel: 'NORMAL' },
  { id: 'veg-6', name: 'Spinach Paneer', nameJp: 'ほうれん草パニール', price: 1000, category: 'vegetable_curry', spiceLevel: 'MILD' },

  // SEAFOOD CURRIES
  { id: 'sea-1', name: 'Seafood Curry', nameJp: 'シーフードカレー', price: 1100, category: 'seafood_curry', spiceLevel: 'NORMAL' },
  { id: 'sea-2', name: 'Butter Shrimp', nameJp: 'バター海老', price: 1150, category: 'seafood_curry', spiceLevel: 'MILD' },
  { id: 'sea-3', name: 'Shrimp Masala', nameJp: '海老マサラ', price: 1150, category: 'seafood_curry', spiceLevel: 'NORMAL' },
  { id: 'sea-4', name: 'Spinach Shrimp', nameJp: 'ほうれん草海老', price: 1200, category: 'seafood_curry', spiceLevel: 'MILD' },

  // CHICKEN CURRIES
  { id: 'chk-1', name: 'Butter Chicken', nameJp: 'バターチキン', price: 1150, category: 'chicken_curry', isRecommended: true, spiceLevel: 'MILD' },
  { id: 'chk-2', name: 'Chicken Curry', nameJp: 'チキンカレー', price: 1050, category: 'chicken_curry', spiceLevel: 'NORMAL' },
  { id: 'chk-3', name: 'Chicken Tikka Masala', nameJp: 'チキンティッカマサラ', price: 1150, category: 'chicken_curry', isRecommended: true, spiceLevel: 'NORMAL' },
  { id: 'chk-4', name: 'Spinach Chicken', nameJp: 'ほうれん草チキン', price: 1150, category: 'chicken_curry', spiceLevel: 'MILD' },
  { id: 'chk-5', name: 'Coconut Chicken', nameJp: 'ココナッツチキン', price: 1200, category: 'chicken_curry', spiceLevel: 'MILD' },
  { id: 'chk-6', name: 'Pumpkin Chicken', nameJp: 'かぼちゃチキン', price: 1200, category: 'chicken_curry', spiceLevel: 'MILD' },
  { id: 'chk-7', name: 'Chicken Do Pyaza', nameJp: 'チキン・ド・ピアザ', price: 1200, category: 'chicken_curry', spiceLevel: 'NORMAL' },
  { id: 'chk-8', name: 'Chicken Vindaloo', nameJp: 'チキンビンダルー', price: 1450, category: 'chicken_curry', spiceLevel: 'HOT' },

  // MUTTON CURRIES
  { id: 'mut-1', name: 'Mutton Curry', nameJp: 'マトンカレー', price: 1050, category: 'mutton_curry', isRecommended: true, spiceLevel: 'NORMAL' },
  { id: 'mut-2', name: 'Mutton Masala', nameJp: 'マトンマサラ', price: 1150, category: 'mutton_curry', spiceLevel: 'NORMAL' },
  { id: 'mut-3', name: 'Spinach Mutton', nameJp: 'ほうれん草マトン', price: 1200, category: 'mutton_curry', spiceLevel: 'MILD' },
  { id: 'mut-4', name: 'Dal Mutton', nameJp: 'ダル(レンズ豆)マトン', price: 1150, category: 'mutton_curry', spiceLevel: 'NORMAL' },
  { id: 'mut-5', name: 'Mutton Vindaloo', nameJp: 'マトンビンダルー', price: 1500, category: 'mutton_curry', spiceLevel: 'HOT' },
  { id: 'mut-6', name: 'Mutton Do Pyaza', nameJp: 'マトン・ド・ピアザ', price: 1200, category: 'mutton_curry', spiceLevel: 'NORMAL' },

  // KEEMA CURRIES
  { id: 'kee-1', name: 'Keema Curry', nameJp: 'キーマカレー', price: 1050, category: 'keema_curry', spiceLevel: 'NORMAL' },
  { id: 'kee-2', name: 'Keema Cheese', nameJp: 'キーマチーズ', price: 1200, category: 'keema_curry', isRecommended: true, spiceLevel: 'NORMAL' },
  { id: 'kee-3', name: 'Keema Egg', nameJp: 'キーマ玉子', price: 1150, category: 'keema_curry', spiceLevel: 'NORMAL' },
  { id: 'kee-4', name: 'Keema Spinach', nameJp: 'キーマほうれん草', price: 1200, category: 'keema_curry', spiceLevel: 'MILD' },

  // SPECIAL CURRIES
  { id: 'spe-1', name: 'Spicy Garlic Chicken Dry Curry', nameJp: 'スパイシーガーリックチキンドライカレー', price: 1600, category: 'special_curry', notes: '+¥600 for Set A, +¥400 for other sets', spiceLevel: 'HOT' },
  { id: 'spe-2', name: 'Spicy Garlic Mutton Dry Curry', nameJp: 'スパイシーガーリックマトンドライカレー', price: 1600, category: 'special_curry', notes: '+¥600 for Set A, +¥400 for other sets', spiceLevel: 'HOT' },
  { id: 'spe-3', name: 'Tandoori Chicken Masala Curry', nameJp: 'タンドリーチキンマサラカレー', price: 1700, category: 'special_curry', spiceLevel: 'NORMAL' },
  { id: 'spe-4', name: 'Lamb Chop Masala Curry', nameJp: 'ラムチョップマサラカレー', price: 1700, category: 'special_curry', isRecommended: true, spiceLevel: 'NORMAL' },

  // NAAN & BREAD
  { id: 'naan-1', name: 'Plain Naan', nameJp: 'プレーンナン', price: 400, category: 'naan', description: 'Traditional Indian flatbread baked in tandoor' },
  {
    id: 'naan-2',
    name: 'Cheese Naan',
    nameJp: 'チーズナン',
    price: 750,
    category: 'naan',
    description: 'Naan stuffed with melted cheese',
    addOns: [{ name: 'Upgrade in Set Menu', price: 350, note: 'When ordered with set' }]
  },
  {
    id: 'naan-3',
    name: 'Garlic Naan',
    nameJp: 'ガーリックナン',
    price: 500,
    category: 'naan',
    description: 'Naan topped with fresh garlic and butter',
    addOns: [{ name: 'Upgrade in Set Menu', price: 250, note: 'When ordered with set' }]
  },
  {
    id: 'naan-4',
    name: 'Cheese Garlic Naan',
    nameJp: 'チーズガーリックナン',
    price: 850,
    category: 'naan',
    isRecommended: true,
    description: 'Cheese-stuffed naan with aromatic garlic',
    addOns: [{ name: 'Upgrade in Set Menu', price: 450, note: 'When ordered with set' }]
  },
  { id: 'naan-5', name: 'Honey Naan', nameJp: 'ハニーナン', price: 500, category: 'naan', notes: '+¥250 for upgrade' },
  { id: 'naan-6', name: 'Honey Cheese Garlic Naan', nameJp: 'ハチミツチーズガーリックナン', price: 900, category: 'naan', notes: '+¥450 for upgrade' },
  { id: 'naan-7', name: 'Plain Paratha', nameJp: 'プレーンパラター', price: 500, category: 'naan', notes: '+¥250 for upgrade' },
  { id: 'naan-8', name: 'Honey Cheese Naan', nameJp: 'ハチミツチーズナン', price: 800, category: 'naan', notes: '+¥400 for upgrade' },
  { id: 'naan-9', name: 'Sesame Naan', nameJp: '胡麻ナン', price: 500, category: 'naan', notes: '+¥250 for upgrade' },
  { id: 'naan-10', name: 'Coconut Cheese Naan', nameJp: 'ココナッツチーズナン', price: 850, category: 'naan', isRecommended: true, notes: '+¥450 for upgrade' },
  { id: 'naan-11', name: 'Naan Roll', nameJp: 'ナンロール', price: 1000, category: 'naan', spiceLevel: 'NORMAL' },

  // MEXICAN
  {
    id: 'mex-1',
    name: 'Burrito',
    nameJp: 'ブリトー',
    price: 1000,
    category: 'mexican',
    variations: [
      { name: 'Cheese', price: 1000 },
      { name: 'Chicken', price: 1200 },
      { name: 'Beef', price: 1500 }
    ],
    addOns: [
      { name: 'Sour Cream', price: 150 },
      { name: 'Pico De Gallo', price: 200 },
      { name: 'Make it Supreme', price: 300 }
    ]
  },
  { id: 'mex-4', name: 'Tacos - Cheese (Crispy/Soft)', nameJp: 'タコス チーズ', price: 550, category: 'mexican' },
  { id: 'mex-5', name: 'Tacos - Chicken (Crispy/Soft)', nameJp: 'タコス チキン', price: 650, category: 'mexican' },
  { id: 'mex-6', name: 'Tacos - Beef (Crispy/Soft)', nameJp: 'タコス ビーフ', price: 650, category: 'mexican' },
  { id: 'mex-7', name: 'Enchilada - Cheese (Red Sauce)', nameJp: 'エンチラーダ チーズ', price: 550, category: 'mexican' },
  { id: 'mex-8', name: 'Enchilada - Chicken (Red Sauce)', nameJp: 'エンチラーダ チキン', price: 650, category: 'mexican' },
  { id: 'mex-9', name: 'Enchilada - Beef (Red Sauce)', nameJp: 'エンチラーダ ビーフ', price: 750, category: 'mexican' },

  // FRIED ITEMS
  { id: 'fried-1', name: 'Samosa 2Pcs', nameJp: 'サモサ2個', price: 700, category: 'fried', isRecommended: true },
  { id: 'fried-2', name: 'French Fries', nameJp: 'ポテトフライ', price: 700, category: 'fried' },
  { id: 'fried-3', name: 'Chicken Lollipop', nameJp: 'チキンロリポップ', price: 750, category: 'fried' },
  { id: 'fried-4', name: 'Chicken Wings', nameJp: '手羽先', price: 750, category: 'fried' },
  { id: 'fried-5', name: 'Cheese Ball', nameJp: 'チーズボール', price: 1100, category: 'fried' },
  { id: 'fried-6', name: 'Potato Pakoda', nameJp: 'ポテトパコダ', price: 800, category: 'fried' },
  { id: 'fried-7', name: 'Shrimp Pakoda', nameJp: '海老パコダ', price: 1100, category: 'fried' },

  // RICE & BIRYANI
  { id: 'rice-1', name: 'Chicken Biryani (100% Basmati)', nameJp: 'チキンビリヤニー', price: 1400, category: 'rice' },
  { id: 'rice-2', name: 'Mutton Biryani (100% Basmati)', nameJp: 'マトンビリヤニー', price: 1500, category: 'rice' },
  { id: 'rice-3', name: 'Egg Biryani (100% Basmati)', nameJp: '玉子ビリヤニー', price: 1300, category: 'rice' },
  { id: 'rice-4', name: 'Pulao (100% Basmati)', nameJp: 'プラオ', price: 1300, category: 'rice' },
  { id: 'rice-5', name: 'Rice (50% Basmati, 50% Japanese)', nameJp: 'ライス', price: 500, category: 'rice' },
  { id: 'rice-6', name: 'Saffron Rice', nameJp: 'サフランライス', price: 600, category: 'rice' },
  { id: 'rice-7', name: 'Garlic Rice', nameJp: 'ガーリックライス', price: 600, category: 'rice' },
  { id: 'rice-8', name: 'Cumin Rice', nameJp: 'クミンライス', price: 600, category: 'rice' },
  { id: 'rice-9', name: 'Chicken Fried Rice', nameJp: 'チキンフライドライス', price: 1400, category: 'rice' },
  { id: 'rice-10', name: 'Egg Fried Rice', nameJp: '卵フライドライス', price: 1200, category: 'rice' },
  { id: 'rice-11', name: 'Mushroom Fried Rice', nameJp: 'キノコフライドライス', price: 1100, category: 'rice' },
  { id: 'rice-12', name: 'Shrimp Fried Rice', nameJp: '海老フライドライス', price: 1400, category: 'rice' },

  // SNACKS
  { id: 'snack-1', name: 'MOMO', nameJp: 'モモ', price: 800, category: 'snacks' },
  { id: 'snack-2', name: 'Chicken Chilli', nameJp: 'チキンチリ', price: 1100, category: 'snacks' },
  { id: 'snack-3', name: 'Plain Papad', nameJp: 'プレーンパパド', price: 300, category: 'snacks' },
  { id: 'snack-4', name: 'Potato Chilli', nameJp: 'ポテトチリ', price: 1000, category: 'snacks' },
  { id: 'snack-5', name: 'Masala Papad', nameJp: 'マサラパパド', price: 700, category: 'snacks' },
  { id: 'snack-6', name: 'Shrimp Chilli', nameJp: '海老チリ', price: 1100, category: 'snacks' },
  { id: 'snack-7', name: 'Edamame', nameJp: '枝豆', price: 500, category: 'snacks' },
  { id: 'snack-8', name: 'Chicken Sekuwa', nameJp: 'チキンセクワ', price: 1000, category: 'snacks' },

  // SOFT DRINKS
  { id: 'drink-1', name: 'Lassi', nameJp: 'ラッシー', price: 400, category: 'drinks' },
  { id: 'drink-2', name: 'Mango Lassi', nameJp: 'マンゴーラッシー', price: 400, category: 'drinks' },
  { id: 'drink-3', name: 'Strawberry Lassi', nameJp: 'いちごラッシー', price: 400, category: 'drinks' },
  { id: 'drink-4', name: 'Blueberry Lassi', nameJp: 'ブルーベリーラッシー', price: 400, category: 'drinks' },
  { id: 'drink-5', name: 'Coke Zero', nameJp: 'コーラゼロ', price: 400, category: 'drinks' },
  { id: 'drink-6', name: 'Coke', nameJp: 'コーラ', price: 400, category: 'drinks' },
  { id: 'drink-7', name: 'Ginger Ale', nameJp: 'ジンジャーエール', price: 400, category: 'drinks' },
  { id: 'drink-8', name: 'Oolong Tea', nameJp: 'ウーロン茶', price: 400, category: 'drinks' },
  { id: 'drink-9', name: 'Orange Juice', nameJp: 'オレンジジュース', price: 400, category: 'drinks' },
  { id: 'drink-10', name: 'Pineapple Juice', nameJp: 'パイナップルジュース', price: 400, category: 'drinks' },
  { id: 'drink-11', name: 'Apple Juice', nameJp: 'アップルジュース', price: 400, category: 'drinks' },
  { id: 'drink-12', name: 'Grapefruit Juice', nameJp: 'グレープフルーツジュース', price: 400, category: 'drinks' },
  { id: 'drink-13', name: 'Ice Coffee', nameJp: 'アイスコーヒー', price: 400, category: 'drinks' },
  { id: 'drink-14', name: 'Ice Tea', nameJp: 'アイスティー', price: 400, category: 'drinks' },

  // MOCKTAILS
  { id: 'mock-1', name: 'Coke Orange', nameJp: 'コークオレンジ', price: 400, category: 'mocktails' },
  { id: 'mock-2', name: 'Grapefruit & Coke', nameJp: 'グレープフルーツ&コーク', price: 400, category: 'mocktails' },
  { id: 'mock-3', name: 'Orange Ginger', nameJp: 'オレンジジンジャー', price: 400, category: 'mocktails' },
  { id: 'mock-4', name: 'Grapefruit Ginger', nameJp: 'グレープフルーツジンジャー', price: 400, category: 'mocktails' },
  { id: 'mock-5', name: 'Ginger Ale Tea', nameJp: 'ジンジャーエールティー', price: 400, category: 'mocktails' },

  // BEERS
  { id: 'beer-1', name: 'Corona', nameJp: 'コロナ', price: 700, category: 'cocktails', subcategory: 'Beer' },
  { id: 'beer-2', name: 'Nepal Ice', nameJp: 'ネパールアイス', price: 700, category: 'cocktails', subcategory: 'Beer' },
  { id: 'beer-3', name: 'King Fisher', nameJp: 'キングフィッシャー', price: 700, category: 'cocktails', subcategory: 'Beer' },
  { id: 'beer-4', name: 'Asahi Draft', nameJp: 'アサヒ生', price: 500, category: 'cocktails', subcategory: 'Beer' },
  { id: 'beer-5', name: 'Asahi Bottle', nameJp: 'アサヒ瓶', price: 700, category: 'cocktails', subcategory: 'Beer' },

  // COCKTAILS (Base ¥450, Make it strong +¥250)
  { id: 'cock-1', name: 'Gin Rock', nameJp: 'ジンロック', price: 450, category: 'cocktails', subcategory: 'Gin', addOns: [{ name: 'Make it Strong', price: 250 }] },
  { id: 'cock-2', name: 'Gin Tonic', nameJp: 'ジントニック', price: 450, category: 'cocktails', subcategory: 'Gin', addOns: [{ name: 'Make it Strong', price: 250 }] },
  { id: 'cock-3', name: 'Gin Buck', nameJp: 'ジンバック', price: 450, category: 'cocktails', subcategory: 'Gin', addOns: [{ name: 'Make it Strong', price: 250 }] },
  { id: 'cock-4', name: 'Gin Rickey', nameJp: 'ジンリッキー', price: 450, category: 'cocktails', subcategory: 'Gin', addOns: [{ name: 'Make it Strong', price: 250 }] },
  { id: 'cock-5', name: 'Tom Collins', nameJp: 'トムコリンズ', price: 450, category: 'cocktails', subcategory: 'Gin', addOns: [{ name: 'Make it Strong', price: 250 }] },
  { id: 'cock-6', name: 'Vodka Rock', nameJp: 'ウォッカロック', price: 450, category: 'cocktails', subcategory: 'Vodka', addOns: [{ name: 'Make it Strong', price: 250 }] },
  { id: 'cock-7', name: 'Vodka Tonic', nameJp: 'ウォッカトニック', price: 450, category: 'cocktails', subcategory: 'Vodka', addOns: [{ name: 'Make it Strong', price: 250 }] },
  { id: 'cock-8', name: 'Moscow Mule', nameJp: 'モスコミュール', price: 450, category: 'cocktails', subcategory: 'Vodka', addOns: [{ name: 'Make it Strong', price: 250 }] },
  { id: 'cock-9', name: 'Screwdriver', nameJp: 'スクリュードライバー', price: 450, category: 'cocktails', subcategory: 'Vodka', addOns: [{ name: 'Make it Strong', price: 250 }] },
  { id: 'cock-10', name: 'Rum Coke', nameJp: 'ラムコーク', price: 450, category: 'cocktails', subcategory: 'Rum', addOns: [{ name: 'Make it Strong', price: 250 }] },
  { id: 'cock-11', name: 'Tequila Shot', nameJp: 'テキーラショット', price: 450, category: 'cocktails', subcategory: 'Tequila', addOns: [{ name: 'Make it Strong', price: 250 }] },
  { id: 'cock-12', name: 'Whisky Coke', nameJp: 'ウイスキーコーク', price: 450, category: 'cocktails', subcategory: 'Whisky', addOns: [{ name: 'Make it Strong', price: 250 }] },
  { id: 'cock-13', name: 'Tequila Sunrise', nameJp: 'テキーラサンライズ', price: 750, category: 'cocktails', subcategory: 'Tequila Special' },
  { id: 'cock-14', name: 'Corona Sunrise', nameJp: 'コロナサンライズ', price: 750, category: 'cocktails', subcategory: 'Beer Special' },

  // MARGARITAS
  { id: 'marg-1', name: 'Regular Margarita (Glass)', nameJp: 'レギュラーマルゲリータ', price: 990, category: 'margaritas' },
  { id: 'marg-2', name: 'Regular Margarita (Pitcher)', nameJp: 'レギュラーマルゲリータ ピッチャー', price: 3400, category: 'margaritas' },
  { id: 'marg-3', name: 'Fruit Margarita (Glass)', nameJp: 'フルーツマルゲリータ', price: 1050, category: 'margaritas', description: 'Choose: Strawberry, Blueberry, Raspberry, Pineapple (mix up to 3 fruits)' },
  { id: 'marg-4', name: 'Fruit Margarita (Pitcher)', nameJp: 'フルーツマルゲリータ ピッチャー', price: 3600, category: 'margaritas', description: 'Choose: Strawberry, Blueberry, Raspberry, Pineapple (mix up to 3 fruits)' },
  { id: 'marg-5', name: 'Gold Margarita (Glass)', nameJp: 'ゴールドマルゲリータ', price: 1150, category: 'margaritas' },
  { id: 'marg-6', name: 'Gold Margarita (Pitcher)', nameJp: 'ゴールドマルゲリータ ピッチャー', price: 3800, category: 'margaritas' },
  { id: 'marg-7', name: 'Gold Fruit Margarita (Glass)', nameJp: 'ゴールドフルーツマルゲリータ', price: 1250, category: 'margaritas', description: 'Choose: Strawberry, Blueberry, Raspberry, Pineapple (mix up to 3 fruits)' },
  { id: 'marg-8', name: 'Gold Fruit Margarita (Pitcher)', nameJp: 'ゴールドフルーツマルゲリータ ピッチャー', price: 4200, category: 'margaritas', description: 'Choose: Strawberry, Blueberry, Raspberry, Pineapple (mix up to 3 fruits)' },
  { id: 'marg-9', name: 'Cadillac Margarita (Glass)', nameJp: 'キャデラックマルゲリータ', price: 1350, category: 'margaritas' },
  { id: 'marg-10', name: 'Cadillac Margarita (Pitcher)', nameJp: 'キャデラックマルゲリータ ピッチャー', price: 4400, category: 'margaritas' },
  { id: 'marg-11', name: 'Cadillac Fruit Margarita (Glass)', nameJp: 'キャデラックフルーツマルゲリータ', price: 1450, category: 'margaritas', description: 'Choose: Strawberry, Blueberry, Raspberry, Pineapple (mix up to 3 fruits)' },
  { id: 'marg-12', name: 'Cadillac Fruit Margarita (Pitcher)', nameJp: 'キャデラックフルーツマルゲリータ ピッチャー', price: 4600, category: 'margaritas', description: 'Choose: Strawberry, Blueberry, Raspberry, Pineapple (mix up to 3 fruits)' },
]

// Helper functions
export const getRecommendedItems = () => menuItems.filter(item => item.isRecommended)
export const getItemsByCategory = (category: string) => menuItems.filter(item => item.category === category)
export const searchItems = (query: string) => menuItems.filter(item =>
  item.name.toLowerCase().includes(query.toLowerCase()) ||
  item.nameJp.toLowerCase().includes(query.toLowerCase())
)
