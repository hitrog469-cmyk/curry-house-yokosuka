# 🍛 The Curry House Yokosuka - Restaurant Website

A modern, full-featured restaurant website with online ordering, admin dashboard, and staff management system.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-Database-green)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8)

---

## 🌟 Live Demo

**Website:** [Coming Soon - After Deployment]

**Admin Panel:** [Coming Soon - After Deployment]/admin

**Test Credentials:**
- Admin: `admin@curryhouse.com` / `admin123`
- Staff: `staff@curryhouse.com` / `staff123`

---

## ✨ Key Features

### 🛒 Customer Features
- **Full Menu Browsing** - 200+ authentic Indian & Mexican dishes with photos
- **Smart Cart System** - Add items, variations, and add-ons
- **Real-time Ordering** - Place orders for pickup or delivery
- **Restaurant Hours Check** - Orders only accepted during business hours (11 AM - 10 PM)
- **Delivery Fee Calculator** - Automatic calculation based on base price
- **15-Minute Cancellation Window** - Cancel orders within 15 minutes of placement
- **Order Tracking** - Track order status in real-time
- **Bilingual Support** - English and Japanese menu names

### 👨‍💼 Admin Features
- **Dashboard Overview** - Total orders, revenue, and analytics
- **Order Management** - View, update, and manage all orders
- **Menu Management** - Add, edit, delete menu items and categories
- **Staff Management** - Manage staff accounts and assignments
- **User Management** - View and manage customer accounts
- **Auto-Assignment System** - Orders automatically assigned to available staff

### 👨‍🍳 Staff Features
- **Order Notifications** - Instant notifications for assigned orders
- **Order Status Updates** - Mark orders as preparing, ready, completed
- **Assigned Orders View** - See only orders assigned to you

---

## 📋 Complete Menu Categories

### 🍱 Set Meals (5 items)
- Cheese Naan Set
- 1 Curry Set
- Yokosuka Set
- CFAY Set
- Nepalese Traditional Thakali Meal

### 🥗 Starters (12 items)
- Chips & Guacamole
- Chips & Pico de Gallo
- Queso Dip
- Mini Quesadillas (Cheese, Chicken, Beef)
- Full Quesadillas (Cheese, Chicken, Beef)
- Caesar Salad
- Kuchumber Salad
- Nachos

### 🍗 Tandoori Items (6 items)
- Tandoori Chicken
- Chicken Tikka
- Garlic Chicken Tikka
- Spicy Garlic Chicken Tikka
- Seek Kabab
- Tandoori Lamb Chop

### 🥘 Curries (30+ items)
- **Vegetable Curries** (6) - Vegetable Curry, Paneer Makhani, Chana Masala, Dal Tadka, Tomato & Eggplant, Spinach Paneer
- **Seafood Curries** (4) - Seafood Curry, Butter Shrimp, Shrimp Masala, Spinach Shrimp
- **Chicken Curries** (8) - Butter Chicken, Chicken Tikka Masala, Spinach Chicken, Coconut Chicken, and more
- **Mutton Curries** (6) - Mutton Curry, Mutton Masala, Spinach Mutton, Dal Mutton, and more
- **Keema Curries** (4) - Keema Curry, Keema Cheese, Keema Egg, Keema Spinach
- **Special Curries** (4) - Spicy Garlic Dry Curries, Tandoori Masala Curries

### 🌮 Mexican (6 items)
- Burritos (Cheese, Chicken, Beef)
- Tacos (Cheese, Chicken, Beef)
- Enchiladas (Cheese, Chicken, Beef)

### 🍚 Rice & Biryani (12 items)
- Chicken Biryani
- Mutton Biryani
- Egg Biryani
- Pulao
- Plain Rice
- Specialty Rice (Saffron, Garlic, Cumin)
- Fried Rice varieties

### 🍞 Naan & Bread (11 items)
- Plain Naan
- Cheese Naan
- Garlic Naan
- Cheese Garlic Naan
- Honey Naan
- Honey Cheese Garlic Naan
- And more specialty naans

### 🍟 Fried Items (7 items)
- Samosa
- French Fries
- Chicken Lollipop
- Chicken Wings
- Cheese Ball
- Pakodas

### 🥟 Snacks (8 items)
- Momos
- Chicken Chilli
- Papad varieties
- Potato Chilli
- Shrimp Chilli
- Edamame
- Chicken Sekuwa

### 🍹 Drinks (4 items)
- Lassi
- Mango Lassi
- Strawberry Lassi
- Blueberry Lassi

### 🍸 Cocktails & Margaritas (12 items)
- Various margarita flavors

---

## 🛠️ Technology Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, React
- **Styling:** Tailwind CSS, shadcn/ui components
- **Backend:** Supabase (PostgreSQL, Authentication, Real-time)
- **State Management:** React Context API
- **Storage:** localStorage (cart), Supabase Database (orders, users)
- **Authentication:** Supabase Auth with Row Level Security (RLS)
- **Deployment:** Vercel (recommended)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Supabase account (free tier works)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/curry-house-yokosuka.git
cd curry-house-yokosuka
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key (optional)
```

4. **Set up Supabase Database**

Run all SQL migrations in your Supabase SQL editor:
- `AUTO-ASSIGN-STAFF.sql` - Auto-assignment system
- `CANCELLATION-WINDOW.sql` - 15-minute cancellation rule
- `PHONE-VALIDATION.sql` - Phone number validation
- `FINAL-RLS-SETUP.sql` - Security policies

5. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
curry-house-yokosuka/
├── app/                      # Next.js 14 app directory
│   ├── page.tsx             # Homepage
│   ├── menu/                # Menu browsing
│   ├── order/               # Order placement
│   ├── track/               # Order tracking
│   ├── admin/               # Admin dashboard
│   ├── staff/               # Staff panel
│   └── profile/             # User profile
├── components/              # Reusable React components
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   └── cart/
├── lib/                     # Utility functions
│   ├── menu-data.ts         # All menu items
│   ├── image-mapping.ts     # Image paths
│   └── supabase.ts          # Database client
├── contexts/                # React contexts
│   └── AuthContext.tsx
├── public/                  # Static assets
│   └── images/              # 92 dish photos
├── middleware.ts            # Route protection
└── tailwind.config.js       # Styling configuration
```

