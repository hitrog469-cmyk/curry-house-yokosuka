import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <img src="/images/Logo.png" alt="The Curry House" className="w-10 h-10 opacity-90" />
              <div>
                <span className="font-black text-lg block leading-tight">The Curry House</span>
                <span className="text-green-400 text-sm font-semibold">Yokosuka</span>
              </div>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              Authentic Indian, Nepalese, Mexican & Japanese-Fusion cuisine.
              Serving Yokosuka with love since 2020.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-3">
              <a href="#" className="w-9 h-9 bg-gray-800 hover:bg-green-600 rounded-lg flex items-center justify-center transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="#" className="w-9 h-9 bg-gray-800 hover:bg-green-600 rounded-lg flex items-center justify-center transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="#" className="w-9 h-9 bg-gray-800 hover:bg-green-600 rounded-lg flex items-center justify-center transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/menu" className="text-gray-400 hover:text-green-400 transition-colors text-sm flex items-center gap-2">
                  <span>→</span> Full Menu
                </Link>
              </li>
              <li>
                <Link href="/order" className="text-gray-400 hover:text-green-400 transition-colors text-sm flex items-center gap-2">
                  <span>→</span> Order Online
                </Link>
              </li>
              <li>
                <Link href="/table-order" className="text-gray-400 hover:text-green-400 transition-colors text-sm flex items-center gap-2">
                  <span>→</span> Dine-In QR Order
                </Link>
              </li>
              <li>
                <Link href="/track" className="text-gray-400 hover:text-green-400 transition-colors text-sm flex items-center gap-2">
                  <span>→</span> Track Order
                </Link>
              </li>
              <li>
                <Link href="/catering" className="text-gray-400 hover:text-green-400 transition-colors text-sm flex items-center gap-2">
                  <span>→</span> Catering & Events
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Company</h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-green-400 transition-colors text-sm flex items-center gap-2">
                  <span>→</span> About Us
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="text-gray-400 hover:text-green-400 transition-colors text-sm flex items-center gap-2">
                  <span>→</span> Gallery
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-gray-400 hover:text-green-400 transition-colors text-sm flex items-center gap-2">
                  <span>→</span> Careers
                </Link>
              </li>
              <li>
                <Link href="/recognitions" className="text-gray-400 hover:text-green-400 transition-colors text-sm flex items-center gap-2">
                  <span>→</span> Awards & Recognition
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-green-400 transition-colors text-sm flex items-center gap-2">
                  <span>→</span> Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Contact Us</h3>
            <ul className="space-y-3">
              <li>
                <a href="tel:046-813-5869" className="text-gray-400 hover:text-green-400 transition-colors text-sm flex items-center gap-3">
                  <span className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center shrink-0">📞</span>
                  <span>046-813-5869</span>
                </a>
              </li>
              <li>
                <a href="tel:046-828-6716" className="text-gray-400 hover:text-green-400 transition-colors text-sm flex items-center gap-3">
                  <span className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center shrink-0">📱</span>
                  <span>046-828-6716</span>
                </a>
              </li>
              <li>
                <a href="mailto:thecurryhouseyokosuka@gmail.com" className="text-gray-400 hover:text-green-400 transition-colors text-sm flex items-center gap-3">
                  <span className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center shrink-0">✉️</span>
                  <span className="break-all">thecurryhouseyokosuka@gmail.com</span>
                </a>
              </li>
              <li className="pt-2">
                <div className="text-gray-400 text-sm flex items-start gap-3">
                  <span className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center shrink-0">📍</span>
                  <span>Yokosuka City, Kanagawa, Japan</span>
                </div>
              </li>
            </ul>

            {/* Hours */}
            <div className="mt-5 p-4 bg-gray-800/50 rounded-xl">
              <p className="text-xs font-bold text-green-400 uppercase tracking-wider mb-2">Opening Hours</p>
              <p className="text-gray-400 text-sm">Mon - Fri: 11:00 AM - 10:00 PM</p>
              <p className="text-gray-400 text-sm">Sat - Sun: 11:00 AM - 11:00 PM</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              © {currentYear} The Curry House Yokosuka. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/privacy" className="text-gray-500 hover:text-green-400 transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="text-gray-500 hover:text-green-400 transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
