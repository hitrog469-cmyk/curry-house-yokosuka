# Implementation Progress: Auto-Offers & Today's Special

## Completed ✅

### 1. Database Schema
- ✅ Created `daily_specials` table with RLS policies
- ✅ Added offer tracking columns to `table_orders` and `orders`
- ✅ Seeded default Chef's Special (Butter Chicken)

### 2. Offer Engine
- ✅ Built comprehensive offer detection system (`lib/offer-engine.ts`)
- ✅ Time-based eligibility checking
- ✅ Support for 4 offer types: percentage, fixed_amount, BOGO, bundle
- ✅ Automatic discount calculation
- ✅ Offer combination logic

### 3. Offer Data
- ✅ Rewrote offer definitions with proper structure
- ✅ Removed all "@" placeholder terms
- ✅ Added customer-friendly descriptions and restrictions
- ✅ Backwards compatibility with existing offer pages

### 4. Daily Special API
- ✅ CRUD functions for managing specials
- ✅ Get today's special
- ✅ Create/update/deactivate/delete operations
- ✅ Time validity checking

## In Progress 🚧

### 5. Table Ordering - Auto Offers
Need to integrate offer engine into table ordering page:
- Detect offers on cart change
- Display applicable offers with toggle
- Show savings breakdown
- Apply discounts to total

### 6. Table Ordering - Item-Based Bill Splitting
Need to redesign split system:
- Change cart to array structure with `assignedTo` field
- Build item assignment modal
- Calculate per-person totals based on assigned items
- Support shared items (split cost equally)

## Pending ⏳

### 7. Admin UI - Today's Special
- Add special management tab to admin dashboard
- Form to set new special
- Display current special
- Enable/disable functionality

### 8. Homepage - Today's Special
- Add hero section after announcement banner
- Fetch special on load
- Display with pricing and discount
- Order Now button with auto-add to cart

## Next Steps

1. **Integrate offer detection into `/app/table-order/page.tsx`**
   - Add `useEffect` to detect offers when cart changes
   - Display detected offers above cart total
   - Add toggle to accept/decline offers
   - Update total calculation to apply discounts

2. **Redesign bill splitting in `/app/table-order/page.tsx`**
   - Change cart state from object to array
   - Add `assignedTo` field to cart items
   - Build assignment modal UI
   - Update split calculation logic
   - Update order submission to include `split_items`

3. **Add admin special management UI**
   - Create new tab in admin dashboard
   - Form for setting special
   - List of current/past specials

4. **Add homepage Today's Special section**
   - Fetch special on page load
   - Display prominently
   - Link to table ordering with auto-add

## Files Created
- `/supabase/migrations/20260202_add_daily_specials.sql`
- `/supabase/migrations/20260202_enhance_orders_with_offers.sql`
- `/lib/offer-engine.ts`
- `/lib/daily-special-api.ts`

## Files Modified
- `/lib/offers-data.ts` - Added OfferRule structure, proper descriptions

## Estimated Time Remaining
- Table Ordering Updates: 1-1.5 hours
- Admin UI: 30-40 minutes
- Homepage: 20-30 minutes
- Testing: 20-30 minutes
**Total: ~2.5-3 hours**
