'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/footer'
import Link from 'next/link'

export default function GalleryPage() {
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  // Placeholder photos until real guest photos are uploaded
  const placeholderPhotos = [
    { id: 1, category: 'Curry', emoji: '🍛' },
    { id: 2, category: 'Biryani', emoji: '🍚' },
    { id: 3, category: 'Naan', emoji: '🫓' },
    { id: 4, category: 'Dessert', emoji: '🍮' },
    { id: 5, category: 'Drinks', emoji: '🥤' },
    { id: 6, category: 'Mexican', emoji: '🌮' },
    { id: 7, category: 'Japanese', emoji: '🍱' },
    { id: 8, category: 'Nepalese', emoji: '🥟' },
  ]

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)

    // In a real implementation, you would upload to a server or cloud storage
    // For now, we'll create local URLs
    const newPhotos: string[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const url = URL.createObjectURL(file)
      newPhotos.push(url)
    }

    setUploadedPhotos(prev => [...prev, ...newPhotos])
    setUploading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-16">
        <div className="container-custom">
          <h1 className="heading-1 mb-4">Guest Photo Gallery</h1>
          <p className="text-xl text-purple-50 mb-2">
            Share your delicious moments with us!
          </p>
          <p className="text-purple-100">
            Upload photos of your orders and become part of our community
          </p>
        </div>
      </div>

      {/* Upload Section */}
      <div className="container-custom py-12">
        <div className="max-w-2xl mx-auto mb-12">
          <div className="card bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">📸</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Share Your Food Photos</h2>
              <p className="text-gray-600">
                Show us how you enjoyed our dishes! Your photos might be featured on our website.
              </p>
            </div>

            <label className="block">
              <div className="relative">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="cursor-pointer block text-center p-8 border-2 border-dashed border-purple-300 rounded-xl bg-white hover:bg-purple-50 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="text-4xl">⬆️</div>
                    <div className="font-bold text-gray-900">Click to Upload Photos</div>
                    <div className="text-sm text-gray-500">
                      JPG, PNG, or GIF (max 5MB each)
                    </div>
                  </div>
                </label>
              </div>
            </label>

            {uploading && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-2 text-purple-600 font-semibold">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Uploading...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Gallery Grid */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            {uploadedPhotos.length > 0 ? 'Your Uploaded Photos' : 'Coming Soon - Guest Photos'}
          </h2>

          {uploadedPhotos.length > 0 ? (
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
              {uploadedPhotos.map((photo, i) => (
                <div key={i} className="card overflow-hidden hover-lift group">
                  <div className="aspect-square bg-gray-200">
                    <img
                      src={photo}
                      alt={`Guest photo ${i + 1}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    <p className="text-sm font-semibold">Thank you for sharing!</p>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {/* Placeholder Grid */}
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {placeholderPhotos.map((item) => (
              <div key={item.id} className="card overflow-hidden hover-lift group">
                <div className="aspect-square bg-gradient-to-br from-orange-100 via-yellow-100 to-pink-100 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-7xl mb-2 group-hover:scale-125 transition-transform duration-300">
                      {item.emoji}
                    </div>
                    <div className="text-sm font-semibold text-gray-600">{item.category}</div>
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-r from-gray-700 to-gray-800 text-white">
                  <p className="text-xs font-semibold text-center">Photo Coming Soon</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="card bg-gradient-to-br from-purple-600 to-pink-600 text-white max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">Haven't Tried Our Food Yet?</h3>
            <p className="text-purple-100 mb-6">
              Order now and share your experience with our growing community!
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/menu" className="bg-white text-purple-600 hover:bg-gray-100 font-bold py-3 px-8 rounded-xl transition-all duration-300 shadow-lg hover-lift">
                View Menu
              </Link>
              <Link href="/order" className="bg-purple-800 hover:bg-purple-900 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 border-2 border-white/30">
                Order Now
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
