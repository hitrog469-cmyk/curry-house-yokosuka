'use client'

import { offers, getActiveOffers } from '@/lib/offers-data'
import Link from 'next/link'

export default function OffersSection() {
  const activeOffers = getActiveOffers()

  const getColorClasses = (color: string) => {
    const colors: any = {
      orange: 'from-orange-500 to-amber-600 border-orange-300',
      green: 'from-green-500 to-emerald-600 border-green-300',
      red: 'from-red-500 to-rose-600 border-red-300',
      blue: 'from-blue-500 to-cyan-600 border-blue-300',
      purple: 'from-purple-500 to-fuchsia-600 border-purple-300'
    }
    return colors[color] || colors.orange
  }

  return (
    <section className="section-padding bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="heading-2 mb-4">Special Offers</h2>
          <p className="text-xl text-gray-600">Limited time deals & promotions</p>
        </div>

        {/* Offers Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {activeOffers.map((offer) => (
            <div
              key={offer.id}
              className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${getColorClasses(offer.color)} p-8 shadow-elegant hover-lift border-4`}
            >
              {/* Emoji Badge */}
              <div className="absolute top-4 right-4 text-6xl opacity-20 transform group-hover:scale-110 transition-transform">
                {offer.emoji}
              </div>

              {/* Content */}
              <div className="relative z-10">
                {/* Title */}
                <div className="mb-4">
                  <div className="inline-block bg-white/30 backdrop-blur-sm px-4 py-2 rounded-full mb-3">
                    <span className="text-xs font-black text-white tracking-wider">{offer.validUntil}</span>
                  </div>
                  <h3 className="text-3xl font-black text-white mb-2">{offer.title}</h3>
                  <p className="text-lg text-white/90 font-semibold">{offer.titleJp}</p>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <p className="text-xl font-bold text-white mb-2">{offer.description}</p>
                  <p className="text-sm text-white/80">{offer.descriptionJp}</p>
                </div>

                {/* Discount Badge */}
                {offer.discount && (
                  <div className="mb-6">
                    <div className="inline-block bg-white text-gray-900 px-6 py-3 rounded-full shadow-lg">
                      <span className="text-2xl font-black">{offer.discount}</span>
                    </div>
                  </div>
                )}

                {/* Restrictions */}
                {offer.restrictions && (
                  <div className="mt-6 pt-6 border-t border-white/30">
                    <p className="text-xs text-white/70 mb-1">{offer.restrictions}</p>
                    <p className="text-xs text-white/60">{offer.restrictionsJp}</p>
                  </div>
                )}

                {/* CTA Button */}
                <div className="mt-6">
                  <Link
                    href="/menu"
                    className="inline-flex items-center gap-2 bg-white hover:bg-gray-100 text-gray-900 font-bold px-6 py-3 rounded-full transition-all shadow-lg hover:shadow-xl"
                  >
                    <span>Order Now</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center">
          <p className="text-gray-600">
            Follow us on Instagram{' '}
            <a href="https://instagram.com/thecurryh" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-700 font-bold">
              @thecurryh
            </a>
            {' '}for more exclusive offers!
          </p>
        </div>
      </div>
    </section>
  )
}
