'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// Pre-generated secure tokens for each table (18 tables)
// In production, these would be stored in the database and can be regenerated
const TABLE_TOKENS: { [key: number]: string } = {
  1: 'tbl1_K9xm2Pq5',
  2: 'tbl2_Lw8nR3jh',
  3: 'tbl3_Mb4pS7yk',
  4: 'tbl4_Nc6qT1zm',
  5: 'tbl5_Od2rU5an',
  6: 'tbl6_Pe8sV9bo',
  7: 'tbl7_Qf4tW3cp',
  8: 'tbl8_Rg6uX7dq',
  9: 'tbl9_Sh2vY1er',
  10: 'tbl10_Ti8wZ5fs',
  11: 'tbl11_Uj4xA9gt',
  12: 'tbl12_Vk6yB3hu',
  13: 'tbl13_Wl2zC7iv',
  14: 'tbl14_Xm8aD1jw',
  15: 'tbl15_Yn4bE5kx',
  16: 'tbl16_Zo6cF9ly',
  17: 'tbl17_Ap2dG3mz',
  18: 'tbl18_Bq8eH7na',
}

export default function QRCodesPage() {
  const [baseUrl, setBaseUrl] = useState('https://curry-house-yokosuka.vercel.app')
  const totalTables = 18

  const generateQRCodeUrl = (tableNumber: number) => {
    const token = TABLE_TOKENS[tableNumber]
    // Include secure token in URL for QR locking security
    const orderUrl = `${baseUrl}/table-order?table=${tableNumber}&token=${token}`
    // Using a free QR code API
    return `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(orderUrl)}`
  }

  const downloadQRCode = (tableNumber: number) => {
    const qrUrl = generateQRCodeUrl(tableNumber)
    const link = document.createElement('a')
    link.href = qrUrl
    link.download = `table-${tableNumber}-qr-code.png`
    link.click()
  }

  const downloadAllQRCodes = () => {
    for (let i = 1; i <= totalTables; i++) {
      setTimeout(() => downloadQRCode(i), i * 500) // Stagger downloads
    }
  }

  const printQRCode = (tableNumber: number) => {
    const printWindow = window.open('', '', 'width=600,height=800')
    if (!printWindow) return

    const qrUrl = generateQRCodeUrl(tableNumber)

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Table ${tableNumber} QR Code</title>
        <style>
          body {
            margin: 0;
            padding: 40px;
            font-family: Arial, sans-serif;
            text-align: center;
          }
          .container {
            max-width: 400px;
            margin: 0 auto;
            border: 3px solid #000;
            padding: 30px;
            border-radius: 20px;
          }
          h1 {
            font-size: 48px;
            margin: 0 0 20px 0;
            color: #16a34a;
          }
          .table-number {
            font-size: 72px;
            font-weight: bold;
            color: #000;
            margin: 20px 0;
          }
          img {
            width: 300px;
            height: 300px;
            margin: 20px 0;
          }
          .instructions {
            font-size: 18px;
            color: #666;
            margin-top: 20px;
            line-height: 1.6;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #16a34a;
            margin-bottom: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">🍛 The Curry House Yokosuka</div>
          <h1>Scan & Order</h1>
          <div class="table-number">TABLE ${tableNumber}</div>
          <img src="${qrUrl}" alt="Table ${tableNumber} QR Code" />
          <div class="instructions">
            <strong>How to order:</strong><br>
            1. Scan this QR code with your phone<br>
            2. Browse our menu<br>
            3. Add items to cart<br>
            4. Send order to kitchen<br><br>
            <strong>Note:</strong> No need for login!<br>
            Order goes directly to the kitchen.
          </div>
        </div>
      </body>
      </html>
    `)

    printWindow.document.close()
    setTimeout(() => {
      printWindow.print()
    }, 500)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container-custom py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">QR Code Generator</h1>
              <p className="text-gray-600">Generate QR codes for table ordering</p>
            </div>
            <Link
              href="/admin"
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold px-6 py-3 rounded-lg transition-all"
            >
              ← Back to Admin
            </Link>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Base URL Configuration */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Base URL Configuration</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="https://your-domain.com"
            />
            <button
              onClick={downloadAllQRCodes}
              className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-lg transition-all whitespace-nowrap"
            >
              📥 Download All QR Codes
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Update this to match your actual domain before generating QR codes
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <h3 className="font-bold text-blue-900 mb-2">📝 Instructions:</h3>
          <ul className="text-blue-800 space-y-1 text-sm">
            <li>• Click "Print" to print a single QR code with table number</li>
            <li>• Click "Download" to save the QR code image</li>
            <li>• Click "Download All" to get all 18 QR codes at once</li>
            <li>• Each QR code has a unique security token to prevent fraud</li>
            <li>• Print and place QR codes on respective tables</li>
            <li>• View live orders on the <Link href="/kitchen" className="underline font-semibold">Kitchen Display</Link></li>
            <li>• Manage tables on the <Link href="/staff/dashboard" className="underline font-semibold">Staff Dashboard</Link></li>
          </ul>
        </div>

        {/* Staff Dashboard Link */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Staff Counter Panel</h3>
              <p className="text-gray-400 text-sm">Color-coded table grid with one-tap printing</p>
            </div>
            <Link
              href="/staff/dashboard"
              className="bg-white text-gray-900 hover:bg-gray-100 font-bold px-6 py-3 rounded-xl transition-all"
            >
              Open Staff Panel →
            </Link>
          </div>
        </div>

        {/* QR Code Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: totalTables }, (_, i) => i + 1).map(tableNumber => (
            <div key={tableNumber} className="bg-white rounded-xl shadow-md overflow-hidden hover-lift">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4">
                <h3 className="text-2xl font-bold text-center">TABLE {tableNumber}</h3>
              </div>

              <div className="p-6">
                <div className="bg-gray-100 rounded-lg p-4 mb-4 flex items-center justify-center">
                  <img
                    src={generateQRCodeUrl(tableNumber)}
                    alt={`Table ${tableNumber} QR Code`}
                    className="w-48 h-48"
                  />
                </div>

                <div className="text-xs text-gray-500 mb-4 font-mono break-all bg-gray-50 p-2 rounded">
                  {baseUrl}/table-order?table={tableNumber}&token={TABLE_TOKENS[tableNumber]}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => printQRCode(tableNumber)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-all text-sm"
                  >
                    🖨️ Print
                  </button>
                  <button
                    onClick={() => downloadQRCode(tableNumber)}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-all text-sm"
                  >
                    📥 Download
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Kitchen Display Link */}
        <div className="mt-12 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-2">Kitchen Display Ready</h3>
          <p className="mb-6 text-orange-100">
            Open the kitchen display screen on your laptop to receive orders
          </p>
          <Link
            href="/kitchen"
            className="inline-block bg-white text-orange-600 hover:bg-gray-100 font-bold px-8 py-4 rounded-xl transition-all shadow-lg"
          >
            Open Kitchen Display →
          </Link>
        </div>
      </div>
    </div>
  )
}
