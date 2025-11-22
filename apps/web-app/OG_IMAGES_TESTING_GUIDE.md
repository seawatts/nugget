# OG Images and PWA Icons Testing Guide

This guide provides instructions for testing the newly implemented Nugget-branded OG images and PWA icons.

## What Was Implemented

### 1. OG Images with Nugget Branding
All OpenGraph images now feature the distinctive chicken nugget avatar styling:
- **Golden amber background** (#FBBF24)
- **Brown text** (#78350F)
- **Wavy shell pattern** at the bottom (like chicken nugget breading)
- **Consistent branding** across all pages

### 2. OG Images Created

#### Root Level
- `/opengraph-image.tsx` - Default fallback for the entire app

#### App Section
- `/app/opengraph-image.tsx` - For the main app area
- `/app/baby/[babyId]/opengraph-image.tsx` - For individual baby profiles

#### Marketing/Blog
- `/blog/[slug]/opengraph-image.tsx` - For blog posts

#### Sharing
- `/share/celebration/[celebrationId]/opengraph-image.tsx` - Updated with nugget styling

### 3. PWA Icons
Generated new app icons with nugget styling:
- `android-chrome-512x512.png`
- `android-chrome-192x192.png`
- `apple-touch-icon.png` (180x180)
- `favicon-32x32.png`
- `favicon-16x16.png`
- `favicon.ico`

All icons feature:
- Golden amber circular background
- White "N" letter mark
- Wavy shell pattern (on larger sizes)

### 4. Manifest and Theme Updates
- Updated `manifest.ts` with amber theme color (#FBBF24)
- Updated `layout.tsx` viewport theme color for light mode
- All icon paths verified

## Testing Checklist

### Local Development Testing

1. **Start the development server:**
   ```bash
   cd apps/web-app
   bun run dev
   ```

2. **Test OG image routes directly:**
   - http://localhost:3000/opengraph-image (default)
   - http://localhost:3000/app/opengraph-image (app area)
   - http://localhost:3000/blog/[slug]/opengraph-image (replace [slug] with actual blog post)
   - http://localhost:3000/share/celebration/[id]/opengraph-image (replace [id] with celebration)

3. **Verify icons:**
   - Check `/public` folder contains all new icon files
   - Visit http://localhost:3000/favicon.ico
   - Visit http://localhost:3000/apple-touch-icon.png
   - Inspect the icons visually for correct styling

### OG Image Validation Tools

Use these online tools to validate your OG images once deployed:

1. **Meta Tags Validator**
   - URL: https://metatags.io/
   - Enter your page URL
   - Check preview on Facebook, Twitter, LinkedIn, Slack, etc.

2. **Twitter Card Validator**
   - URL: https://cards-dev.twitter.com/validator
   - Enter your page URL
   - Verify card preview

3. **Facebook Sharing Debugger**
   - URL: https://developers.facebook.com/tools/debug/
   - Enter your page URL
   - Check preview and scrape fresh data if needed

4. **LinkedIn Post Inspector**
   - URL: https://www.linkedin.com/post-inspector/
   - Enter your page URL
   - Check preview

5. **Discord**
   - Share a link in a test Discord server
   - Verify the embed preview appears correctly

### PWA Installation Testing

#### Android
1. Open the web app in Chrome
2. Look for "Add to Home Screen" prompt
3. Install the PWA
4. Check icon on home screen
5. Launch app and verify:
   - Icon appears correctly in app drawer
   - Theme color shows amber in status bar
   - Splash screen displays correctly

#### iOS
1. Open the web app in Safari
2. Tap Share > "Add to Home Screen"
3. Verify icon preview
4. Add to home screen
5. Launch app and check:
   - Icon displays correctly
   - Status bar color is amber
   - App opens as standalone

#### Desktop (Chrome/Edge)
1. Open the web app in Chrome/Edge
2. Click install button in address bar
3. Verify icon in installation dialog
4. Install and check:
   - App icon in system/taskbar
   - Window icon is correct

### Visual Inspection Checklist

For each OG image, verify:
- [ ] Background is golden amber (#FBBF24)
- [ ] Text is brown (#78350F)
- [ ] Wavy shell pattern appears at bottom
- [ ] Text is readable and not cut off
- [ ] Images/avatars display correctly (if present)
- [ ] Footer branding is visible
- [ ] Overall composition looks balanced

For each icon, verify:
- [ ] Circular shape is clean
- [ ] Amber background color is correct
- [ ] "N" letter is centered and readable
- [ ] Wavy shell pattern visible on large sizes
- [ ] No distortion or pixelation

### Browser Testing

Test in multiple browsers:
- [ ] Chrome (desktop & mobile)
- [ ] Safari (desktop & iOS)
- [ ] Firefox (desktop & mobile)
- [ ] Edge (desktop)

### Social Media Share Testing

Actually share links to test pages:
1. Share a celebration link on Facebook
2. Share a baby profile link on Twitter
3. Share a blog post on LinkedIn
4. Share an app link in Discord/Slack

Verify each platform shows:
- Correct image
- Correct title
- Correct description
- Nugget branding is visible

## Regenerating Icons

If you need to modify the icon design:

1. Edit the script:
   ```bash
   apps/web-app/scripts/generate-icons.ts
   ```

2. Modify colors, sizes, or SVG path as needed

3. Regenerate:
   ```bash
   cd apps/web-app
   bun run generate:icons
   ```

4. Test the new icons

## Common Issues and Solutions

### OG Image Not Updating
- **Issue:** Social platforms cache OG images aggressively
- **Solution:** Use the platform's debugger tool to force a refresh
  - Facebook: Use Sharing Debugger and click "Scrape Again"
  - Twitter: Clear cache in Card Validator
  - LinkedIn: Use Post Inspector

### Icon Not Showing
- **Issue:** Browser caching old favicon
- **Solution:**
  - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
  - Clear browser cache
  - Use incognito/private browsing

### Wrong Colors
- **Issue:** Theme colors not matching
- **Solution:** Verify manifest.ts and layout.tsx have correct hex values

### PWA Not Installing
- **Issue:** HTTPS required for PWA
- **Solution:** Test on deployed environment (not localhost)

## Next Steps

After testing, you may want to:

1. **Customize OG images** for specific pages
2. **Add more variations** (e.g., milestone-specific celebrations)
3. **Generate icon variants** for dark mode
4. **Add og:image:alt** text to metadata for accessibility
5. **Monitor social media** shares for quality

## Resources

- [Next.js OG Image Generation](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)

