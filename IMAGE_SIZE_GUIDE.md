# Image Size Adjustment Guide

## Quick Reference - Where to Change Image Sizes

### Table Ordering Page (`/app/table-order/page.tsx`)

**Current Size:** `w-24 h-24 sm:w-28 sm:h-28` (Mobile: 96px, Desktop: 112px)

**Line 495:** Menu item images
```tsx
<div className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
```

**To Make LARGER:**
```tsx
// Small increase
<div className="relative w-28 h-28 sm:w-32 sm:h-32 ...">

// Medium increase
<div className="relative w-32 h-32 sm:w-36 sm:h-36 ...">

// Large increase
<div className="relative w-36 h-36 sm:w-40 sm:h-40 ...">
```

**To Make SMALLER:**
```tsx
// Smaller
<div className="relative w-20 h-20 sm:w-24 sm:h-24 ...">
```

---

### Menu Page (`/app/menu/page.tsx`)

Search for: `relative h-72 overflow-hidden`

**Current:** `h-72` (288px height)

**Adjust:**
- `h-64` = 256px (smaller)
- `h-80` = 320px (larger)
- `h-96` = 384px (very large)

---

### Homepage Popular Dishes (`/app/page.tsx`)

Search for: `relative h-72 overflow-hidden`

Same as menu page - adjust `h-72` to your preferred size.

---

## Tailwind Size Reference

```
w-16 h-16 = 64px
w-20 h-20 = 80px
w-24 h-24 = 96px     ← Current mobile (table ordering)
w-28 h-28 = 112px    ← Current desktop (table ordering)
w-32 h-32 = 128px
w-36 h-36 = 144px
w-40 h-40 = 160px
w-48 h-48 = 192px
w-56 h-56 = 224px
w-64 h-64 = 256px
```

## Height Only (for card images)

```
h-48 = 192px
h-56 = 224px
h-64 = 256px
h-72 = 288px  ← Current
h-80 = 320px
h-96 = 384px
```

---

## Quick Tips

1. **Keep responsive**: Always use both mobile and desktop sizes
   - Format: `w-[mobile] h-[mobile] sm:w-[desktop] sm:h-[desktop]`
   - Example: `w-24 h-24 sm:w-32 sm:h-32`

2. **Image quality**: Using `object-cover` crops images to fill space
   - Zooms in nicely
   - No blank space
   - Centers the image

3. **Test on mobile first**: Since mobile is primary interface

4. **Rebuild after changes**: Run `npm run build` to see changes

---

## Example Changes

### Make Table Order Images Bigger:
File: `app/table-order/page.tsx` Line 495
```tsx
// FROM:
<div className="relative w-24 h-24 sm:w-28 sm:h-28 ...">

// TO:
<div className="relative w-32 h-32 sm:w-40 sm:h-40 ...">
```

### Make Homepage Cards Taller:
File: `app/page.tsx` Search: `h-72`
```tsx
// FROM:
<div className="relative h-72 overflow-hidden">

// TO:
<div className="relative h-96 overflow-hidden">
```

---

That's it! Change any of these values and rebuild to see the effect.
