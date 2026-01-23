'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/footer';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-black mb-6 animate-fade-in">
            Our Story
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
            Bringing authentic flavors from India, Nepal, and Mexico to Yokosuka since 2020
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Mission Statement */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 md:p-12 mb-16 border border-gray-200 dark:border-gray-700">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-6">
              Our Mission
            </h2>
            <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed mb-8">
              At The Curry House Yokosuka, we're passionate about serving authentic,
              high-quality dishes that transport you to the streets of India, the mountains
              of Nepal, and the vibrant markets of Mexico. Every meal is prepared with love,
              traditional recipes, and the finest ingredients.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/menu" className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-8 py-4 rounded-xl hover:from-orange-700 hover:to-red-700 transition-all font-bold text-lg shadow-xl">
                View Our Menu
              </Link>
              <Link href="/careers" className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white px-8 py-4 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-bold text-lg">
                Join Our Team
              </Link>
            </div>
          </div>
        </div>

        {/* Our Values */}
        <div className="mb-16">
          <h2 className="text-4xl font-black text-center text-gray-900 dark:text-white mb-12">
            What We Stand For
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '🌶️',
                title: 'Authentic Flavors',
                description: 'We use traditional recipes and authentic spices imported directly from India and Nepal to ensure every bite is genuine.'
              },
              {
                icon: '🥘',
                title: 'Fresh Ingredients',
                description: 'Only the freshest, highest-quality ingredients make it into our kitchen. We source locally when possible and never compromise on quality.'
              },
              {
                icon: '❤️',
                title: 'Made with Love',
                description: 'Every dish is prepared by experienced chefs who pour their heart and soul into creating memorable dining experiences.'
              },
              {
                icon: '🌍',
                title: 'Community First',
                description: 'We\'re proud to serve the Yokosuka community and create a welcoming space where everyone feels like family.'
              },
              {
                icon: '⚡',
                title: 'Fast Service',
                description: 'Quick delivery without compromising quality. We value your time and ensure your food arrives hot and fresh.'
              },
              {
                icon: '💯',
                title: 'Customer Satisfaction',
                description: 'Your happiness is our priority. We go above and beyond to ensure every order exceeds expectations.'
              }
            ].map((value, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-shadow">
                <div className="text-6xl mb-4">{value.icon}</div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Our Story Timeline */}
        <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-8 md:p-12 mb-16 border border-orange-200 dark:border-gray-700">
          <h2 className="text-4xl font-black text-center text-gray-900 dark:text-white mb-12">
            Our Journey
          </h2>
          <div className="max-w-3xl mx-auto space-y-8">
            {[
              {
                year: '2020',
                title: 'The Beginning',
                description: 'Founded by passionate food enthusiasts who wanted to bring authentic Indian and Nepali cuisine to Yokosuka.'
              },
              {
                year: '2021',
                title: 'Expanding Horizons',
                description: 'Added Mexican specialties to our menu, creating a unique fusion dining experience beloved by locals.'
              },
              {
                year: '2022',
                title: 'Going Digital',
                description: 'Launched our online ordering platform to serve our community better with convenient delivery options.'
              },
              {
                year: '2024',
                title: 'Growing Strong',
                description: 'Serving thousands of happy customers and continuing to perfect our recipes with customer feedback.'
              }
            ].map((milestone, idx) => (
              <div key={idx} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-24 h-24 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-black text-2xl">{milestone.year}</span>
                </div>
                <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {milestone.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {milestone.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-3xl p-12 text-center text-white shadow-2xl">
          <h2 className="text-4xl font-black mb-4">
            Experience The Difference
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust us for authentic, delicious meals delivered right to their door.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/menu" className="bg-white text-orange-600 px-8 py-4 rounded-xl hover:bg-gray-100 transition-all font-bold text-lg shadow-xl">
              Order Now
            </Link>
            <Link href="/contact" className="bg-orange-700 text-white px-8 py-4 rounded-xl hover:bg-orange-800 transition-all font-bold text-lg">
              Contact Us
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
