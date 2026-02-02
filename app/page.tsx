import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/footer'
import OffersSection from '@/components/OffersSection'
import TodaysSpecialPopup from '@/components/TodaysSpecialPopup'
import { getMenuItemImage } from '@/lib/image-mapping'

export default function HomePage() {
  const features = [
    {
      title: 'Authentic Flavors',
      description: 'Traditional recipes passed down through generations, crafted by expert chefs',
      emoji: '🍛',
      color: 'from-orange-500 to-red-500'
    },
    {
      title: 'Fast Delivery',
      description: 'Hot, fresh food delivered to your door in 30 minutes or less',
      emoji: '⚡',
      color: 'from-blue-500 to-indigo-500'
    },
    {
      title: 'Quality Ingredients',
      description: 'Fresh, premium ingredients sourced daily for the best taste',
      emoji: '✨',
      color: 'from-amber-500 to-orange-500'
    },
    {
      title: 'Halal Certified',
      description: 'All our meat products are 100% halal certified',
      emoji: '🏅',
      color: 'from-green-500 to-emerald-500'
    }
  ]

  const popularDishes = [
    { id: 'chk-1', name: 'Butter Chicken', price: '¥1,150', category: 'Chef Special', description: 'Creamy tomato curry with tender chicken' },
    { id: 'veg-2', name: 'Paneer Makhani', price: '¥1,000', category: 'Vegetarian', description: 'Cottage cheese in rich buttery sauce' },
    { id: 'chk-3', name: 'Chicken Tikka Masala', price: '¥1,150', category: 'Chef Special', description: 'Smoky grilled chicken in spiced curry' },
    { id: 'mut-1', name: 'Mutton Curry', price: '¥1,050', category: 'Classic', description: 'Slow-cooked lamb in aromatic spices' },
    { id: 'rice-1', name: 'Chicken Biryani', price: '¥1,200', category: 'Premium', description: 'Fragrant basmati rice with spiced meat' },
    { id: 'veg-4', name: 'Dal Tadka', price: '¥1,000', category: 'Vegetarian', description: 'Lentils in aromatic spiced gravy' }
  ]

  const testimonials = [
    {
      name: 'Yuki Tanaka',
      rating: 5,
      text: 'Best Indian food in Yokosuka! The butter chicken is absolutely amazing.',
      date: 'January 2026'
    },
    {
      name: 'Michael Chen',
      rating: 5,
      text: 'Fast delivery, great portions, and authentic taste. Highly recommended!',
      date: 'January 2026'
    },
    {
      name: 'Sarah Johnson',
      rating: 5,
      text: 'The paneer dishes are incredible. Love ordering from here every week!',
      date: 'December 2025'
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Today's Special - Floating Popup */}
      <TodaysSpecialPopup />

      {/* Announcement Strip */}
      <Link href="/menu" className="block sticky top-16 z-40">
        <div className="bg-emerald-800 text-white py-2 overflow-hidden cursor-pointer hover:bg-emerald-900 transition-colors">
          <div className="animate-scroll-slow whitespace-nowrap">
            <span className="inline-block px-6 text-sm font-medium tracking-wide">
              🎊 2026 Special — Order Now
            </span>
            <span className="inline-block px-6 text-sm font-medium tracking-wide mx-6">
              ⭐ FREE DELIVERY on all orders
            </span>
            <span className="inline-block px-6 text-sm font-medium tracking-wide mx-6">
              🍽️ Indian · Mexican · Nepalese · Japanese-Fusion
            </span>
            <span className="inline-block px-6 text-sm font-medium tracking-wide mx-6">
              🎊 2026 Special — Order Now
            </span>
            <span className="inline-block px-6 text-sm font-medium tracking-wide mx-6">
              ⭐ FREE DELIVERY on all orders
            </span>
          </div>
        </div>
      </Link>

      {/* ============================================
          HERO — Green Theme, Premium, No Glow
          ============================================ */}
      <section className="relative bg-gradient-to-br from-green-700 via-green-800 to-emerald-900 text-white overflow-hidden">
        {/* Subtle texture */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}></div>

        {/* Soft ambient shapes — no glow, just depth */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-600/20 rounded-full -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-green-600/10 rounded-full -ml-32 -mb-32"></div>

        <div className="container-custom relative z-10 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left — Content */}
            <div className="space-y-7 animate-slideInLeft">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium border border-white/10">
                <span className="w-2 h-2 bg-emerald-300 rounded-full"></span>
                <span className="text-emerald-50">4 Authentic Cuisines Under One Roof</span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight">
                Experience<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300" style={{WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
                  Global Flavors
                </span>
              </h1>

              <p className="text-lg lg:text-xl text-emerald-100/80 leading-relaxed max-w-lg">
                From Indian curries to Mexican tacos, Nepalese specialties to Japanese-fusion delights. Over 200 dishes crafted with love and tradition.
              </p>

              <div className="flex flex-wrap gap-3 pt-1">
                <Link href="/menu" className="bg-white text-green-800 hover:bg-emerald-50 font-bold text-lg px-7 py-3.5 rounded-xl transition-all inline-flex items-center gap-2 shadow-sm">
                  <span>View Our Menu</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                </Link>
                <Link href="/order" className="bg-white/10 hover:bg-white/15 text-white font-bold text-lg px-7 py-3.5 rounded-xl transition-all inline-flex items-center gap-2 border border-white/20">
                  <span>Order Now</span>
                </Link>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 lg:gap-8 pt-6">
                {[
                  { value: '200+', label: 'Menu Items' },
                  { value: '10K+', label: 'Customers' },
                  { value: '4.8★', label: 'Rating' },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center gap-6">
                    <div>
                      <div className="text-2xl lg:text-3xl font-black text-white">{stat.value}</div>
                      <div className="text-xs text-emerald-200/60 font-medium uppercase tracking-wider mt-0.5">{stat.label}</div>
                    </div>
                    {i < 2 && <div className="w-px h-10 bg-white/15"></div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Hero Image */}
            <div className="hidden lg:block animate-slideInRight">
              <div className="relative">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    src="/images/hero-curry.jpg"
                    alt="Delicious Curry Dishes"
                    className="w-full h-[540px] object-cover"
                  />
                  {/* Subtle overlay for text contrast if needed */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

                  {/* Badge */}
                  <div className="absolute top-5 right-5 bg-white/95 backdrop-blur-sm text-green-800 px-4 py-2 rounded-full font-bold text-sm shadow-md">
                    ⚡ Free Delivery
                  </div>

                  {/* Bottom info strip */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                    <div className="flex items-center gap-3">
                      <img src="/images/Logo.png" alt="" className="w-10 h-10 rounded-full bg-white/20 p-0.5" />
                      <div>
                        <div className="text-white font-bold text-sm">The Curry House</div>
                        <div className="text-white/70 text-xs">Yokosuka&apos;s Finest Multi-Cuisine</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Clean divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L720 30L1440 60V60H0Z" fill="rgb(249,250,251)" />
          </svg>
        </div>
      </section>

      {/* ============================================
          Party & Catering — Compact Inline
          ============================================ */}
      <section className="bg-gray-50 pt-6 pb-2">
        <div className="container-custom">
          <Link href="/catering" className="block group">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-violet-600 to-purple-700 text-white rounded-2xl px-6 py-4 transition-all hover:shadow-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎉</span>
                <div>
                  <span className="font-bold text-base">Host Your Events With Us!</span>
                  <span className="text-purple-200 text-sm ml-2 hidden sm:inline">Birthdays · Corporate · Gatherings</span>
                </div>
              </div>
              <span className="text-sm font-bold bg-white/15 px-4 py-1.5 rounded-lg group-hover:bg-white/25 transition-colors inline-flex items-center gap-1.5 shrink-0">
                Get a Quote
                <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* ============================================
          How It Works — Clean & Minimal
          ============================================ */}
      <section className="py-16 lg:py-20 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-green-700 uppercase tracking-[0.15em] mb-2">Simple Process</p>
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900">How It Works</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-10 max-w-3xl mx-auto">
            {[
              { step: '1', title: 'Browse', desc: 'Explore our menu', emoji: '📱' },
              { step: '2', title: 'Order', desc: 'Pick your favorites', emoji: '🛒' },
              { step: '3', title: 'Prepare', desc: 'Freshly cooked', emoji: '👨‍🍳' },
              { step: '4', title: 'Enjoy', desc: 'Hot & delivered', emoji: '😋' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="relative inline-block mb-3">
                  <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-2xl border border-gray-100">
                    {item.emoji}
                  </div>
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-green-600 text-white rounded-full text-[10px] font-black flex items-center justify-center">
                    {item.step}
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 text-sm">{item.title}</h3>
                <p className="text-gray-500 text-xs mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Special Offers Section */}
      <OffersSection />

      {/* ============================================
          Features — Refined Cards
          ============================================ */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-orange-600 uppercase tracking-[0.15em] mb-2">Why Choose Us</p>
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900">What Makes Us Special</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feature, i) => (
              <div key={i} className="group p-6 rounded-2xl bg-gray-50 hover:bg-white border border-gray-100 hover:border-green-200 hover:shadow-md transition-all duration-200">
                <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 text-xl text-white`}>
                  {feature.emoji}
                </div>
                <h3 className="font-bold text-gray-900 mb-1.5 group-hover:text-green-700 transition-colors">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          Popular Dishes — Premium Grid
          ============================================ */}
      <section className="py-16 lg:py-20 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-[0.15em] mb-2">Customer Favorites</p>
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900">Our Signature Dishes</h2>
            <p className="text-gray-500 mt-2 max-w-lg mx-auto">
              Handpicked favorites loved by thousands across Yokosuka
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularDishes.map((dish, i) => (
              <div key={i} className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300">
                {/* Image */}
                <div className="relative h-56 overflow-hidden">
                  {getMenuItemImage(dish.id) ? (
                    <img
                      src={getMenuItemImage(dish.id)!}
                      alt={dish.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
                      <span className="text-5xl">{['🍛', '🧈', '🍗', '🥘', '🍚', '🥣'][i % 6]}</span>
                    </div>
                  )}

                  <div className="absolute top-3 left-3">
                    <span className="bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-bold px-2.5 py-1 rounded-full">
                      ⭐ 4.8
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="bg-green-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                      {dish.category}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="font-bold text-lg text-gray-900 group-hover:text-green-700 transition-colors">{dish.name}</h3>
                  <p className="text-gray-500 text-sm mt-1">{dish.description}</p>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <span className="text-xl font-black text-green-700">{dish.price}</span>
                    <Link href="/menu" className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-lg transition-colors text-sm inline-flex items-center gap-1">
                      Order
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/menu" className="bg-green-600 hover:bg-green-700 text-white font-bold text-lg px-8 py-3.5 rounded-xl transition-colors inline-flex items-center gap-2 shadow-sm">
              View Full Menu
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================
          Testimonials — White cards on green bg
          ============================================ */}
      <section className="py-16 lg:py-20 bg-green-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '48px 48px'
        }}></div>

        <div className="container-custom relative z-10">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-emerald-300 uppercase tracking-[0.15em] mb-2">Testimonials</p>
            <h2 className="text-3xl lg:text-4xl font-black">What Our Customers Say</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 text-gray-900">
                <div className="flex items-center gap-0.5 mb-3 text-amber-400 text-sm">
                  {[...Array(t.rating)].map((_, j) => <span key={j}>★</span>)}
                </div>
                <p className="text-gray-700 leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-gray-900">{t.name}</div>
                    <div className="text-xs text-gray-400">{t.date}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          Promo Banner — Warm, Tight
          ============================================ */}
      <section className="py-12 bg-gradient-to-r from-orange-500 to-red-500 text-white">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 max-w-4xl mx-auto">
            <div className="text-center md:text-left">
              <p className="text-sm font-semibold text-white/80 mb-1">🎉 Limited Time Offer</p>
              <h3 className="text-3xl md:text-4xl font-black">15% Off Your First Order</h3>
              <p className="text-white/80 mt-1">
                Use code <span className="font-bold bg-white/20 px-2.5 py-0.5 rounded text-white ml-1">WELCOME15</span>
              </p>
            </div>
            <Link href="/menu" className="bg-white text-orange-600 hover:bg-orange-50 font-black py-3.5 px-8 rounded-xl transition-colors shadow-sm text-lg shrink-0">
              Order Now
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================
          Final CTA — Dark, Confident
          ============================================ */}
      <section className="py-16 lg:py-20 bg-gray-900 text-white">
        <div className="container-custom text-center">
          <div className="max-w-2xl mx-auto">
            <img src="/images/Logo.png" alt="The Curry House" className="w-16 h-16 mx-auto mb-5 opacity-70" />
            <h2 className="text-3xl lg:text-4xl font-black mb-4">Ready for the Best Curry in Yokosuka?</h2>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              Order now for fast delivery. Fresh, authentic cuisine delivered hot to your door.
            </p>

            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/menu" className="bg-green-600 hover:bg-green-700 text-white font-bold text-lg py-3.5 px-8 rounded-xl transition-colors inline-flex items-center gap-2 shadow-sm">
                Browse Menu
                <span>🍛</span>
              </Link>
              <Link href="/track" className="bg-white/10 hover:bg-white/15 text-white font-bold text-lg py-3.5 px-8 rounded-xl transition-colors border border-white/20 inline-flex items-center gap-2">
                Track Order
                <span>📍</span>
              </Link>
            </div>

            {/* Trust */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-10 text-gray-500 text-sm">
              <span>✅ Halal Certified</span>
              <span>🚚 30 Min Delivery</span>
              <span>⭐ 4.9 Rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          Career & Dine In — Two Cards
          ============================================ */}
      <section className="py-16 lg:py-20 bg-gray-50">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-5">
            <Link href="/careers" className="group">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 lg:p-10 hover:shadow-lg transition-shadow">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20"></div>
                <div className="relative z-10">
                  <span className="text-3xl mb-3 block">💼</span>
                  <h3 className="text-2xl font-bold text-white mb-2">Join Our Team</h3>
                  <p className="text-blue-200 text-sm mb-4">Exciting career opportunities at The Curry House</p>
                  <span className="inline-flex items-center gap-1.5 text-white font-semibold text-sm">
                    View Positions
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </span>
                </div>
              </div>
            </Link>

            <Link href="/table-order" className="group">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 p-8 lg:p-10 hover:shadow-lg transition-shadow">
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full -ml-20 -mb-20"></div>
                <div className="relative z-10">
                  <span className="text-3xl mb-3 block">📱</span>
                  <h3 className="text-2xl font-bold text-white mb-2">Dine In — QR Order</h3>
                  <p className="text-green-200 text-sm mb-4">Scan, order, enjoy — direct to kitchen!</p>
                  <span className="inline-flex items-center gap-1.5 text-white font-semibold text-sm">
                    18 Tables Available
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
