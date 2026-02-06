import Link from 'next/link'
import { Suspense } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/footer'
import OffersSection from '@/components/OffersSection'
import TodaysSpecialPopup from '@/components/TodaysSpecialPopup'
import TopBanner from '@/components/TopBanner'
import { getMenuItemImage } from '@/lib/image-mapping'

export default function HomePage() {
  const features = [
    {
      title: 'Authentic Flavors',
      description: 'Traditional recipes passed down through generations, crafted by expert chefs',
      emoji: '🍛',
    },
    {
      title: 'Fast Delivery',
      description: 'Hot, fresh food delivered to your door in 30 minutes or less',
      emoji: '⚡',
    },
    {
      title: 'Quality Ingredients',
      description: 'Fresh, premium ingredients sourced daily for the best taste',
      emoji: '✨',
    },
    {
      title: 'Halal Certified',
      description: 'All our meat products are 100% halal certified',
      emoji: '🏅',
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
      {/* Sticky Red Banner at the Very Top */}
      <TopBanner />

      {/* Spacer for fixed banner */}
      <div className="h-10"></div>

      <Navbar />

      {/* Today's Special - Floating Popup */}
      <Suspense fallback={null}>
        <TodaysSpecialPopup />
      </Suspense>

      {/* ============================================
          HERO — Green Theme, Mobile First
          ============================================ */}
      <section className="relative bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 overflow-hidden min-h-[90vh] md:min-h-[85vh] flex items-center">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        {/* Gradient orbs */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-green-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl"></div>

        <div className="container-custom relative z-10 py-12 md:py-20">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left — Content */}
            <div className="text-center lg:text-left space-y-6 md:space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium border border-white/20">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span className="text-white/90">4 Cuisines • 200+ Dishes • Free Delivery</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-tight text-white">
                Authentic Flavors,<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400">
                  Delivered Fresh
                </span>
              </h1>

              <p className="text-lg md:text-xl text-green-100/80 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Experience the finest Indian, Nepalese, Mexican & Japanese-fusion cuisine.
                Crafted with love, served with passion.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
                <Link href="/menu" className="group bg-white hover:bg-gray-100 text-green-900 font-bold text-lg px-8 py-4 rounded-2xl transition-all duration-300 inline-flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl hover:-translate-y-1">
                  <span>Order Now</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </Link>
                <Link href="/menu" className="group bg-white/10 hover:bg-white/20 text-white font-bold text-lg px-8 py-4 rounded-2xl transition-all duration-300 border border-white/30 inline-flex items-center justify-center gap-3 backdrop-blur-sm hover:-translate-y-1">
                  <span>View Menu</span>
                  <span className="text-xl">🍛</span>
                </Link>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-center lg:justify-start gap-8 pt-6">
                {[
                  { value: '200+', label: 'Menu Items' },
                  { value: '10K+', label: 'Happy Customers' },
                  { value: '4.9', label: 'Rating', star: true },
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="text-2xl md:text-3xl font-black text-white flex items-center justify-center gap-1">
                      {stat.value}
                      {stat.star && <span className="text-yellow-400 text-xl">★</span>}
                    </div>
                    <div className="text-xs text-green-200/70 font-medium uppercase tracking-wider mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Hero Image (Desktop) */}
            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-yellow-400/20 via-orange-400/20 to-red-400/20 rounded-[2rem] blur-xl"></div>
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                  <img
                    src="/images/hero-curry.jpg"
                    alt="Delicious Curry Dishes"
                    className="w-full h-[500px] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>

                  {/* Floating badge */}
                  <div className="absolute top-5 right-5 bg-white/95 backdrop-blur-md text-green-800 px-4 py-2 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Free Delivery
                  </div>

                  {/* Bottom info */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="flex items-center gap-3">
                      <img src="/images/Logo.png" alt="" className="w-12 h-12 rounded-xl bg-white/20 p-1 backdrop-blur-sm" />
                      <div>
                        <div className="text-white font-bold">The Curry House</div>
                        <div className="text-white/70 text-sm">Yokosuka&apos;s Finest Multi-Cuisine</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" preserveAspectRatio="none">
            <path d="M0 100L48 90C96 80 192 60 288 50C384 40 480 40 576 45C672 50 768 60 864 65C960 70 1056 70 1152 65C1248 60 1344 50 1392 45L1440 40V100H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* ============================================
          Announcement Strip
          ============================================ */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 overflow-hidden">
        <div className="animate-scroll-slow whitespace-nowrap">
          <span className="inline-block px-8 text-sm font-medium">
            🎉 FREE DELIVERY on all orders
          </span>
          <span className="inline-block px-8 text-sm font-medium">
            🍽️ Indian · Mexican · Nepalese · Japanese-Fusion
          </span>
          <span className="inline-block px-8 text-sm font-medium">
            ⭐ Use code WELCOME15 for 15% off
          </span>
          <span className="inline-block px-8 text-sm font-medium">
            🎉 FREE DELIVERY on all orders
          </span>
          <span className="inline-block px-8 text-sm font-medium">
            🍽️ Indian · Mexican · Nepalese · Japanese-Fusion
          </span>
        </div>
      </div>

      {/* ============================================
          Party & Catering Banner
          ============================================ */}
      <section className="py-6 bg-white">
        <div className="container-custom">
          <Link href="/catering" className="block group">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl px-6 py-4 transition-all hover:shadow-xl hover:-translate-y-0.5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">
                  🎉
                </div>
                <div>
                  <span className="font-bold text-lg">Planning an Event?</span>
                  <span className="text-purple-200 text-sm ml-3 hidden sm:inline">Birthdays · Corporate · Parties</span>
                </div>
              </div>
              <span className="text-sm font-semibold bg-white/20 hover:bg-white/30 px-5 py-2 rounded-xl transition-colors inline-flex items-center gap-2">
                Get Quote
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* ============================================
          How It Works
          ============================================ */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <span className="text-green-600 font-semibold text-sm uppercase tracking-widest">Simple Process</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mt-2">How It Works</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-4xl mx-auto">
            {[
              { step: '1', title: 'Browse', desc: 'Explore our menu', emoji: '📱', color: 'bg-green-100' },
              { step: '2', title: 'Order', desc: 'Pick your favorites', emoji: '🛒', color: 'bg-emerald-100' },
              { step: '3', title: 'Prepare', desc: 'Freshly cooked', emoji: '👨‍🍳', color: 'bg-teal-100' },
              { step: '4', title: 'Enjoy', desc: 'Hot & delivered', emoji: '😋', color: 'bg-green-100' },
            ].map((item, i) => (
              <div key={i} className="text-center group">
                <div className="relative inline-block mb-4">
                  <div className={`w-16 h-16 md:w-20 md:h-20 ${item.color} rounded-2xl flex items-center justify-center text-2xl md:text-3xl shadow-sm group-hover:shadow-md transition-all group-hover:-translate-y-1`}>
                    {item.emoji}
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-600 text-white rounded-lg text-xs font-bold flex items-center justify-center shadow-md">
                    {item.step}
                  </div>
                </div>
                <h3 className="font-bold text-gray-900">{item.title}</h3>
                <p className="text-gray-500 text-sm mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Special Offers Section */}
      <OffersSection />

      {/* ============================================
          Features / Why Choose Us
          ============================================ */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <span className="text-green-600 font-semibold text-sm uppercase tracking-widest">Why Choose Us</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mt-2">What Makes Us Special</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="group p-6 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4 text-2xl group-hover:scale-110 transition-transform">
                  {feature.emoji}
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          Popular Dishes
          ============================================ */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <span className="text-green-600 font-semibold text-sm uppercase tracking-widest">Customer Favorites</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mt-2">Our Signature Dishes</h2>
            <p className="text-gray-500 mt-3 max-w-lg mx-auto">
              Handpicked favorites loved by thousands across Yokosuka
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularDishes.map((dish, i) => (
              <div key={i} className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-green-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                {/* Image */}
                <div className="relative h-48 md:h-56 overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50">
                  {getMenuItemImage(dish.id) ? (
                    <img
                      src={getMenuItemImage(dish.id)!}
                      alt={dish.name}
                      className="w-full h-full object-cover scale-[1.5] group-hover:scale-[1.6] transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-5xl group-hover:scale-110 transition-transform">{['🍛', '🧈', '🍗', '🥘', '🍚', '🥣'][i % 6]}</span>
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-3 left-3">
                    <span className="bg-white/95 backdrop-blur-sm text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1">
                      <span className="text-yellow-500">★</span> 4.8
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="bg-green-600 text-white text-xs font-semibold px-2.5 py-1 rounded-lg shadow-sm">
                      {dish.category}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="font-bold text-lg text-gray-900 group-hover:text-green-700 transition-colors">{dish.name}</h3>
                  <p className="text-gray-500 text-sm mt-1 line-clamp-2">{dish.description}</p>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <span className="text-xl font-black text-green-600">{dish.price}</span>
                    <Link href="/menu" className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-xl transition-all text-sm inline-flex items-center gap-2">
                      Order
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/menu" className="group bg-green-600 hover:bg-green-700 text-white font-bold text-lg px-10 py-4 rounded-2xl transition-all inline-flex items-center gap-3 shadow-lg hover:shadow-xl hover:-translate-y-0.5">
              View Full Menu
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================
          Testimonials
          ============================================ */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-green-50 to-emerald-50 relative overflow-hidden">
        <div className="absolute top-10 left-10 w-72 h-72 bg-green-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl"></div>

        <div className="container-custom relative z-10">
          <div className="text-center mb-12">
            <span className="text-green-600 font-semibold text-sm uppercase tracking-widest">Testimonials</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mt-2">What Our Customers Say</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-green-100 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center gap-1 mb-4 text-yellow-400 text-lg">
                  {[...Array(t.rating)].map((_, j) => <span key={j}>★</span>)}
                </div>
                <p className="text-gray-700 leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-sm">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.date}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          Recognition & Awards
          ============================================ */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <div className="text-center mb-8">
            <span className="text-gray-500 font-semibold text-sm uppercase tracking-widest">Trusted & Recognized</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {[
              { name: 'Restaurant Guru', year: '2024', emoji: '🏆' },
              { name: 'TripAdvisor', year: 'Excellence', emoji: '🥇' },
              { name: 'Google', year: '4.8★', emoji: '⭐' },
              { name: 'Halal Certified', year: 'Japan', emoji: '🏅' },
            ].map((award, i) => (
              <div key={i} className="flex flex-col items-center group">
                <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center text-2xl group-hover:bg-green-50 transition-colors border border-gray-200 group-hover:scale-105 transform duration-200">
                  {award.emoji}
                </div>
                <span className="text-sm font-bold text-gray-700 mt-2">{award.name}</span>
                <span className="text-xs text-gray-500">{award.year}</span>
              </div>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link href="/recognitions" className="text-sm text-green-600 hover:text-green-700 font-semibold inline-flex items-center gap-2 hover:gap-3 transition-all">
              View All Certificates
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================
          Promo Banner
          ============================================ */}
      <section className="py-12 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }}></div>

        <div className="container-custom relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 max-w-4xl mx-auto text-center md:text-left">
            <div>
              <p className="text-sm font-semibold text-green-200 mb-1 flex items-center justify-center md:justify-start gap-2">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                Limited Time Offer
              </p>
              <h3 className="text-2xl md:text-3xl font-black">15% Off Your First Order</h3>
              <p className="text-green-100 mt-1">
                Use code <span className="font-bold bg-white/20 px-3 py-1 rounded-lg text-white ml-1">WELCOME15</span>
              </p>
            </div>
            <Link href="/menu" className="bg-white text-green-700 hover:bg-green-50 font-bold py-3 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 shrink-0">
              Order Now
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================
          Final CTA
          ============================================ */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/pattern.png')] opacity-5"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/10 rounded-full blur-3xl"></div>

        <div className="container-custom text-center relative z-10">
          <div className="max-w-2xl mx-auto">
            <img src="/images/Logo.png" alt="The Curry House" className="w-16 h-16 mx-auto mb-6 opacity-90" />
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4">Ready for the Best Curry in Yokosuka?</h2>
            <p className="text-green-200 text-lg mb-8 leading-relaxed">
              Order now for fast delivery. Fresh, authentic cuisine delivered hot to your door.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/menu" className="group bg-white text-green-900 hover:bg-green-50 font-bold text-lg py-4 px-10 rounded-2xl transition-all inline-flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                Browse Menu
                <span className="text-xl group-hover:rotate-12 transition-transform">🍛</span>
              </Link>
              <Link href="/track" className="group bg-white/10 hover:bg-white/20 text-white font-bold text-lg py-4 px-10 rounded-2xl transition-all border border-white/30 inline-flex items-center justify-center gap-3 hover:-translate-y-0.5">
                Track Order
                <span className="text-xl group-hover:scale-110 transition-transform">📍</span>
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-10 text-green-300 text-sm">
              <span className="flex items-center gap-2">
                <span className="text-green-400">✓</span> Halal Certified
              </span>
              <span className="flex items-center gap-2">
                <span className="text-green-400">✓</span> 30 Min Delivery
              </span>
              <span className="flex items-center gap-2">
                <span className="text-yellow-400">★</span> 4.9 Rating
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          Career & Dine In
          ============================================ */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-6">
            <Link href="/careers" className="group">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 md:p-10 hover:shadow-2xl transition-all hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl mb-4">
                    💼
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Join Our Team</h3>
                  <p className="text-blue-100 mb-4 text-sm">Exciting career opportunities at The Curry House</p>
                  <span className="inline-flex items-center gap-2 text-white font-semibold text-sm">
                    View Positions
                    <svg className="w-4 h-4 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  </span>
                </div>
              </div>
            </Link>

            <div className="group">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 p-8 md:p-10">
                <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mb-20"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl mb-4">
                    📱
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Dine In — QR Order</h3>
                  <p className="text-green-100 mb-4 text-sm">Scan the QR code at your table to order directly!</p>
                  <span className="inline-flex items-center gap-2 text-white/80 font-medium text-xs">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                    Available via QR code at restaurant
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
