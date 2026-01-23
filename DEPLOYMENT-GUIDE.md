# 🚀 Deployment Guide - The Curry House Yokosuka

## Quick Deployment Steps

### 1. Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Complete restaurant website with all features"

# Create GitHub repository (do this on github.com first)
# Then connect and push:
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/curry-house-yokosuka.git
git push -u origin main
```

### 2. Deploy to Vercel (Recommended - FREE)

**Why Vercel:**
- ✅ FREE hosting for Next.js
- ✅ Automatic deployments from GitHub
- ✅ Global CDN for fast loading
- ✅ Perfect for Next.js apps
- ✅ Custom domain support

**Steps:**

1. **Go to** [vercel.com](https://vercel.com)
2. **Sign up** with your GitHub account
3. **Import your repository**
   - Click "Add New Project"
   - Select `curry-house-yokosuka`
4. **Configure Environment Variables:**
   - Add these in Vercel dashboard:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
     NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key (optional)
     ```
5. **Click "Deploy"**
6. **Done!** Your site will be live at `https://curry-house-yokosuka.vercel.app`

### 3. Custom Domain (Optional)

1. In Vercel dashboard, go to Settings → Domains
2. Add your custom domain (e.g., `curryhouse-yokosuka.com`)
3. Follow DNS configuration instructions
4. Wait for SSL certificate (automatic)

---

## Alternative: Deploy to Netlify

1. Go to [netlify.com](https://netlify.com)
2. Connect GitHub repository
3. Build command: `npm run build`
4. Publish directory: `.next`
5. Add environment variables
6. Deploy!

---

## Post-Deployment Checklist

### ✅ Database Setup
- [ ] Run all SQL migrations in Supabase:
  - `AUTO-ASSIGN-STAFF.sql`
  - `CANCELLATION-WINDOW.sql`
  - `PHONE-VALIDATION.sql`
- [ ] Verify RLS policies are active
- [ ] Test admin account login

### ✅ Testing
- [ ] Test order flow (add to cart → checkout → place order)
- [ ] Test auto-assignment to staff
- [ ] Test notifications (order assignments)
- [ ] Test 15-minute cancellation window
- [ ] Test delivery fee calculator
- [ ] Test restaurant hours restriction
- [ ] Test phone number validation
- [ ] Test search functionality
- [ ] Test on mobile devices
- [ ] Test all images load correctly

### ✅ Security
- [ ] Verify environment variables are set
- [ ] Check RLS policies prevent unauthorized access
- [ ] Test admin-only routes are protected
- [ ] Verify staff notifications work
- [ ] Test phone number uniqueness

### ✅ Performance
- [ ] Run Lighthouse audit (aim for 90+ score)
- [ ] Test page load speed
- [ ] Verify images are optimized
- [ ] Check mobile responsiveness

---

## Environment Variables Required

```env
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Google Maps (OPTIONAL - for address autocomplete)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key
```

---

## Client Demo Link

Once deployed, share this with your client:

**Live Website:** `https://your-app.vercel.app`

**Admin Panel:** `https://your-app.vercel.app/admin`
- Login with admin credentials

**Test Ordering:**
1. Browse menu: `https://your-app.vercel.app/menu`
2. Add items to cart
3. Complete checkout

---

## Troubleshooting

### Images Not Loading
- Make sure all images are in `public/images/` folder
- Check image paths in `lib/image-mapping.ts`
- Verify images were pushed to GitHub

### Database Errors
- Verify environment variables are set in Vercel
- Check Supabase SQL migrations were run
- Verify RLS policies allow operations

### Build Failures
```bash
# Test build locally first:
npm run build

# If successful, commit and push:
git add .
git commit -m "Fix: Build issues"
git push
```

---

## Support

For issues during deployment:
1. Check Vercel deployment logs
2. Review browser console for errors
3. Verify all environment variables
4. Check Supabase logs

---

**Ready to go live! 🎉**
