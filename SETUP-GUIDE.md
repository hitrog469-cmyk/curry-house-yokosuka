# The Curry House Yokosuka - Complete Setup Guide

## 🎉 What's Been Completed

### ✅ Core Features
1. **Authentication System** - Supabase Auth with profile management
2. **Menu System** - Full menu with categories, search, filtering
3. **Order System** - Cart, checkout, order tracking
4. **Admin Dashboard** - Order management, stats, staff assignment
5. **Staff Portal** - Order processing interface
6. **User Profiles** - Profile editing with role management
7. **My Orders** - Personal order history for logged-in users
8. **Track Orders** - Public order tracking by phone number

### ✅ Pages Created
- **Homepage** (`/`) - Professional hero, features, popular dishes
- **Menu** (`/menu`) - Full menu with search, filters, cart
- **About** (`/about`) - Company story, values, timeline
- **Contact** (`/contact`) - Contact form, info cards, hours
- **Careers** (`/careers`) - Job listings, application form
- **Profile** (`/profile`) - User profile management
- **My Orders** (`/my-orders`) - Personal order history
- **Admin Dashboard** (`/admin`) - Full admin panel
- **Staff Portal** (`/staff`) - Staff order management
- **Track Orders** (`/track`) - Public order tracking

### ✅ Features Implemented
- 🛒 **Shopping Cart** - Persistent localStorage cart with quantity controls
- 🔍 **Search & Filter** - Smart menu search with autocomplete
- 📱 **Fully Responsive** - Mobile-first design
- 🌙 **Dark Mode** - Full dark mode support
- 🎨 **Professional Design** - Modern, polished UI
- 🔐 **Role-Based Access** - Customer, Staff, Admin roles
- 📊 **Stats Dashboard** - Order stats and revenue tracking
- 🚀 **Performance** - Optimized for speed

---

## 🚀 Quick Start Guide

### Step 1: Run the RLS Fix in Supabase

1. Open Supabase Dashboard: https://vhufyubdpsvkdbjpqetb.supabase.co
2. Go to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the ENTIRE contents of `SIMPLE-RLS-FIX.sql`
5. Paste and click **Run** (or Ctrl+Enter)
6. Wait for success message: "✅ RLS FIXED - NO MORE RECURSION!"

### Step 2: Start Your Development Server

```bash
npm run dev
```

Your app will be at: http://localhost:3000

### Step 3: Test Everything

1. **Test Menu**
   - Go to `/menu`
   - Search for items
   - Add items to cart
   - Quantity should be VERY visible now!

2. **Test Registration & Login**
   - Go to `/auth/register`
   - Create an account
   - Login at `/auth/login`
   - Check `/profile` works

3. **Test Ordering**
   - Add items to cart from menu
   - Go to cart (click floating cart button)
   - Fill in delivery details
   - Place order
   - Check `/my-orders` to see your order

