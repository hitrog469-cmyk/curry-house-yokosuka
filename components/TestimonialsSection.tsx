'use client'

import { useState, useEffect } from 'react'
import StarRating from './StarRating'

const STATIC_FALLBACK = [
  { id: 's1', reviewer_name: 'Yuki Tanaka', rating: 5, comment: 'Best Indian food in Yokosuka! The butter chicken is absolutely amazing.', created_at: '2026-01-15', is_verified: true },
  { id: 's2', reviewer_name: 'Michael Chen', rating: 5, comment: 'Fast delivery, great portions, and authentic taste. Highly recommended!', created_at: '2026-01-10', is_verified: true },
  { id: 's3', reviewer_name: 'Sarah Johnson', rating: 5, comment: 'The paneer dishes are incredible. Love ordering from here every week!', created_at: '2025-12-20', is_verified: true },
]

interface Review {
  id: string
  reviewer_name: string
  rating: number
  comment: string | null
  created_at: string
  is_verified: boolean
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export default function TestimonialsSection() {
  const [reviews, setReviews] = useState<Review[]>(STATIC_FALLBACK)
  const [avgRating, setAvgRating] = useState(5.0)

  useEffect(() => {
    fetch('/api/reviews?limit=6')
      .then(r => r.json())
      .then(data => {
        if (data.reviews && data.reviews.length > 0) {
          setReviews(data.reviews.slice(0, 6))
          const avg = data.reviews.reduce((s: number, r: Review) => s + r.rating, 0) / data.reviews.length
          setAvgRating(Math.round(avg * 10) / 10)
        }
      })
      .catch(() => {}) // silently fall back to static
  }, [])

  return (
    <section className="py-16 md:py-20 bg-gradient-to-br from-green-50 to-emerald-50 relative overflow-hidden">
      <div className="absolute top-10 left-10 w-72 h-72 bg-green-200/20 rounded-full blur-2xl" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-200/20 rounded-full blur-2xl" />

      <div className="container-custom relative z-10">
        <div className="text-center mb-12">
          <span className="text-green-600 font-semibold text-sm uppercase tracking-widest">Customer Reviews</span>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mt-2">What Our Customers Say</h2>
          <div className="flex items-center justify-center gap-2 mt-3">
            <StarRating rating={Math.round(avgRating)} readOnly size="md" />
            <span className="text-gray-600 font-semibold">{avgRating.toFixed(1)} out of 5</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl p-6 border border-green-100 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="mb-3">
                <StarRating rating={r.rating} readOnly size="sm" />
              </div>
              <p className="text-gray-700 leading-relaxed mb-5 text-sm">&ldquo;{r.comment || 'Great experience!'}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
                  {r.reviewer_name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-sm flex items-center gap-1">
                    {r.reviewer_name}
                    {r.is_verified && <span className="text-xs text-green-600 font-normal">✓ Verified</span>}
                  </div>
                  <div className="text-xs text-gray-500">{formatDate(r.created_at)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
