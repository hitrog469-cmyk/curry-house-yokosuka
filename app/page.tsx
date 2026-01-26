import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/footer'
import OffersSection from '@/components/OffersSection'
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
      icon: '🚗',
      color: 'from-blue-500 to-indigo-600'
    },
    {
      title: 'Quality Ingredients',
      description: 'Fresh, premium ingredients sourced daily for the best taste',
      icon: '⭐',
      color: 'from-yellow-500 to-orange-600'
    },
    {
      title: 'Halal Certified',
      description: 'All our meat products are 100% halal certified',
      icon: '✅',
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

  const howItWorks = [
    { step: '1', title: 'Browse Menu', description: 'Explore our delicious curry selection', icon: '📱' },
    { step: '2', title: 'Place Order', description: 'Choose your favorites and customize', icon: '🛒' },
    { step: '3', title: 'Fast Delivery', description: 'Fresh food delivered to your door', icon: '🚚' },
    { step: '4', title: 'Enjoy!', description: 'Savor authentic Indian flavors', icon: '😋' }
  ]

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Rotating Announcements Banner - Clickable to Menu */}
      <Link href="/menu" className="block">
        <div className="bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 text-white py-3 overflow-hidden relative cursor-pointer hover:from-orange-700 hover:via-red-700 hover:to-orange-700 transition-all">
          <div className="animate-scroll-slow whitespace-nowrap">
            <span className="inline-block px-4">
              🎉 2026 Special - Order Now!
            </span>
            <span className="inline-block px-4 mx-8">
              ⭐ FREE DELIVERY on all orders!
            </span>
            <span className="inline-block px-4 mx-8">
              🍛 Authentic Indian, Mexican, Japanese & Nepalese Cuisine!
            </span>
            <span className="inline-block px-4 mx-8">
              🎉 2026 Special - Order Now!
            </span>
            <span className="inline-block px-4 mx-8">
              ⭐ FREE DELIVERY on all orders!
            </span>
          </div>
        </div>
      </Link>

      {/* Party & Catering Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-6 shadow-lg">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-5xl">🎉</div>
              <div>
                <h3 className="text-xl font-bold mb-1">Host Your Events With Us!</h3>
                <p className="text-purple-100 text-sm">Weddings, Birthdays, Corporate Events - We cater them all!</p>
              </div>
            </div>
            <Link href="/catering" className="bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all px-6 py-3 rounded-lg group">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">Get a Quote</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Section - Split Screen Design */}
      <section className="relative bg-gradient-to-br from-green-600 via-green-700 to-emerald-900 text-white overflow-hidden min-h-[90vh] flex items-center">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 animate-float" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        {/* Floating Circles */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-yellow-400 rounded-full blur-3xl opacity-20 animate-float"></div>
        <div className="absolute bottom-32 right-20 w-48 h-48 bg-orange-400 rounded-full blur-3xl opacity-20 animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-blue-400 rounded-full blur-3xl opacity-20 animate-float" style={{animationDelay: '2s'}}></div>

        <div className="container-custom relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center py-20">
            {/* Left Content */}
            <div className="space-y-8 animate-slideInLeft">
              <div className="inline-flex items-center gap-2 px-5 py-3 bg-white/20 backdrop-blur-md rounded-full text-sm font-semibold shadow-lg hover-lift">
                <span className="animate-pulse-slow">🌟</span>
                <span>4 Authentic Cuisines Under One Roof</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-black leading-tight">
                Experience<br />
                <span className="bg-gradient-to-r from-yellow-300 via-orange-300 to-yellow-200 bg-clip-text text-transparent" style={{WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
                  Global Flavors
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-green-50 leading-relaxed max-w-xl">
                From Indian curries to Mexican tacos, Nepalese specialties to Japanese-fusion delights. Over 200 dishes crafted with love and tradition.
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <Link href="/menu" className="group relative btn-secondary inline-flex items-center gap-2 text-lg px-8 py-4 hover-glow overflow-hidden">
                  <span className="relative z-10">View Our Menu</span>
                  <span className="relative z-10 group-hover:translate-x-1 transition-transform">→</span>
                </Link>
                <Link href="/order" className="bg-white text-green-700 hover:bg-gray-50 font-bold py-4 px-8 rounded-xl transition-all duration-300 shadow-elegant hover-lift text-lg">
                  Order Now
                </Link>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-6 pt-8 max-w-md">
                <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-xl hover-lift">
                  <div className="text-4xl font-black text-yellow-300">200+</div>
                  <div className="text-sm text-green-100 font-medium mt-1">Menu Items</div>
                </div>
                <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-xl hover-lift">
                  <div className="text-4xl font-black text-yellow-300">5000+</div>
                  <div className="text-sm text-green-100 font-medium mt-1">Customers</div>
                </div>
                <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-xl hover-lift">
                  <div className="text-4xl font-black text-yellow-300">4.9★</div>
                  <div className="text-sm text-green-100 font-medium mt-1">Average Rating</div>
                </div>
              </div>
            </div>

            {/* Right Image Section - Hero Image */}
            <div className="hidden lg:block animate-slideInRight">
              <div className="relative">
                {/* Glow Effect */}
                <div className="absolute -inset-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-3xl opacity-30 blur-3xl animate-pulse-slow"></div>

                {/* Main Card */}
                <div className="relative bg-white rounded-3xl shadow-elegant-lg overflow-hidden hover-lift">
                  <div className="h-[600px] relative">
                    <img
                      src="/images/hero-curry.jpg"
                      alt="Delicious Curry Dishes"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Floating Badge */}
                  <div className="absolute top-6 right-6 bg-green-600 text-white px-6 py-3 rounded-full font-bold shadow-lg animate-float">
                    ⚡ Fast Delivery
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V120Z" fill="rgb(249, 250, 251)"/>
          </svg>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-16 animate-fadeIn">
            <div className="inline-block px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-bold mb-4">
              SIMPLE PROCESS
            </div>
            <h2 className="heading-2 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From browsing to delivery, we make it incredibly easy to enjoy authentic Indian cuisine
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {howItWorks.map((item, i) => (
              <div key={i} className="relative animate-scaleIn" style={{animationDelay: `${i * 100}ms`}}>
                <div className="text-center">
                  {/* Step Number */}
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl blur-lg opacity-50"></div>
                    <div className="relative w-20 h-20 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center shadow-elegant">
                      <span className="text-3xl font-black text-white">{item.step}</span>
                    </div>
                  </div>

                  {/* Icon */}
                  <div className="text-5xl mb-4 animate-float" style={{animationDelay: `${i * 0.2}s`}}>
                    {item.icon}
                  </div>

                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>

                {/* Arrow (except for last item) */}
                {i < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-10 -right-4 text-3xl text-green-300">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Special Offers Section */}
      <OffersSection />

      {/* Features Section - Enhanced Grid */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-16 animate-fadeIn">
            <div className="inline-block px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-bold mb-4">
              WHY CHOOSE US
            </div>
            <h2 className="heading-2 mb-4">What Makes Us Special</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience excellence in every bite with our commitment to quality and authenticity
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="group card hover-lift animate-fadeIn border-2 border-gray-100 hover:border-green-200 transition-all duration-300" style={{animationDelay: `${i * 100}ms`}}>
                {/* Icon with Gradient */}
                <div className={`w-20 h-20 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <span className="text-4xl filter drop-shadow-lg">{feature.icon}</span>
                </div>

                <h3 className="text-xl font-bold mb-3 group-hover:text-green-600 transition-colors">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Dishes - Premium Grid */}
      <section className="section-padding bg-gradient-to-b from-gray-50 to-white">
        <div className="container-custom">
          <div className="text-center mb-16 animate-fadeIn">
            <div className="inline-block px-4 py-2 bg-yellow-100 text-yellow-700 rounded-full text-sm font-bold mb-4">
              CUSTOMER FAVORITES
            </div>
            <h2 className="heading-2 mb-4">Our Signature Dishes</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Handpicked favorites loved by thousands of customers across Yokosuka
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {popularDishes.map((dish, i) => (
              <div key={i} className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col" style={{animationDelay: `${i * 100}ms`}}>
                {/* Image Container - FILLS ENTIRE WIDTH */}
                <div className="relative h-72 overflow-hidden">
                  {getMenuItemImage(dish.id) ? (
                    <img
                      src={getMenuItemImage(dish.id)!}
                      alt={dish.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-200 via-yellow-200 to-red-200 flex items-center justify-center">
                      <div className="text-center p-6">
                        <div className="text-6xl mb-2 animate-float">{['🍛', '🧈', '🍗', '🥘', '🍚', '🥣'][i % 6]}</div>
                        <span className="text-gray-500 text-sm font-medium">Photo Coming Soon</span>
                      </div>
                    </div>
                  )}

                  {/* Category Badge */}
                  <div className="absolute top-4 right-4 z-10">
                    <span className="bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg px-4 py-2 font-bold rounded-full text-xs">
                      {dish.category}
                    </span>
                  </div>

                  {/* Rating Badge */}
                  <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-sm px-3 py-2 rounded-full font-bold text-sm shadow-lg">
                    ⭐ 4.8
                  </div>
                </div>

                <div className="p-6 space-y-3 flex flex-col flex-1">
                  <h3 className="font-black text-2xl group-hover:text-green-600 transition-colors">{dish.name}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{dish.description}</p>

                  <div className="flex-1"></div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-3xl font-black text-orange-600">{dish.price}</div>
                    <Link href="/menu" className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2">
                      <span>Order Now</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12 animate-fadeIn">
            <Link href="/menu" className="btn-primary inline-flex items-center gap-2 text-lg px-10 py-4 hover-glow">
              <span>View Full Menu</span>
              <span className="text-xl">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="section-padding bg-gradient-to-br from-green-600 to-green-800 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 3px 3px, white 2px, transparent 0)',
            backgroundSize: '60px 60px'
          }}></div>
        </div>

        <div className="container-custom relative z-10">
          <div className="text-center mb-16 animate-fadeIn">
            <div className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-bold mb-4">
              TESTIMONIALS
            </div>
            <h2 className="heading-2 mb-4">What Our Customers Say</h2>
            <p className="text-xl text-green-50 max-w-2xl mx-auto">
              Join thousands of satisfied customers who love our authentic flavors
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <div key={i} className="bg-white/95 backdrop-blur-md p-8 rounded-2xl hover-lift animate-scaleIn border-2 border-green-200 shadow-xl" style={{animationDelay: `${i * 100}ms`}}>
                <div className="flex items-center gap-1 mb-4 text-yellow-500 text-xl">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i}>★</span>
                  ))}
                </div>
                <p className="text-gray-800 text-lg mb-6 leading-relaxed font-medium">&ldquo;{testimonial.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center font-bold text-xl text-white shadow-lg">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.date}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Special Offers Banner */}
      <section className="py-16 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1 animate-slideInLeft">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-3xl animate-pulse-slow">🎉</span>
                <span className="font-bold text-sm bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">LIMITED TIME</span>
              </div>
              <h3 className="text-4xl font-black mb-3">Get 15% Off Your First Order!</h3>
              <p className="text-xl text-white/90">Use code: <span className="font-bold bg-white/20 px-3 py-1 rounded">WELCOME15</span></p>
            </div>
            <div className="animate-slideInRight">
              <Link href="/menu" className="bg-white text-orange-600 hover:bg-gray-100 font-black py-4 px-10 rounded-xl transition-all duration-300 shadow-elegant hover-lift text-lg inline-block">
                Order Now & Save
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="section-padding bg-gray-900 text-white relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 animate-float" style={{
            backgroundImage: 'linear-gradient(45deg, transparent 48%, white 49%, white 51%, transparent 52%)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="container-custom text-center relative z-10">
          <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn">
            <div className="text-6xl mb-6 animate-float">📱</div>
            <h2 className="heading-2 mb-6">Ready to Experience the Best Curry in Yokosuka?</h2>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Order now through Uber Eats or Demaecan for fast delivery. Fresh, authentic Indian & Nepalese cuisine delivered hot to your door!
            </p>

            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/menu" className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-5 px-12 rounded-xl transition-all duration-300 shadow-elegant hover-lift text-lg inline-flex items-center gap-2 hover-glow">
                <span>Browse Full Menu</span>
                <span className="text-2xl">🍛</span>
              </Link>
              <Link href="/track" className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-bold py-5 px-12 rounded-xl transition-all duration-300 border-2 border-white/30 hover:border-white/50 text-lg inline-flex items-center gap-2">
                <span>Track Your Order</span>
                <span className="text-2xl">📍</span>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-8 pt-12 text-gray-400">
              <div className="flex items-center gap-2">
                <span className="text-2xl">✅</span>
                <span className="font-semibold">Halal Certified</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🚚</span>
                <span className="font-semibold">30 Min Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">⭐</span>
                <span className="font-semibold">4.9 Rating</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Career & Dine In Banners */}
      <section className="section-padding bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Career Banner */}
            <Link href="/careers" className="group">
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 md:p-12 shadow-elegant hover-lift">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-500"></div>
                <div className="relative z-10">
                  <div className="text-5xl mb-4">💼</div>
                  <h3 className="text-3xl font-bold text-white mb-3">Join Our Team</h3>
                  <p className="text-blue-100 mb-6">
                    Explore exciting career opportunities at The Curry House Yokosuka
                  </p>
                  <div className="inline-flex items-center gap-2 text-white font-semibold">
                    <span>View Open Positions</span>
                    <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>

            {/* Dine In - QR Code Ordering */}
            <div className="group">
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-600 p-8 md:p-12 shadow-elegant hover-lift">
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full -ml-32 -mb-32 group-hover:scale-110 transition-transform duration-500"></div>
                <div className="relative z-10">
                  <div className="text-5xl mb-4">📱</div>
                  <h3 className="text-3xl font-bold text-white mb-3">Dine In - QR Ordering</h3>
                  <p className="text-indigo-100 mb-6">
                    Scan QR at your table, order instantly - Direct to kitchen!
                  </p>
                  <div className="inline-flex items-center gap-2 text-white font-semibold">
                    <span>15 Tables Available</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
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