4. **Test Admin** (if you're admin)
   - Go to `/admin`
   - View all orders
   - Update order status
   - Assign staff

---

## 📋 Database Schema

### Tables
- **profiles** - User profiles linked to Supabase Auth
- **menu_items** - Restaurant menu items
- **orders** - Customer orders
- **users** - Legacy table (not actively used)

### Key Fields in `orders` table:
- `user_id` - Links to authenticated user (NULL for guest orders)
- `customer_name`, `customer_phone` - Guest checkout info
- `items` - JSONB array of order items
- `status` - pending, preparing, out_for_delivery, delivered, cancelled
- `total_amount` - Order total in yen

---

## 🎨 Design System

### Colors
- **Primary Green**: `from-green-600 to-green-700`
- **Accent Orange**: `from-orange-600 to-red-600`
- **Purple/Pink**: `from-purple-600 to-pink-600` (Careers)

### Typography
- **Headers**: Font-black, large sizes
- **Body**: Regular weight, good line-height
- **Accents**: Bold/semibold for emphasis

### Components
- **Cards**: Rounded-2xl/3xl with shadows
- **Buttons**: Gradient backgrounds with hover effects
- **Inputs**: Rounded-xl with focus rings

---

## 🔧 Common Tasks

### Make a User Admin

Run this in Supabase SQL Editor:

```sql
-- Replace 'user@example.com' with actual email
UPDATE profiles
SET role = 'admin'
WHERE email = 'user@example.com';
```

### Add Menu Items

```sql
INSERT INTO menu_items (name_en, name_jp, price, category, is_recommended, spice_level)
VALUES ('New Dish', 'ニュードッシュ', 1200, 'chicken_curry', true, 'medium');
```

### Check Order Status

```sql
SELECT id, customer_name, status, total_amount, created_at
FROM orders
ORDER BY created_at DESC
LIMIT 10;
```

---

## 📱 Mobile Responsive Features

All pages are fully responsive with:
- ✅ Mobile-first design
- ✅ Touch-friendly buttons (min 44px)
- ✅ Readable text sizes
- ✅ Proper spacing on small screens
- ✅ Hamburger menus where needed
- ✅ Stack layouts on mobile

---

## 🐛 Troubleshooting

### Issue: "Profile fetch error: infinite recursion"
**Solution**: Run `SIMPLE-RLS-FIX.sql` in Supabase SQL Editor

### Issue: Can't place orders
**Solution**:
1. Make sure you ran the RLS fix
2. Check browser console for errors
3. Verify `user_id` column exists in orders table

### Issue: Quantity not visible
**Solution**: Already fixed! Quantity now shows in large, bold text with "in cart" label

### Issue: Can't access admin dashboard
**Solution**:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'YOUR_EMAIL';
```

### Issue: Orders not showing in My Orders
**Solution**: Make sure orders have `user_id` set when placing them (already implemented)

---

## 🎯 Next Steps (Optional Enhancements)

### Recommended Improvements
1. **Email Notifications** - Send order confirmations
2. **Real-time Updates** - Use Supabase realtime for live order updates
3. **Payment Integration** - Add Stripe/PayPal
4. **Image Upload** - Let admin upload menu item photos
5. **Reviews & Ratings** - Customer feedback system
6. **Promotions** - Discount codes and special offers
7. **Analytics** - Google Analytics integration
8. **SEO** - Meta tags, sitemap, robots.txt

### Performance Optimizations
1. **Image Optimization** - Use Next.js Image component
2. **Code Splitting** - Lazy load heavy components
3. **Caching** - Implement SWR or React Query
4. **CDN** - Use Vercel Edge Network

---

## 📚 File Structure

```
D:\curry-house-yokosuka\
├── app/
│   ├── about/          # About us page
│   ├── admin/          # Admin dashboard
│   ├── auth/           # Auth pages (login, register, etc)
│   ├── careers/        # Careers/Jobs page
│   ├── contact/        # Contact us page
│   ├── menu/           # Menu browsing
│   ├── my-orders/      # User's order history
│   ├── order/          # Cart & checkout
│   ├── profile/        # User profile
│   ├── staff/          # Staff portal
│   └── track/          # Public order tracking
├── components/
│   ├── Navbar.tsx      # Main navigation
│   ├── Footer.tsx      # Footer component
│   └── protected-route.tsx  # Auth guard
├── contexts/
│   └── auth-context.tsx  # Auth state management
├── lib/
│   ├── supabase.ts     # Supabase client
│   └── utils.ts        # Utility functions
├── SIMPLE-RLS-FIX.sql  # **RUN THIS FIRST!**
└── SETUP-GUIDE.md      # This file

```

---

## ✨ Features Highlights

### For Customers
- Browse menu with search & filters
- Add items to cart with visible quantity
- Guest checkout OR login for order history
- Track orders by phone number
- View personal order history when logged in
- Update profile information

### For Staff
- View all pending orders
- Update order status
- View customer details
- Assign orders to themselves

### For Admins
- Everything staff can do, plus:
- View revenue stats
- Manage all orders
- Assign orders to staff
- View all user profiles
- Access full dashboard

---

## 🔐 Security Features

- ✅ Row Level Security (RLS) enabled
- ✅ Role-based access control
- ✅ Secure password hashing (Supabase)
- ✅ Protected routes
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ CSRF protection (Next.js)

---

## 🎉 You're All Set!

Your restaurant website is now professional, feature-complete, and ready to use!

### Quick Actions:
1. ✅ Run `SIMPLE-RLS-FIX.sql` in Supabase
2. ✅ Run `npm run dev`
3. ✅ Test menu, cart, and ordering
4. ✅ Make yourself admin
5. ✅ Explore all features

**Need help?** Check the troubleshooting section above or review the code comments.

---

**Built with ❤️ using Next.js 14, Supabase, and Tailwind CSS**