---

## 🔐 Security Features

- **Row Level Security (RLS)** - Database-level access control
- **Protected Routes** - Admin and staff areas require authentication
- **Phone Number Validation** - Unique phone numbers per user
- **Auto-logout** - Sessions expire after inactivity
- **SQL Injection Protection** - Parameterized queries
- **XSS Protection** - Input sanitization

---

## 📱 Responsive Design

- ✅ Desktop (1920px+)
- ✅ Laptop (1024px - 1919px)
- ✅ Tablet (768px - 1023px)
- ✅ Mobile (320px - 767px)

---

## 🧪 Testing Checklist

Before deployment, verify:

- [ ] Order flow works (add to cart → checkout → place order)
- [ ] Auto-assignment assigns orders to staff
- [ ] Notifications appear for staff
- [ ] 15-minute cancellation window works
- [ ] Delivery fee calculator is accurate
- [ ] Restaurant hours restriction works (11 AM - 10 PM)
- [ ] Phone number validation prevents duplicates
- [ ] Search functionality works
- [ ] All 92 images load correctly
- [ ] Mobile responsiveness on real devices
- [ ] Admin panel accessible only to admins
- [ ] Staff panel accessible only to staff

---

## 🎯 Business Rules

### Restaurant Hours
- **Open:** 11:00 AM - 10:00 PM (Daily)
- **Orders:** Only accepted during business hours
- **Closed:** Orders cannot be placed when restaurant is closed

### Delivery
- **Base Delivery Fee:** ¥300
- **Calculated Based On:** Order subtotal
- **Delivery Times:** Estimated based on distance

### Cancellations
- **Window:** 15 minutes from order placement
- **After 15 Minutes:** Contact restaurant directly

### Order Assignment
- **Automatic:** Orders auto-assigned to available staff
- **Round Robin:** Fair distribution among staff members
- **Notifications:** Staff notified immediately via in-app notifications

---

## 🚀 Deployment

See `DEPLOYMENT-GUIDE.md` for detailed deployment instructions to Vercel.

**Quick Deploy:**
```bash
# Push to GitHub
git add .
git commit -m "Initial commit"
git push -u origin main

# Deploy to Vercel (through their dashboard)
# 1. Import GitHub repository
# 2. Add environment variables
# 3. Click Deploy
```

---

## 📞 Support

For issues or questions:
- Check `DEPLOYMENT-GUIDE.md` for troubleshooting
- Review `IMAGE-GUIDE.md` for image setup
- Check Supabase logs for database errors
- Review browser console for frontend errors

---

## 📄 Additional Documentation

- `DEPLOYMENT-GUIDE.md` - Complete deployment instructions
- `IMAGE-GUIDE.md` - How to add/optimize images
- `SETUP-GUIDE.md` - Initial setup instructions
- `IMPLEMENTATION-SUMMARY.md` - Feature implementation details
- `COMPLETE-IMPLEMENTATION-GUIDE.md` - Technical deep dive

---

## 🎨 Design Features

- **Color Scheme:** Green primary (#16a34a), Orange accent (#ea580c)
- **Typography:** Modern, readable fonts
- **Images:** 92 professional dish photos
- **Animations:** Smooth transitions and hover effects
- **Accessibility:** WCAG 2.1 compliant

---

## 📊 Database Schema

### Tables
- `users` - Customer and staff accounts
- `orders` - All customer orders
- `order_items` - Individual items in orders
- `menu_items` - All menu dishes (if using dynamic menu)
- `staff_assignments` - Order-to-staff mappings

### Key Features
- Auto-incrementing order numbers
- Timestamp tracking (created_at, updated_at)
- Foreign key relationships
- RLS policies for data protection

---

## 🔄 Future Enhancements (Optional)

- [ ] Email notifications for order confirmations
- [ ] SMS notifications for order status
- [ ] Online payment integration (Stripe, PayPal)
- [ ] Loyalty rewards program
- [ ] Customer reviews and ratings
- [ ] Multi-language support (full i18n)
- [ ] Table reservation system
- [ ] QR code for in-restaurant ordering

---

## 📝 License

This is a proprietary project for The Curry House Yokosuka. All rights reserved.

---

## 👨‍💻 Development

**Built with ❤️ for The Curry House Yokosuka**

**Status:** ✅ Ready for Client Review

**Version:** 1.0.0 (Draft)

---

## 🎉 What's Next?

1. **Deploy to Vercel** - Get a live demo link
2. **Share with Client** - Get feedback on features and design
3. **Iterate Based on Feedback** - Make requested modifications
4. **Launch to Production** - Go live with the final version!

---

**Thank you for choosing this platform for your restaurant! 🍛**
