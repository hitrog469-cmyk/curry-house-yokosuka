import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/footer'

export default function RecognitionsPage() {
  // Template data - replace with actual certificates/awards
  const recognitions = [
    {
      id: 1,
      name: 'Restaurant Guru Award',
      year: '2024',
      description: 'Recognized as one of the best restaurants in Yokosuka for exceptional Indian cuisine.',
      type: 'award',
      // Replace with actual image path: '/images/certificates/restaurant-guru-2024.jpg'
      imagePlaceholder: '🏆',
      link: null, // Optional external link
    },
    {
      id: 2,
      name: 'TripAdvisor Certificate of Excellence',
      year: '2023-2024',
      description: 'Consistently rated excellent by travelers and food enthusiasts worldwide.',
      type: 'certificate',
      imagePlaceholder: '🥇',
      link: null,
    },
    {
      id: 3,
      name: 'Halal Certification - Japan',
      year: 'Current',
      description: 'All our meat products are certified 100% Halal by authorized certification body.',
      type: 'certificate',
      imagePlaceholder: '🏅',
      link: null,
    },
    {
      id: 4,
      name: 'Google Business Excellence',
      year: '2024',
      description: 'Maintaining a 4.8+ star rating with over 500 verified reviews.',
      type: 'rating',
      imagePlaceholder: '⭐',
      link: null,
    },
    {
      id: 5,
      name: 'Food Safety Certificate',
      year: 'Current',
      description: 'Certified by Yokosuka Health Department for maintaining highest food safety standards.',
      type: 'certificate',
      imagePlaceholder: '✅',
      link: null,
    },
    {
      id: 6,
      name: 'Best Curry Restaurant Yokosuka',
      year: '2023',
      description: 'Voted best curry restaurant in the Yokosuka area by local community.',
      type: 'award',
      imagePlaceholder: '🍛',
      link: null,
    },
  ]

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'award': return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'certificate': return 'bg-green-100 text-green-800 border-green-200'
      case 'rating': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-green-700 via-green-800 to-emerald-900 text-white py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium border border-white/10 mb-6">
              <span className="text-2xl">🏆</span>
              <span className="text-emerald-50">Our Achievements</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black mb-4">Awards & Recognitions</h1>
            <p className="text-emerald-100/80 text-lg leading-relaxed">
              We&apos;re honored to be recognized by industry leaders and our amazing customers.
              These awards reflect our commitment to quality, authenticity, and exceptional service.
            </p>
          </div>
        </div>
      </section>

      {/* Recognitions Grid */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {recognitions.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300 group"
              >
                {/* Certificate/Award Image Area */}
                <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center border-b border-gray-100">
                  {/*
                    TEMPLATE: Replace this placeholder with actual certificate/award image
                    Example: <img src={item.image} alt={item.name} className="w-full h-full object-contain p-4" />
                  */}
                  <div className="text-center">
                    <span className="text-6xl block mb-2">{item.imagePlaceholder}</span>
                    <span className="text-xs text-gray-400 font-medium">
                      [Upload Certificate/Award Image]
                    </span>
                  </div>

                  {/* Type Badge */}
                  <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold border ${getTypeColor(item.type)}`}>
                    {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-green-700 transition-colors">
                      {item.name}
                    </h3>
                    <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded shrink-0">
                      {item.year}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {item.description}
                  </p>

                  {item.link && (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 font-semibold text-sm mt-4"
                    >
                      View Certificate
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add More Notice */}
          <div className="max-w-2xl mx-auto mt-12 text-center">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
              <span className="text-3xl mb-3 block">📝</span>
              <h3 className="font-bold text-amber-900 mb-2">Template Section</h3>
              <p className="text-amber-800 text-sm">
                This is a template page. Replace the placeholder images and content with your actual
                certificates, awards, and recognition documents. You can upload images or PDFs of your achievements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-12 bg-white border-t border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-16 text-gray-500">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✅</span>
              <span className="font-semibold">Halal Certified</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              <span className="font-semibold">4.8+ Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏆</span>
              <span className="font-semibold">Award Winning</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">👨‍🍳</span>
              <span className="font-semibold">Expert Chefs</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-black mb-4">Experience Award-Winning Cuisine</h2>
          <p className="text-green-100 mb-8 max-w-lg mx-auto">
            Taste why we&apos;ve been recognized as one of the best. Order now or visit us today!
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/menu"
              className="bg-white text-green-700 hover:bg-green-50 font-bold px-8 py-3.5 rounded-xl transition-colors shadow-sm"
            >
              Order Now
            </Link>
            <Link
              href="/contact"
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-3.5 rounded-xl transition-colors border border-white/20"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
