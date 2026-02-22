'use client'

import { useState } from 'react'
import StarRating from './StarRating'
import { X, CheckCircle } from 'lucide-react'

interface ReviewModalProps {
  orderId: string
  orderType?: string
  customerName: string
  onClose: () => void
  onSubmitted: () => void
}

export default function ReviewModal({ orderId, orderType = 'online', customerName, onClose, onSubmitted }: ReviewModalProps) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent!']

  const handleSubmit = async () => {
    if (rating === 0) { setError('Please select a star rating'); return }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, orderType, rating, comment: comment.trim(), reviewerName: customerName }),
      })
      if (!res.ok) throw new Error('Failed to submit')
      setDone(true)
      setTimeout(() => { onSubmitted(); onClose() }, 2000)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>

        {done ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Thank You!</h2>
            <p className="text-gray-600">Your review has been submitted.</p>
            <p className="text-sm text-gray-400 mt-1">ありがとうございました！</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">🍛</div>
              <h2 className="text-xl font-bold text-gray-900">How was your experience?</h2>
              <p className="text-sm text-gray-500 mt-1">The Curry House Yokosuka</p>
            </div>

            {/* Star Rating */}
            <div className="flex flex-col items-center gap-2 mb-6">
              <StarRating rating={rating} onChange={setRating} size="lg" />
              <p className={`text-sm font-semibold transition-all ${rating > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
                {labels[rating] || 'Tap to rate'}
              </p>
            </div>

            {/* Comment */}
            <div className="mb-4">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 300))}
                placeholder="Tell us about your visit... (optional)"
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:outline-none resize-none text-sm"
              />
              <p className="text-xs text-gray-400 text-right mt-1">{comment.length}/300</p>
            </div>

            {error && <p className="text-red-500 text-sm mb-3 text-center">{error}</p>}

            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Skip
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
