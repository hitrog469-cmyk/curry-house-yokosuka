import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 mb-6">
          <div>
            <h3 className="font-bold text-lg mb-3">The Curry House Yokosuka</h3>
            <p className="text-gray-400 text-sm">
              Authentic Indian, Nepalese & Mexican Cuisine in Yokosuka
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-3">Quick Links</h3>
            <div className="space-y-2 text-sm">
              <Link href="/menu" className="block text-gray-400 hover:text-white">Menu</Link>
              <Link href="/order" className="block text-gray-400 hover:text-white">Order Now</Link>
              <Link href="/track" className="block text-gray-400 hover:text-white">Track Order</Link>
              <Link href="/login" className="block text-gray-400 hover:text-white">Login</Link>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-3">Contact</h3>
            <div className="text-gray-400 text-sm space-y-1">
              <p>📞 046-813-5869</p>
              <p>📞 046-828-6716</p>
              <p>✉️ thecurryhouseyokosuka@gmail.com</p>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-6 text-center text-gray-400 text-sm">
          <p>© 2026 The Curry House Yokosuka. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}