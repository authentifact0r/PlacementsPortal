# Asset Placement Guide

## Required Assets

### 1. Hero Video
**Path:** `videos/hero-background.mp4`

**Quick Setup:**
```bash
# Download a free video from Pexels or Pixabay
# Example searches: "office", "business", "career", "workspace"
# Save as hero-background.mp4 in this directory
```

**Specifications:**
- Format: MP4 (H.264)
- Resolution: 1920x1080+
- Duration: 10-30 seconds
- Size: <5MB

### 2. Hero Poster (Fallback)
**Path:** `images/hero-poster.jpg`

Use a frame from your video or a related high-quality image.

### 3. Partner Logos
**Path:** `images/partners/`

Required files:
- buildtech.png
- techcore.png
- infrastructure-uk.png
- consultplus.png
- engineering-first.png
- digital-dynamics.png
- project-masters.png
- tech-innovate.png

**Note:** If missing, text fallbacks will display automatically.

### 4. Testimonial Images (Optional)
**Path:** `images/testimonials/`

Files:
- sarah.jpg
- michael.jpg
- priya.jpg
- james.jpg

**Note:** If missing, auto-generated avatars will be used.

## Quick Start

1. Place your hero video in `videos/`
2. Add partner logos to `images/partners/`
3. (Optional) Add testimonial photos to `images/testimonials/`
4. Refresh your browser - assets will load automatically!

## Where to Find Free Assets

**Videos:**
- https://www.pexels.com/videos/
- https://pixabay.com/videos/
- https://coverr.co/

**Images:**
- https://unsplash.com/
- https://www.pexels.com/
- https://pixabay.com/

**Logo Creation:**
- https://www.canva.com/
- https://logomakr.com/
- https://www.figma.com/

---

**Current Structure:**
```
assets/
├── videos/
│   └── hero-background.mp4 (ADD THIS)
└── images/
    ├── hero-poster.jpg (ADD THIS)
    ├── partners/ (ADD LOGOS HERE)
    │   ├── buildtech.png
    │   ├── techcore.png
    │   ├── infrastructure-uk.png
    │   ├── consultplus.png
    │   ├── engineering-first.png
    │   ├── digital-dynamics.png
    │   ├── project-masters.png
    │   └── tech-innovate.png
    └── testimonials/ (OPTIONAL)
        ├── sarah.jpg
        ├── michael.jpg
        ├── priya.jpg
        └── james.jpg
```
