# PWA Icons

## Required Icons

You need to generate the following icons for your PWA:

1. **favicon.ico** - 16x16, 32x32, 48x48 (multi-resolution)
2. **pwa-64x64.png** - 64x64px
3. **pwa-192x192.png** - 192x192px
4. **pwa-512x512.png** - 512x512px
5. **maskable-icon-512x512.png** - 512x512px (with safe zone)
6. **apple-touch-icon.png** - 180x180px

## How to Generate Icons

### Option 1: Using PWA Asset Generator (Recommended)

```bash
# Install globally
npm install -g pwa-asset-generator

# Generate from your logo (SVG or PNG)
pwa-asset-generator your-logo.svg public \
  --icon-only \
  --favicon \
  --type png \
  --maskable
```

### Option 2: Using Online Tools

1. **Favicon Generator**: https://realfavicongenerator.net/
2. **PWA Builder**: https://www.pwabuilder.com/imageGenerator
3. **Maskable Icon Editor**: https://maskable.app/editor

### Option 3: Manual Creation

Create a 1024x1024px icon in your design tool and export at different sizes.

**Maskable Icon Requirements:**
- Minimum safe zone: 40% margin on all sides
- Icon should work when cropped to a circle
- Test at https://maskable.app

## Brand Colors

- **Theme Color**: #FF4B00 (Strava Orange)
- **Background**: #FFFFFF (White)

## Placeholder Icons

Temporary placeholder icons are included for development. **Replace these before deploying to production!**
