'use client'

import Navbar from '@/components/Navbar'
import Footer from '@/components/footer'
import { offers } from '@/lib/offers-data'
import Link from 'next/link'

export default function OffersPage() {
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-16">
        <div className="container-custom">
          <div className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-5xl font-black mb-4">Special Offers & Promotions</h1>
            <p className="text-xl text-purple-100 mb-6">
              Save big with our exclusive deals and limited-time offers!
            </p>
            <Link
              href="/menu"
              className="inline-block bg-white hover:bg-gray-100 text-purple-600 font-bold px-8 py-4 rounded-full transition-all shadow-lg hover:shadow-xl"
            >
              Order Now & Save!
            </Link>
          </div>
        </div>
      </div>

      {/* Offers Grid */}
      <div className="container-custom py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${getColorClasses(offer.color)} p-8 shadow-2xl hover-lift border-4 ${
                offer.isActive ? '' : 'opacity-50 grayscale'
              }`}
            >
              {/* Active Badge */}
              {!offer.isActive && (
                <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-2 rounded-full text-xs font-bold">
                  EXPIRED
                </div>
              )}

              {/* Emoji Badge */}
              <div className="absolute top-4 right-4 text-6xl opacity-20 transform group-hover:scale-110 transition-transform">
                {offer.emoji}
              </div>

              {/* Content */}
              <div className="relative z-10">
                {/* Title */}
                <div className="mb-6">
                  <div className="inline-block bg-white/30 backdrop-blur-sm px-4 py-2 rounded-full mb-3">
                    <span className="text-xs font-black text-white tracking-wider">{offer.validUntil}</span>
                  </div>
                  <h2 className="text-4xl font-black text-white mb-3">{offer.title}</h2>
                  <p className="text-xl text-white/90 font-semibold">{offer.titleJp}</p>
                </div>

                {/* Description */}
                <div className="mb-6 min-h-[100px]">
                  <p className="text-xl font-bold text-white mb-2 leading-relaxed">{offer.description}</p>
                  <p className="text-sm text-white/80">{offer.descriptionJp}</p>
                </div>

                {/* Discount Badge */}
                {offer.discount && (
                  <div className="mb-6">
                    <div className="inline-block bg-white text-gray-900 px-8 py-4 rounded-2xl shadow-xl">
                      <span className="text-3xl font-black">{offer.discount}</span>
                    </div>
                  </div>
                )}

                {/* Restrictions */}
                {offer.restrictions && (
                  <div className="mt-6 pt-6 border-t-2 border-white/30">
                    <p className="text-xs font-semibold text-white/90 mb-2 uppercase tracking-wide">Terms & Conditions:</p>
                    <p className="text-xs text-white/70 mb-2 leading-relaxed">{offer.restrictions}</p>
                    <p className="text-xs text-white/60 leading-relaxed">{offer.restrictionsJp}</p>
                  </div>
                )}

                {/* CTA Button */}
                {offer.isActive && (
                  <div className="mt-8">
                    <Link
                      href="/menu"
                      className="inline-flex items-center gap-2 bg-white hover:bg-gray-100 text-gray-900 font-bold px-8 py-4 rounded-full transition-all shadow-lg hover:shadow-xl w-full justify-center"
                    >
                      <span>Claim This Offer</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="mt-12 card bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Want to stay updated on new offers?</h3>
            <p className="text-gray-600 mb-6">
              Follow us on Instagram and never miss a deal!
            </p>
            <a
              href="https://instagram.com/thecurryh"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-8 py-4 rounded-full transition-all shadow-lg hover:shadow-xl"
            >
              <span>📱</span>
              <span>Follow @thecurryh</span>
            </a>
          </div>
        </div>

        {/* How to Redeem */}
        <div className="mt-12 card">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">How to Redeem Offers</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">1️⃣</span>
              </div>
              <h4 className="font-bold text-lg mb-2">Browse Menu</h4>
              <p className="text-gray-600 text-sm">Check our menu and add items to your cart</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">2️⃣</span>
              </div>
              <h4 className="font-bold text-lg mb-2">Mention Offer</h4>
              <p className="text-gray-600 text-sm">Add the offer name in your order notes</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">3️⃣</span>
              </div>
              <h4 className="font-bold text-lg mb-2">Enjoy Savings</h4>
              <p className="text-gray-600 text-sm">Get your discount applied at checkout!</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
