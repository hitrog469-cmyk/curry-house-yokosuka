# 📸 Image Guide - Get Professional Photos for Your Restaurant Website

## 🎯 Images You Need (FREE Sources)

### Best Free Stock Photo Websites:
1. **Unsplash** - https://unsplash.com ⭐ BEST QUALITY
2. **Pexels** - https://pexels.com ⭐ GREAT FOR FOOD
3. **Pixabay** - https://pixabay.com

All are **100% free** for commercial use, no attribution required!

---

## 📋 Exact Images to Download

### 1. Hero/Homepage Image (1 image)
**Search**: "indian curry food overhead" or "butter chicken close up"
- Size: Landscape, 1920x1080px minimum
- Use for: Homepage hero section
- Save as: `hero-curry.jpg`

**Recommended Unsplash Photos:**
- https://unsplash.com/s/photos/butter-chicken
- https://unsplash.com/s/photos/indian-curry-food

---

### 2. Menu Item Photos (8-10 images)

Download these specific searches:

#### Curries & Main Dishes:
1. **"butter chicken"** → Save as `butter-chicken.jpg`
2. **"chicken tikka masala"** → Save as `chicken-tikka.jpg`
3. **"paneer makhani"** → Save as `paneer-makhani.jpg`
4. **"mutton curry"** → Save as `mutton-curry.jpg`
5. **"biryani rice"** → Save as `biryani.jpg`

#### Sides & Appetizers:
6. **"naan bread"** → Save as `naan.jpg`
7. **"samosa"** → Save as `samosa.jpg`
8. **"tandoori chicken"** → Save as `tandoori.jpg`

#### Vegetarian:
9. **"dal curry"** → Save as `dal.jpg`
10. **"vegetable curry"** → Save as `veg-curry.jpg`

**Image Specs:**
- Size: 800x800px (square) or 800x600px (landscape)
- Format: JPG
- Quality: High

---

### 3. Background/Texture Images (2-3 images)

1. **"indian spices background"** → Save as `spices-bg.jpg`
   - Use for: Section backgrounds, overlays

2. **"restaurant interior modern"** → Save as `restaurant-interior.jpg`
   - Use for: About page

3. **"cooking food steam"** → Save as `cooking-action.jpg`
   - Use for: Careers page

---

## 📁 Where to Save Images

Create this folder structure:

```
D:\curry-house-yokosuka\
└── public\
    └── images\
        ├── hero\
        │   └── hero-curry.jpg
        ├── menu\
        │   ├── butter-chicken.jpg
        │   ├── chicken-tikka.jpg
        │   ├── paneer-makhani.jpg
        │   ├── mutton-curry.jpg
        │   ├── biryani.jpg
        │   ├── naan.jpg
        │   ├── samosa.jpg
        │   ├── tandoori.jpg
        │   ├── dal.jpg
        │   └── veg-curry.jpg
        └── backgrounds\
            ├── spices-bg.jpg
            ├── restaurant-interior.jpg
            └── cooking-action.jpg
```

---

## 🔧 How to Add Images to Your Site

### Step 1: Create the folders

```bash
# In your project root
mkdir public\images
mkdir public\images\hero
mkdir public\images\menu
mkdir public\images\backgrounds
```

### Step 2: Download & Save Images
1. Go to Unsplash/Pexels
2. Search for the term (e.g., "butter chicken")
3. Download the FREE image (Large size)
4. Rename to match the guide above
5. Move to appropriate folder

### Step 3: Optimize Images (Optional but Recommended)

Use **TinyPNG** (https://tinypng.com) to compress:
- Drag and drop your images
- Download compressed versions
- Replace original files

This makes your site load FASTER!

---

## 🎨 How to Use Images in Code

### Homepage Hero:

```typescript
// app/page.tsx
<div className="relative h-5">
  <Image
    src="/images/hero/hero-curry.jpg"
    alt="Delicious Indian Curry"
    fill
    className="object-cover"
    priority
  />
</div>
```

### Menu Items:

```typescript
// app/menu/page.tsx
<Image
  src="/images/menu/butter-chicken.jpg"
  alt="Butter Chicken"
  width={500}
  height={500}
  className="rounded-lg"
/>
```

---

## 📸 Recommended Unsplash Collections

### For Indian Food:
- https://unsplash.com/collections/1538384/indian-food
- https://unsplash.com/collections/9638721/curry

### For Restaurant Vibes:
- https://unsplash.com/collections/1142427/restaurant
- https://unsplash.com/collections/4392815/food-photography

---

## 🎯 Quick Action Plan

### 5-Minute Setup:
1. Open Unsplash.com
2. Search "butter chicken" → Download 1 image
3. Search "naan bread" → Download 1 image
4. Search "indian curry" → Download 3 images
5. Create folders in `public/images/menu/`
6. Save all 5 images there

### 15-Minute Setup:
- Download all 10 menu items
- Download 1 hero image
- Download 2 background images
- Organize into folders
- Run through TinyPNG

### 30-Minute Premium Setup:
- Download 15-20 varied food photos
- Download lifestyle/restaurant images
- Create themed collections
- Optimize all images
- Add alt text for SEO

---

## 🌟 Pro Tips

### Image Best Practices:
1. **Consistent Style** - Pick photos with similar lighting/color tone
2. **High Quality** - Always download "Large" size from Unsplash
3. **Optimize** - Compress before uploading
4. **Alt Text** - Always add descriptive alt text for SEO
5. **Lazy Loading** - Use Next.js Image component for auto-optimization

### Color Matching:
Your brand colors are:
- Primary Green: `#16a34a`
- Accent Orange: `#ea580c`

Choose images with warm tones (oranges, reds, yellows) to match!

---

## 🚀 Advanced: AI-Generated Images (Optional)

If you can't find perfect photos, use AI:

### Free AI Image Generators:
1. **Leonardo.ai** - https://leonardo.ai (150 free/day)
2. **Bing Image Creator** - https://bing.com/create (Free)

**Prompts to Try:**
```
"Professional food photography of butter chicken curry in a bowl,
overhead view, restaurant quality, warm lighting, appetizing,
high resolution, Canon 5D"

"Indian naan bread on a wooden board, close-up, professional
food photography, warm tones, studio lighting"
```

---

## ✅ Checklist

Before launch, make sure you have:
- [ ] 1 hero image for homepage
- [ ] 8-10 menu item photos
- [ ] 2-3 background/texture images
- [ ] All images compressed (under 500KB each)
- [ ] All images in correct folders
- [ ] All images have descriptive alt text
- [ ] Images display correctly on mobile

---

## 🎨 Example Sites for Inspiration

Check these for food photography style:
- https://www.jollibee.com
- https://www.chipotle.com
- https://www.shakeshack.com

Notice their:
- Consistent color grading
- Professional lighting
- Appetizing composition
- Clean backgrounds

---

**Your website is 90% ready! Just add images and you'll have a stunning, professional restaurant site! 🎉**
