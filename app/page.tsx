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
      gradient: 'from-amber-50 to-orange-50',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600'
    },
    {
      title: 'Fast Delivery',
      description: 'Hot, fresh food delivered to your door in 30 minutes or less',
      emoji: '⚡',
      gradient: 'from-sky-50 to-blue-50',
      iconBg: 'bg-sky-100',
      iconColor: 'text-sky-600'
    },
    {
      title: 'Quality Ingredients',
      description: 'Fresh, premium ingredients sourced daily for the best taste',
      emoji: '✨',
      gradient: 'from-emerald-50 to-teal-50',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600'
    },
    {
      title: 'Halal Certified',
      description: 'All our meat products are 100% halal certified',
      emoji: '🏅',
      gradient: 'from-violet-50 to-purple-50',
      iconBg: 'bg-violet-100',
      iconColor: 'text-violet-600'
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
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      {/* Today's Special - Floating Popup */}
      <TodaysSpecialPopup />

      {/* Announcement Strip — Softer, Calmer */}
      <Link href="/menu" className="block sticky top-16 z-40">
        <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 text-white py-2.5 overflow-hidden cursor-pointer hover:from-emerald-800 hover:via-emerald-700 hover:to-teal-700 transition-all">
          <div className="animate-scroll-slow whitespace-nowrap">
            <span className="inline-block px-6 text-sm font-medium tracking-wide">
              ✨ 2026 Special — Order Now
            </span>
            <span className="inline-block px-6 text-sm font-medium tracking-wide mx-6">
              🚚 FREE DELIVERY on all orders
            </span>
            <span className="inline-block px-6 text-sm font-medium tracking-wide mx-6">
              🍽️ Indian · Mexican · Nepalese · Japanese-Fusion
            </span>
            <span className="inline-block px-6 text-sm font-medium tracking-wide mx-6">
              ✨ 2026 Special — Order Now
            </span>
            <span className="inline-block px-6 text-sm font-medium tracking-wide mx-6">
              🚚 FREE DELIVERY on all orders
            </span>
          </div>
        </div>
      </Link>

      {/* ============================================
          HERO — Calm, Warm, Elegant
          ============================================ */}
      <section className="relative bg-gradient-to-br from-stone-100 via-amber-50/30 to-orange-50/40 overflow-hidden">
        {/* Soft ambient gradient orbs */}
        <div className="absolute top-20 right-20 w-[500px] h-[500px] bg-gradient-to-br from-amber-200/30 to-orange-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-emerald-200/20 to-teal-200/10 rounded-full blur-3xl"></div>

        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #000 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }}></div>

        <div className="container-custom relative z-10 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — Content */}
            <div className="space-y-8 animate-slideInLeft">
              {/* Badge */}
              <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full text-sm font-medium border border-stone-200/60 shadow-sm">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-stone-600">4 Authentic Cuisines Under One Roof</span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight text-stone-800">
                Savor the<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-orange-500 to-red-500" style={{WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
                  Warmth of Spices
                </span>
              </h1>

              <p className="text-lg lg:text-xl text-stone-500 leading-relaxed max-w-lg">
                From Indian curries to Mexican tacos, Nepalese specialties to Japanese-fusion delights. Over 200 dishes crafted with love and tradition.
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <Link href="/menu" className="group bg-stone-900 hover:bg-stone-800 text-white font-semibold text-lg px-8 py-4 rounded-2xl transition-all duration-300 inline-flex items-center gap-3 shadow-lg shadow-stone-900/10 hover:shadow-xl hover:shadow-stone-900/15 hover:-translate-y-0.5">
                  <span>Explore Menu</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </Link>
                <Link href="/order" className="group bg-white hover:bg-stone-50 text-stone-700 font-semibold text-lg px-8 py-4 rounded-2xl transition-all duration-300 inline-flex items-center gap-3 border border-stone-200 shadow-sm hover:shadow-md hover:-translate-y-0.5">
                  <span>Order Now</span>
                  <span className="text-xl group-hover:scale-110 transition-transform">🛵</span>
                </Link>
              </div>

              {/* Stats — Softer */}
              <div className="flex items-center gap-8 pt-6">
                {[
                  { value: '200+', label: 'Menu Items' },
                  { value: '10K+', label: 'Happy Customers' },
                  { value: '4.8', label: 'Rating', star: true },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center gap-8">
                    <div className="text-center">
                      <div className="text-2xl lg:text-3xl font-black text-stone-800 flex items-center justify-center gap-1">
                        {stat.value}
                        {stat.star && <span className="text-amber-400 text-xl">★</span>}
                      </div>
                      <div className="text-xs text-stone-400 font-medium uppercase tracking-wider mt-1">{stat.label}</div>
                    </div>
                    {i < 2 && <div className="w-px h-10 bg-stone-200"></div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Hero Image */}
            <div className="hidden lg:block animate-slideInRight">
              <div className="relative">
                {/* Decorative ring */}
                <div className="absolute -inset-4 bg-gradient-to-br from-amber-200/40 via-orange-200/30 to-red-200/20 rounded-[2rem] blur-sm"></div>

                <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-stone-900/10 border border-white/50">
                  <img
                    src="/images/hero-curry.jpg"
                    alt="Delicious Curry Dishes"
                    className="w-full h-[520px] object-cover"
                  />
                  {/* Soft overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>

                  {/* Badge */}
                  <div className="absolute top-5 right-5 bg-white/95 backdrop-blur-md text-stone-700 px-5 py-2.5 rounded-2xl font-semibold text-sm shadow-lg flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    Free Delivery
                  </div>

                  {/* Bottom info */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-6 pt-16">
                    <div className="flex items-center gap-3">
                      <img src="/images/Logo.png" alt="" className="w-12 h-12 rounded-2xl bg-white/20 p-1 backdrop-blur-sm" />
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

        {/* Soft wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" preserveAspectRatio="none">
            <path d="M0 80L48 74.7C96 69 192 59 288 53.3C384 48 480 48 576 53.3C672 59 768 69 864 69.3C960 69 1056 59 1152 53.3C1248 48 1344 48 1392 48L1440 48V80H1392C1344 80 1248 80 1152 80C1056 80 960 80 864 80C768 80 672 80 576 80C480 80 384 80 288 80C192 80 96 80 48 80H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* ============================================
          Party & Catering — Refined
          ============================================ */}
      <section className="bg-white pt-4 pb-8">
        <div className="container-custom">
          <Link href="/catering" className="block group">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-violet-500/90 to-purple-600/90 backdrop-blur text-white rounded-3xl px-8 py-5 transition-all hover:shadow-xl hover:shadow-purple-500/20 hover:-translate-y-0.5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center text-2xl">
                  🎉
                </div>
                <div>
                  <span className="font-bold text-lg">Host Your Events With Us!</span>
                  <span className="text-purple-200 text-sm ml-3 hidden sm:inline">Birthdays · Corporate · Gatherings</span>
                </div>
              </div>
              <span className="text-sm font-semibold bg-white/15 hover:bg-white/25 px-5 py-2.5 rounded-xl transition-colors inline-flex items-center gap-2 shrink-0">
                Get a Quote
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* ============================================
          How It Works — Minimal & Elegant
          ============================================ */}
      <section className="py-20 lg:py-24 bg-white">
        <div className="container-custom">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-emerald-600 uppercase tracking-widest mb-3">Simple Process</p>
            <h2 className="text-3xl lg:text-4xl font-black text-stone-800">How It Works</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 max-w-4xl mx-auto">
            {[
              { step: '1', title: 'Browse', desc: 'Explore our menu', emoji: '📱', color: 'from-amber-100 to-orange-100' },
              { step: '2', title: 'Order', desc: 'Pick your favorites', emoji: '🛒', color: 'from-emerald-100 to-teal-100' },
              { step: '3', title: 'Prepare', desc: 'Freshly cooked', emoji: '👨‍🍳', color: 'from-sky-100 to-blue-100' },
              { step: '4', title: 'Enjoy', desc: 'Hot & delivered', emoji: '😋', color: 'from-rose-100 to-pink-100' },
            ].map((item, i) => (
              <div key={i} className="text-center group">
                <div className="relative inline-block mb-4">
                  <div className={`w-20 h-20 bg-gradient-to-br ${item.color} rounded-3xl flex items-center justify-center text-3xl shadow-sm group-hover:shadow-md transition-all group-hover:-translate-y-1`}>
                    {item.emoji}
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center justify-center shadow-md">
                    {item.step}
                  </div>
                </div>
                <h3 className="font-bold text-stone-800 text-lg">{item.title}</h3>
                <p className="text-stone-400 text-sm mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Special Offers Section */}
      <OffersSection />

      {/* ============================================
          Features — Soft Gradient Cards
          ============================================ */}
      <section className="py-20 lg:py-24 bg-stone-50">
        <div className="container-custom">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-amber-600 uppercase tracking-widest mb-3">Why Choose Us</p>
            <h2 className="text-3xl lg:text-4xl font-black text-stone-800">What Makes Us Special</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <div key={i} className={`group p-7 rounded-3xl bg-gradient-to-br ${feature.gradient} border border-white/60 hover:shadow-lg hover:shadow-stone-200/50 transition-all duration-300 hover:-translate-y-1`}>
                <div className={`w-14 h-14 ${feature.iconBg} rounded-2xl flex items-center justify-center mb-5 text-2xl group-hover:scale-110 transition-transform`}>
                  {feature.emoji}
                </div>
                <h3 className="font-bold text-stone-800 text-lg mb-2">{feature.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          Popular Dishes — Premium Cards
          ============================================ */}
      <section className="py-20 lg:py-24 bg-white">
        <div className="container-custom">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-orange-600 uppercase tracking-widest mb-3">Customer Favorites</p>
            <h2 className="text-3xl lg:text-4xl font-black text-stone-800">Our Signature Dishes</h2>
            <p className="text-stone-400 mt-3 max-w-lg mx-auto">
              Handpicked favorites loved by thousands across Yokosuka
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {popularDishes.map((dish, i) => (
              <div key={i} className="group bg-white rounded-3xl overflow-hidden border border-stone-100 hover:border-stone-200 hover:shadow-xl hover:shadow-stone-200/50 transition-all duration-500 hover:-translate-y-1">
                {/* Image */}
                <div className="relative h-72 overflow-hidden bg-gradient-to-br from-stone-100 to-stone-50">
                  {getMenuItemImage(dish.id) ? (
                    <img
                      src={getMenuItemImage(dish.id)!}
                      alt={dish.name}
                      className="w-full h-full object-cover scale-[1.6] group-hover:scale-[1.7] transition-transform duration-700 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
                      <span className="text-6xl group-hover:scale-110 transition-transform">{['🍛', '🧈', '🍗', '🥘', '🍚', '🥣'][i % 6]}</span>
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-4 left-4">
                    <span className="bg-white/95 backdrop-blur-sm text-stone-600 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5">
                      <span className="text-amber-400">★</span> 4.8
                    </span>
                  </div>
                  <div className="absolute top-4 right-4">
                    <span className="bg-emerald-500/95 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
                      {dish.category}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="font-bold text-xl text-stone-800 group-hover:text-amber-700 transition-colors">{dish.name}</h3>
                  <p className="text-stone-400 text-sm mt-2 leading-relaxed">{dish.description}</p>

                  <div className="flex items-center justify-between mt-5 pt-5 border-t border-stone-100">
                    <span className="text-2xl font-black text-emerald-600">{dish.price}</span>
                    <Link href="/menu" className="bg-stone-900 hover:bg-stone-800 text-white font-semibold px-5 py-2.5 rounded-xl transition-all text-sm inline-flex items-center gap-2 hover:gap-3">
                      Order
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-14">
            <Link href="/menu" className="group bg-stone-900 hover:bg-stone-800 text-white font-semibold text-lg px-10 py-4 rounded-2xl transition-all duration-300 inline-flex items-center gap-3 shadow-lg shadow-stone-900/10 hover:shadow-xl hover:-translate-y-0.5">
              View Full Menu
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================
          Testimonials — Warm & Inviting
          ============================================ */}
      <section className="py-20 lg:py-24 bg-gradient-to-br from-amber-50 via-orange-50/50 to-rose-50/30 relative overflow-hidden">
        {/* Soft decorative elements */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-amber-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-rose-200/20 rounded-full blur-3xl"></div>

        <div className="container-custom relative z-10">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-amber-600 uppercase tracking-widest mb-3">Testimonials</p>
            <h2 className="text-3xl lg:text-4xl font-black text-stone-800">What Our Customers Say</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white/80 backdrop-blur-sm rounded-3xl p-7 border border-white shadow-lg shadow-amber-100/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center gap-1 mb-4 text-amber-400 text-lg">
                  {[...Array(t.rating)].map((_, j) => <span key={j}>★</span>)}
                </div>
                <p className="text-stone-600 leading-relaxed mb-6 text-lg">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-stone-800">{t.name}</div>
                    <div className="text-sm text-stone-400">{t.date}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          Recognition & Awards — Elegant Strip
          ============================================ */}
      <section className="py-14 bg-white">
        <div className="container-custom">
          <div className="text-center mb-8">
            <p className="text-sm font-semibold text-stone-400 uppercase tracking-widest">Trusted & Recognized</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-10 lg:gap-14">
            {[
              { name: 'Restaurant Guru', year: '2024', emoji: '🏆' },
              { name: 'TripAdvisor', year: 'Excellence', emoji: '🥇' },
              { name: 'Google', year: '4.8★', emoji: '⭐' },
              { name: 'Halal Certified', year: 'Japan', emoji: '🏅' },
            ].map((award, i) => (
              <div key={i} className="flex flex-col items-center group">
                <div className="w-16 h-16 bg-stone-50 rounded-2xl flex items-center justify-center text-3xl group-hover:bg-stone-100 transition-colors border border-stone-100 group-hover:scale-105 transform duration-200">
                  {award.emoji}
                </div>
                <span className="text-sm font-bold text-stone-600 mt-3">{award.name}</span>
                <span className="text-xs text-stone-400">{award.year}</span>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/recognitions" className="text-sm text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center gap-2 hover:gap-3 transition-all">
              View All Certificates
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================
          Promo Banner — Warm & Inviting
          ============================================ */}
      <section className="py-14 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white relative overflow-hidden">
        {/* Soft pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }}></div>

        <div className="container-custom relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 max-w-4xl mx-auto">
            <div className="text-center md:text-left">
              <p className="text-sm font-semibold text-white/80 mb-2 flex items-center justify-center md:justify-start gap-2">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                Limited Time Offer
              </p>
              <h3 className="text-3xl md:text-4xl font-black">15% Off Your First Order</h3>
              <p className="text-white/80 mt-2 text-lg">
                Use code <span className="font-bold bg-white/20 px-3 py-1 rounded-lg text-white ml-1">WELCOME15</span>
              </p>
            </div>
            <Link href="/menu" className="bg-white text-amber-600 hover:bg-amber-50 font-bold py-4 px-10 rounded-2xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-lg shrink-0">
              Order Now
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================
          Final CTA — Sophisticated Dark
          ============================================ */}
      <section className="py-20 lg:py-24 bg-stone-900 text-white relative overflow-hidden">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-stone-800/50 to-stone-900"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl"></div>

        <div className="container-custom text-center relative z-10">
          <div className="max-w-2xl mx-auto">
            <img src="/images/Logo.png" alt="The Curry House" className="w-20 h-20 mx-auto mb-6 opacity-80" />
            <h2 className="text-3xl lg:text-5xl font-black mb-5">Ready for the Best Curry in Yokosuka?</h2>
            <p className="text-stone-400 text-lg mb-10 leading-relaxed">
              Order now for fast delivery. Fresh, authentic cuisine delivered hot to your door.
            </p>

            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/menu" className="group bg-white text-stone-900 hover:bg-stone-100 font-bold text-lg py-4 px-10 rounded-2xl transition-all inline-flex items-center gap-3 shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                Browse Menu
                <span className="text-xl group-hover:rotate-12 transition-transform">🍛</span>
              </Link>
              <Link href="/track" className="group bg-white/10 hover:bg-white/15 text-white font-bold text-lg py-4 px-10 rounded-2xl transition-all border border-white/20 inline-flex items-center gap-3 hover:-translate-y-0.5">
                Track Order
                <span className="text-xl group-hover:scale-110 transition-transform">📍</span>
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-8 pt-12 text-stone-500 text-sm">
              <span className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Halal Certified
              </span>
              <span className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> 30 Min Delivery
              </span>
              <span className="flex items-center gap-2">
                <span className="text-amber-400">★</span> 4.9 Rating
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          Career & Dine In — Elegant Cards
          ============================================ */}
      <section className="py-20 lg:py-24 bg-stone-50">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-6">
            <Link href="/careers" className="group">
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500 to-indigo-600 p-10 lg:p-12 hover:shadow-2xl hover:shadow-indigo-500/20 transition-all hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16"></div>
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center text-3xl mb-5">
                    💼
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-bold text-white mb-3">Join Our Team</h3>
                  <p className="text-sky-100 mb-5">Exciting career opportunities at The Curry House</p>
                  <span className="inline-flex items-center gap-2 text-white font-semibold">
                    View Positions
                    <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  </span>
                </div>
              </div>
            </Link>

            <Link href="/table-order" className="group">
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-10 lg:p-12 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all hover:-translate-y-1">
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mb-24"></div>
                <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mt-16"></div>
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center text-3xl mb-5">
                    📱
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-bold text-white mb-3">Dine In — QR Order</h3>
                  <p className="text-emerald-100 mb-5">Scan, order, enjoy — direct to kitchen!</p>
                  <span className="inline-flex items-center gap-2 text-white font-semibold">
                    18 Tables Available
                    <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
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
