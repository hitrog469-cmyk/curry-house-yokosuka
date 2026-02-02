import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/footer'
import OffersSection from '@/components/OffersSection'
import TodaysSpecial from '@/components/TodaysSpecial'
import { getMenuItemImage } from '@/lib/image-mapping'

export default function HomePage() {
  const features = [
    {
      title: 'Authentic Flavors',
      description: 'Traditional recipes passed down through generations, crafted by expert chefs',
      icon: '🍛',
      color: 'from-orange-500 to-red-600'
    },
    {
      title: 'Fast Delivery',
      description: 'Hot, fresh food delivered to your door in 30 minutes or less',
      icon: '🚀',
      color: 'from-blue-500 to-indigo-600'
    },
    {
      title: 'Quality Ingredients',
      description: 'Fresh, premium ingredients sourced daily for the best taste',
      icon: '✨',
      color: 'from-yellow-500 to-orange-600'
    },
    {
      title: 'Halal Certified',
      description: 'All our meat products are 100% halal certified',
      icon: '🏅',
      color: 'from-green-500 to-emerald-600'
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

  const cuisines = [
    { name: 'Indian', icon: '🇮🇳', count: '80+' },
    { name: 'Nepalese', icon: '🇳🇵', count: '30+' },
    { name: 'Mexican', icon: '🇲🇽', count: '40+' },
    { name: 'Fusion', icon: '🌏', count: '50+' },
  ]

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Rotating Announcements Banner - Sticky */}
      <Link href="/menu" className="block sticky top-16 z-40">
        <div className="bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 text-white py-2.5 overflow-hidden relative cursor-pointer hover:from-orange-700 hover:via-red-700 hover:to-orange-700 transition-all shadow-lg">
          <div className="animate-scroll-slow whitespace-nowrap">
            <span className="inline-block px-4 text-sm font-semibold">
              🎊 2026 Special - Order Now!
            </span>
            <span className="inline-block px-4 mx-8 text-sm font-semibold">
              ⭐ FREE DELIVERY on all orders!
            </span>
            <span className="inline-block px-4 mx-8 text-sm font-semibold">
              🍽️ Authentic Indian, Mexican, Japanese & Nepalese Cuisine!
            </span>
            <span className="inline-block px-4 mx-8 text-sm font-semibold">
              🎊 2026 Special - Order Now!
            </span>
            <span className="inline-block px-4 mx-8 text-sm font-semibold">
              ⭐ FREE DELIVERY on all orders!
            </span>
          </div>
        </div>
      </Link>

      {/* Today's Special */}
      <TodaysSpecial />

      {/* ===== HERO SECTION - Logo Centric ===== */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden min-h-[92vh] flex items-center">
        {/* Subtle grain texture */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
        }}></div>

        {/* Warm ambient glow behind logo area */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-orange-500/20 via-transparent to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-gray-900/80 to-transparent"></div>

        <div className="container-custom relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center py-16 lg:py-20">
            {/* Left - Text Content */}
            <div className="space-y-8 animate-slideInLeft order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-sm font-medium border border-white/10">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse-slow"></span>
                <span className="text-gray-200">4 Cuisines Under One Roof</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black leading-[1.1] tracking-tight">
                <span className="text-white">Where</span><br />
                <span className="bg-gradient-to-r from-orange-400 via-yellow-300 to-orange-400 bg-clip-text text-transparent" style={{WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
                  Spice Meets
                </span><br />
                <span className="text-white">Soul</span>
              </h1>

              <p className="text-lg lg:text-xl text-gray-300 leading-relaxed max-w-lg">
                From Indian curries to Mexican tacos, Nepalese specialties to Japanese-fusion delights. Over 200 dishes crafted with love.
              </p>

              {/* Cuisine pills */}
              <div className="flex flex-wrap gap-3">
                {cuisines.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10 text-sm">
                    <span>{c.icon}</span>
                    <span className="text-gray-300 font-medium">{c.name}</span>
                    <span className="text-orange-400 font-bold text-xs">{c.count}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <Link href="/menu" className="btn-green-vivid green-glow text-lg px-8 py-4">
                  <span>Explore Menu</span>
                  <span>→</span>
                </Link>
                <Link href="/order" className="group bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-bold text-lg px-8 py-4 rounded-xl transition-all border border-white/20 hover:border-white/40 inline-flex items-center gap-2">
                  <span>Order Now</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>

              {/* Stats Row */}
              <div className="flex items-center gap-8 pt-4">
                <div>
                  <div className="text-3xl font-black text-white">200+</div>
                  <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">Dishes</div>
                </div>
                <div className="w-px h-10 bg-white/20"></div>
                <div>
                  <div className="text-3xl font-black text-white">10K+</div>
                  <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">Customers</div>
                </div>
                <div className="w-px h-10 bg-white/20"></div>
                <div>
                  <div className="text-3xl font-black text-white">4.8</div>
                  <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">Rating ★</div>
                </div>
              </div>
            </div>

            {/* Right - Logo Hero Card */}
            <div className="order-1 lg:order-2 flex justify-center animate-slideInRight">
              <div className="relative">
                {/* Outer glow ring */}
                <div className="absolute -inset-6 bg-gradient-to-r from-orange-500/30 via-yellow-400/20 to-red-500/30 rounded-full blur-2xl animate-pulse-slow"></div>

                {/* Logo container */}
                <div className="relative w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96">
                  {/* Rotating border ring */}
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-orange-400/30 animate-spin-slow"></div>

                  {/* Inner glowing circle */}
                  <div className="absolute inset-4 rounded-full bg-gradient-to-br from-orange-900/40 via-gray-800/60 to-red-900/40 backdrop-blur-sm border border-white/10 shadow-2xl"></div>

                  {/* Logo */}
                  <div className="absolute inset-8 flex items-center justify-center">
                    <img
                      src="/images/Logo.png"
                      alt="The Curry House Yokosuka"
                      className="w-full h-full object-contain drop-shadow-2xl animate-float"
                    />
                  </div>

                  {/* Floating accent badges */}
                  <div className="absolute -top-2 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-float" style={{animationDelay: '0.5s'}}>
                    Open Now
                  </div>
                  <div className="absolute -bottom-2 left-4 bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-float" style={{animationDelay: '1s'}}>
                    Free Delivery
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 80L60 70C120 60 240 40 360 30C480 20 600 20 720 25C840 30 960 40 1080 45C1200 50 1320 50 1380 50L1440 50V80H0Z" fill="rgb(249, 250, 251)"/>
          </svg>
        </div>
      </section>

      {/* ===== Party & Catering - Compact ===== */}
      <section className="bg-gray-50 pt-2 pb-6">
        <div className="container-custom">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl text-white py-5 px-6 shadow-lg">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-3xl">🎉</div>
                <div>
                  <h3 className="text-lg font-bold">Host Your Events With Us!</h3>
                  <p className="text-purple-100 text-sm">Birthdays, Corporate Events, Gatherings</p>
                </div>
              </div>
              <Link href="/catering" className="bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all px-5 py-2.5 rounded-lg font-bold text-sm inline-flex items-center gap-2 shrink-0">
                Get a Quote
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== How It Works - Minimal ===== */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-14 animate-fadeIn">
            <span className="inline-block px-4 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
              Simple Process
            </span>
            <h2 className="heading-2 mb-3 text-gray-900">How It Works</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              From browsing to delivery in four easy steps
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-4xl mx-auto">
            {[
              { step: '01', title: 'Browse', desc: 'Explore our menu', icon: '📱' },
              { step: '02', title: 'Order', desc: 'Pick your favorites', icon: '🛒' },
              { step: '03', title: 'Prepare', desc: 'Freshly cooked for you', icon: '👨‍🍳' },
              { step: '04', title: 'Enjoy', desc: 'Delivered hot & fresh', icon: '😋' },
            ].map((item, i) => (
              <div key={i} className="text-center animate-scaleIn" style={{animationDelay: `${i * 80}ms`}}>
                <div className="relative inline-block mb-4">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-md flex items-center justify-center text-2xl border border-gray-100">
                    {item.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 text-white rounded-full text-[10px] font-black flex items-center justify-center shadow">
                    {item.step}
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 text-sm">{item.title}</h3>
                <p className="text-gray-500 text-xs mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Special Offers Section */}
      <OffersSection />

      {/* ===== Features Section - Clean Cards ===== */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-14 animate-fadeIn">
            <span className="inline-block px-4 py-1.5 bg-orange-50 text-orange-700 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
              Why Choose Us
            </span>
            <h2 className="heading-2 mb-3 text-gray-900">What Makes Us Special</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Experience excellence in every bite
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feature, i) => (
              <div key={i} className="group p-6 rounded-2xl border border-gray-100 hover:border-green-200 bg-white hover:shadow-lg transition-all duration-300 animate-fadeIn" style={{animationDelay: `${i * 80}ms`}}>
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform text-2xl`}>
                  {feature.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Popular Dishes - Premium Grid ===== */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-14 animate-fadeIn">
            <span className="inline-block px-4 py-1.5 bg-yellow-50 text-yellow-700 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
              Customer Favorites
            </span>
            <h2 className="heading-2 mb-3 text-gray-900">Our Signature Dishes</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Handpicked favorites loved by thousands across Yokosuka
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularDishes.map((dish, i) => (
              <div key={i} className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col" style={{animationDelay: `${i * 80}ms`}}>
                {/* Image */}
                <div className="relative h-56 overflow-hidden">
                  {getMenuItemImage(dish.id) ? (
                    <img
                      src={getMenuItemImage(dish.id)!}
                      alt={dish.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-100 to-yellow-100 flex items-center justify-center">
                      <span className="text-5xl">{['🍛', '🧈', '🍗', '🥘', '🍚', '🥣'][i % 6]}</span>
                    </div>
                  )}

                  {/* Category */}
                  <div className="absolute top-3 right-3">
                    <span className="bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                      {dish.category}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-lg text-gray-900 group-hover:text-green-600 transition-colors">{dish.name}</h3>
                  <p className="text-gray-500 text-sm mt-1 leading-relaxed">{dish.description}</p>

                  <div className="flex-1"></div>

                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                    <div className="text-2xl font-black text-orange-600">{dish.price}</div>
                    <Link href="/menu" className="bg-green-600 hover:bg-green-700 text-white font-bold px-5 py-2 rounded-lg transition-all text-sm inline-flex items-center gap-1.5">
                      Order
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10 animate-fadeIn">
            <Link href="/menu" className="btn-green-vivid green-glow text-lg px-10 py-4">
              <span>View Full Menu</span>
              <span className="text-xl">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Testimonials ===== */}
      <section className="section-padding bg-white relative overflow-hidden">
        <div className="container-custom relative z-10">
          <div className="text-center mb-14 animate-fadeIn">
            <span className="inline-block px-4 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
              Testimonials
            </span>
            <h2 className="heading-2 mb-3 text-gray-900">What Our Customers Say</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Join thousands of satisfied customers
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial, i) => (
              <div key={i} className="p-6 rounded-2xl border border-gray-100 hover:border-green-200 bg-white hover:shadow-lg transition-all duration-300 animate-scaleIn" style={{animationDelay: `${i * 80}ms`}}>
                <div className="flex items-center gap-0.5 mb-4 text-yellow-400 text-sm">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i}>★</span>
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed mb-5">&ldquo;{testimonial.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-sm">{testimonial.name}</div>
                    <div className="text-xs text-gray-400">{testimonial.date}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Promo Banner - Clean ===== */}
      <section className="py-14 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 max-w-4xl mx-auto">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 text-sm bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full font-semibold mb-3">
                🎉 Limited Time
              </div>
              <h3 className="text-3xl md:text-4xl font-black mb-2">15% Off Your First Order</h3>
              <p className="text-white/80 text-lg">Use code: <span className="font-bold bg-white/20 px-3 py-1 rounded ml-1">WELCOME15</span></p>
            </div>
            <Link href="/menu" className="bg-white text-orange-600 hover:bg-gray-100 font-black py-4 px-8 rounded-xl transition-all shadow-lg hover-lift text-lg shrink-0">
              Order Now
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Final CTA ===== */}
      <section className="section-padding bg-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="container-custom text-center relative z-10">
          <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
            <img src="/images/Logo.png" alt="The Curry House" className="w-20 h-20 mx-auto mb-4 opacity-80" />
            <h2 className="heading-2 mb-4">Ready for the Best Curry in Yokosuka?</h2>
            <p className="text-lg text-gray-400 mb-6 leading-relaxed">
              Order now for fast delivery. Fresh, authentic cuisine delivered hot to your door.
            </p>

            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/menu" className="btn-green-vivid green-glow text-lg py-4 px-10">
                <span>Browse Menu</span>
                <span>🍛</span>
              </Link>
              <Link href="/track" className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-bold py-4 px-10 rounded-xl transition-all border border-white/20 hover:border-white/40 text-lg inline-flex items-center gap-2">
                <span>Track Order</span>
                <span>📍</span>
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-8 text-gray-500 text-sm">
              <span className="flex items-center gap-1.5">✅ Halal Certified</span>
              <span className="flex items-center gap-1.5">🚚 30 Min Delivery</span>
              <span className="flex items-center gap-1.5">⭐ 4.9 Rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Career & Dine-In ===== */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Career */}
            <Link href="/careers" className="group">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 shadow-md hover-lift">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 group-hover:scale-110 transition-transform duration-500"></div>
                <div className="relative z-10">
                  <div className="text-4xl mb-3">💼</div>
                  <h3 className="text-2xl font-bold text-white mb-2">Join Our Team</h3>
                  <p className="text-blue-200 text-sm mb-4">Exciting career opportunities at The Curry House</p>
                  <span className="inline-flex items-center gap-1.5 text-white font-semibold text-sm">
                    View Positions
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>

            {/* Dine In */}
            <Link href="/table-order" className="group">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-green-700 p-8 shadow-md hover-lift">
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24 group-hover:scale-110 transition-transform duration-500"></div>
                <div className="relative z-10">
                  <div className="text-4xl mb-3">📱</div>
                  <h3 className="text-2xl font-bold text-white mb-2">Dine In - QR Order</h3>
                  <p className="text-green-200 text-sm mb-4">Scan, order, enjoy - direct to kitchen!</p>
                  <span className="inline-flex items-center gap-1.5 text-white font-semibold text-sm">
                    18 Tables Available
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
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
