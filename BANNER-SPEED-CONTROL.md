# 🎚️ Banner Speed Control Guide
## The Curry House Yokosuka

---

## How to Change Announcement Banner Speed

The scrolling announcements banner speed can be easily controlled through CSS.

### Current Speed:
**45 seconds** (slower, easier to read)

### Where to Change:

**File:** `app/globals.css`
**Line:** ~730-732

```css
.animate-scroll-slow {
  animation: scroll 45s linear infinite;
}
```

### Speed Options:

| Speed | Duration | Best For |
|-------|----------|----------|
| Very Fast | `20s` | Urgent announcements, short text |
| Fast | `30s` | Quick promotions |
| **Current (Slow)** | `45s` | **Easy reading, recommended** |
| Very Slow | `60s` | Long messages, detailed info |

### How to Change:

1. Open `app/globals.css`
2. Find line ~731: `animation: scroll 45s linear infinite;`
3. Change `45s` to your preferred duration
4. Save the file
5. The banner will automatically update

### Example - Make it Faster:
```css
.animate-scroll-slow {
  animation: scroll 30s linear infinite;  /* Changed from 45s to 30s */
}
```

### Example - Make it Slower:
```css
.animate-scroll-slow {
  animation: scroll 60s linear infinite;  /* Changed from 45s to 60s */
}
```

---

## Banner Content Customization

### Where to Edit Announcements:

**File:** `app/page.tsx`
**Line:** ~77-96

Current announcements:
```tsx
🎉 2026 Special - Order Now!
⭐ FREE DELIVERY on all orders!
🍛 Authentic Indian, Mexican, Japanese & Nepalese Cuisine!
```

### How to Change Announcements:

1. Open `app/page.tsx`
2. Find the `.animate-scroll-slow` div around line 78
3. Edit the `<span>` elements with your messages
4. Keep the format: `<span className="inline-block px-4 mx-8">`

### Example - Add New Announcement:
```tsx
<span className="inline-block px-4 mx-8">
  🎊 NEW: Weekend Brunch Menu Available!
</span>
```

### Tips for Good Announcements:
- ✅ Keep them short (under 60 characters)
- ✅ Use emojis for visual appeal
- ✅ Highlight key benefits (FREE, NEW, SPECIAL)
- ✅ Repeat important ones twice in the loop
- ❌ Avoid specific discounts without approval
- ❌ Don't make them too long

---

## Banner Click Behavior

The announcements banner is **clickable** and takes users directly to the **Menu page**.

### To Change Where It Links:

**File:** `app/page.tsx`
**Line:** ~76

```tsx
<Link href="/menu" className="block">
```

Change `/menu` to any page you want:
- `/catering` - Catering page
- `/contact` - Contact page
- `/gallery` - Gallery page
- etc.

---

## Mobile Responsiveness

The banner is fully responsive:
- **Desktop:** Full text visible, smooth scroll
- **Mobile:** Smaller padding, touch-friendly
- **Hover:** Pauses scrolling (desktop only)

### Mobile-Specific Adjustments:

If text is too long on mobile, you can add responsive classes:

```tsx
<span className="inline-block px-2 md:px-4 mx-4 md:mx-8">
  Your announcement here
</span>
```

This reduces padding on mobile while keeping desktop styling.

---

## Troubleshooting

### Banner Not Scrolling?
- Check that CSS class is `.animate-scroll-slow`
- Verify `app/globals.css` has the animation defined
- Clear browser cache

### Banner Too Fast/Slow?
- Adjust the `45s` value in `globals.css`
- Lower number = faster
- Higher number = slower

### Banner Not Clickable?
- Make sure it's wrapped in `<Link href="/menu">`
- Check that the entire div is inside the Link component

---

## Quick Reference

| What to Change | File | Line |
|----------------|------|------|
| Speed | `app/globals.css` | ~731 |
| Announcements | `app/page.tsx` | ~77-96 |
| Click Link | `app/page.tsx` | ~76 |
| Hover Color | `app/page.tsx` | ~77 |

---

*Last Updated: January 25, 2026*
*Current Speed: 45 seconds*
