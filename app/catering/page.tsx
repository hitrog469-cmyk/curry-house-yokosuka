'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/footer'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

export default function CateringPage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    eventType: '',
    guestCount: '',
    eventDate: '',
    eventTime: '',
    specialRequirements: ''
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('catering_inquiries')
        .insert({
          ...formData,
          guest_count: parseInt(formData.guestCount),
          status: 'pending'
        })

      if (error) throw error

      setSubmitted(true)
      setFormData({
        name: '',
        phone: '',
        email: '',
        eventType: '',
        guestCount: '',
        eventDate: '',
        eventTime: '',
        specialRequirements: ''
      })
    } catch (error) {
      console.error('Error submitting inquiry:', error)
      alert('Failed to submit inquiry. Please try again or call us directly.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-20">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="heading-1 mb-6">Party & Catering Services</h1>
            <p className="text-xl text-purple-50 mb-4">
              Make your events unforgettable with authentic Indian, Mexican, Japanese & Nepalese cuisine
            </p>
            <p className="text-purple-100">
              From intimate gatherings to grand celebrations, we bring the flavors you love to your special occasions
            </p>
          </div>
        </div>
      </div>

      {/* Services Overview */}
      <section className="section-padding bg-white">
        <div className="container-custom max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center p-6">
              <div className="text-6xl mb-4">🎂</div>
              <h3 className="text-xl font-bold mb-2">Birthday & Anniversary Parties</h3>
              <p className="text-gray-600">Celebrate your special day with delicious food that everyone will love</p>
            </div>
            <div className="text-center p-6">
              <div className="text-6xl mb-4">👔</div>
              <h3 className="text-xl font-bold mb-2">Corporate Events</h3>
              <p className="text-gray-600">Professional catering for meetings, conferences, and team celebrations</p>
            </div>
            <div className="text-center p-6">
              <div className="text-6xl mb-4">🥂</div>
              <h3 className="text-xl font-bold mb-2">Social Gatherings</h3>
              <p className="text-gray-600">Premium food for every occasion. Relive old memories and toast to new ones.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Inquiry Form */}
      <section className="section-padding bg-gradient-to-br from-gray-50 to-purple-50">
        <div className="container-custom max-w-4xl">
          {submitted ? (
            <div className="bg-white rounded-3xl p-12 shadow-elegant text-center">
              <div className="text-6xl mb-6">✅</div>
              <h2 className="text-3xl font-bold mb-4">Thank You!</h2>
              <p className="text-xl text-gray-600 mb-6">
                Your catering inquiry has been received successfully.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                <p className="text-blue-900 font-semibold mb-2">📞 What happens next?</p>
                <p className="text-blue-800">
                  Our manager will contact you within few hours to discuss your requirements and provide a custom quote.
                </p>
              </div>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setSubmitted(false)}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-3 rounded-lg transition-all"
                >
                  Submit Another Inquiry
                </button>
                <Link
                  href="/menu"
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold px-8 py-3 rounded-lg transition-all"
                >
                  View Menu
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-12">
                <h2 className="heading-2 mb-4">Let's Plan Something Special</h2>
                <p className="text-xl text-gray-600">
                  Tell us about your event and we'll craft a menu that your guests will remember.
                </p>
              </div>

              <div className="bg-white rounded-3xl p-8 md:p-12 shadow-elegant">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold mb-2">Your Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none focus:shadow-sm transition-all bg-gray-50 focus:bg-white"
                        placeholder="Rohit Acharya"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none focus:shadow-sm transition-all bg-gray-50 focus:bg-white"
                        placeholder="+81 90-1234-5678"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none focus:shadow-sm transition-all bg-gray-50 focus:bg-white"
                      placeholder="you@example.com"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold mb-2">Event Type *</label>
                      <select
                        required
                        value={formData.eventType}
                        onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none focus:shadow-sm transition-all bg-gray-50 focus:bg-white"
                      >
                        <option value="">Select event type</option>
                        <option value="birthday">Birthday Party</option>
                        <option value="anniversary">Anniversary Party</option>
                        <option value="social">Social Gathering</option>
                        <option value="corporate">Corporate Event</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2">Number of Guests *</label>
                      <input
                        type="number"
                        required
                        min="10"
                        value={formData.guestCount}
                        onChange={(e) => setFormData({ ...formData, guestCount: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none focus:shadow-sm transition-all bg-gray-50 focus:bg-white"
                        placeholder="50"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold mb-2">Event Date *</label>
                      <input
                        type="date"
                        required
                        value={formData.eventDate}
                        onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none focus:shadow-sm transition-all bg-gray-50 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2">Preferred Time</label>
                      <input
                        type="time"
                        value={formData.eventTime}
                        onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none focus:shadow-sm transition-all bg-gray-50 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2">Special Requirements</label>
                    <textarea
                      rows={4}
                      value={formData.specialRequirements}
                      onChange={(e) => setFormData({ ...formData, specialRequirements: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none focus:shadow-sm transition-all bg-gray-50 focus:bg-white"
                      placeholder="Any dietary restrictions, menu preferences, or special requests..."
                    ></textarea>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800 text-center">
                      📞 Our manager will call you within few hours to discuss your requirements and provide a custom quote
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 rounded-xl transition-all shadow-elegant hover-lift disabled:opacity-50"
                  >
                    {loading ? 'Submitting...' : 'Submit Catering Request'}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section className="section-padding bg-white">
        <div className="container-custom max-w-4xl">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl p-8 md:p-12 text-white text-center">
            <h3 className="text-2xl font-bold mb-4">Have Questions?</h3>
            <p className="text-green-50 mb-6">
              Our team is here to help you plan the perfect catering for your event
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/contact"
                className="bg-white text-green-600 hover:bg-gray-100 font-bold px-8 py-3 rounded-xl transition-all"
              >
                Contact Us
              </Link>
              <Link
                href="/menu"
                className="bg-green-700 hover:bg-green-800 text-white font-bold px-8 py-3 rounded-xl transition-all border-2 border-white/30"
              >
                View Full Menu
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
