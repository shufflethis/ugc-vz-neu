# Image Caching System - Complete Implementation

## 🎯 Overview

This system automatically caches creator profile images from Instagram/TikTok to solve the placeholder image problem and improve performance.

## ✅ What Was Built

### 1. **Terminal Scraping Script** (`scripts/scrape-creator-images.ts`)
- Fetches all creator profiles from Airtable
- Scrapes profile images using existing `getProfileImage()` function
- Downloads and saves images to `/public/creator-images/`
- Updates Airtable with cached URLs and timestamps
- Includes progress tracking and detailed logging

### 2. **Vercel Cron Job** (`app/api/cron/update-images/route.ts`)
- Runs automatically every 3 months
- Re-scrapes outdated images (older than 90 days)
- Processes 50 records per run to avoid timeouts
- Updates Airtable automatically

### 3. **Configuration Files**
- `vercel.json` - Cron schedule configuration
- `package.json` - Added npm scripts
- Documentation in `docs/image-caching-setup.md`

## 📋 Setup Instructions

### Step 1: Add Airtable Fields

Add these two fields to your Airtable base:

1. **Field Name:** `cached_image_url`
   - **Type:** Single line text
   - **Description:** Stores the URL to the cached image

2. **Field Name:** `image_last_updated`
   - **Type:** Date
   - **Description:** Tracks when the image was last updated

### Step 2: Configure Environment Variables

Create or update `.env.local` with:

```bash
# Airtable Configuration
AIRTABLE_API_KEY=your-airtable-api-key-here
AIRTABLE_BASE_ID=appbpBRQkSWkdwTT5
AIRTABLE_TABLE_NAME=tblXbhX5gIB47BjBr

# OpenRouter (optional - for AI search)
OPENROUTER_API_KEY=your-openrouter-key-here

# Vercel Cron Secret (for production)
CRON_SECRET=your-random-secret-here
```

**Generate CRON_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 3: Install Dependencies

Dependencies are already installed (ts-node was added automatically).

### Step 4: Run Initial Image Scraping

```bash
# Run the scraping script (skips recently cached images)
npm run scrape-images

# Force re-scrape all images
npm run scrape-images:force
```

The script will:
- ✅ Connect to Airtable
- ✅ Fetch all creator records
- ✅ Scrape profile images from Instagram/TikTok
- ✅ Download and save images locally
- ✅ Update Airtable with cached URLs
- ✅ Show detailed progress and statistics

### Step 5: Deploy to Vercel

1. **Add Environment Variables in Vercel:**
   - Go to your Vercel project settings
   - Add all environment variables from `.env.local`
   - Add `CRON_SECRET` for the cron job authentication

2. **Deploy:**
   ```bash
   git add .
   git commit -m "Add image caching system"
   git push
   ```

3. **Verify Cron Job:**
   - In Vercel dashboard, go to your project
   - Check "Cron Jobs" section
   - You should see the `/api/cron/update-images` job scheduled

## 🔄 How It Works

### Initial Scraping (Manual)
```
User runs npm script
      ↓
Script fetches Airtable records
      ↓
For each creator:
  1. Scrape Instagram/TikTok image
  2. Download image to /public/creator-images/
  3. Update Airtable with local URL
      ↓
Statistics report generated
```

### Automatic Updates (Vercel Cron)
```
Every 3 months (1st day at midnight)
      ↓
Cron job triggers
      ↓
Fetches records older than 90 days
      ↓
Re-scrapes and updates images
      ↓
Updates Airtable with new timestamps
```

### Search API Integration
```
User searches for creators
      ↓
Search API checks Airtable
      ↓
If cached_image_url exists:
  ✅ Use cached image
Else:
  ⚠️  Use placeholder (for now)
```

## 📊 File Structure

```
/public/creator-images/
  ├── rec123456.jpg      # Cached image for record rec123456
  ├── rec789012.jpg      # Cached image for record rec789012
  └── .gitkeep

/scripts/
  └── scrape-creator-images.ts    # Manual scraping script

/app/api/cron/update-images/
  └── route.ts                     # Vercel cron job

/docs/
  ├── image-caching-setup.md       # User setup guide
  └── IMAGE-CACHING-SYSTEM.md      # This file
```

## 🎮 Usage

### Run Manual Scraping
```bash
# Normal mode (skips cached images < 90 days old)
npm run scrape-images

# Force mode (re-scrapes everything)
npm run scrape-images:force
```

### Test Cron Job Locally
```bash
# Set the CRON_SECRET in terminal
export CRON_SECRET="your-secret-here"

# Call the endpoint with auth header
curl -X GET http://localhost:3000/api/cron/update-images \
  -H "Authorization: Bearer your-secret-here"
```

### Monitor Cron Job in Production
- Check Vercel dashboard → Your Project → Cron Jobs
- View execution logs in the "Deployments" section

## 🚨 Important Notes

### Rate Limits
- The script processes 3 creators at a time
- 2-second delay between batches
- This prevents Instagram/TikTok rate limiting

### Storage
- Images are stored in `/public/creator-images/`
- Vercel has a 100MB limit for static files
- For scaling beyond ~500 creators, consider Vercel Blob Storage

### Caching Strategy
- Images are cached for 90 days
- Cron job only updates old/missing images
- Manual script can force re-scrape with `--force` flag

## 🐛 Troubleshooting

### "No images found"
- Check that social links exist in Airtable
- Verify links are valid Instagram/TikTok URLs
- Check rate limiting (wait and retry)

### "Airtable update failed"
- Verify field names match exactly:
  - `cached_image_url` (lowercase, underscore)
  - `image_last_updated` (lowercase, underscore)
- Check API key permissions

### "Cron job not running"
- Verify `CRON_SECRET` is set in Vercel
- Check cron schedule in vercel.json
- View logs in Vercel dashboard

### "TypeScript errors"
- Run `npm install` to ensure all dependencies
- Check that ts-node is installed

## 📈 Next Steps (Future Enhancements)

1. **Integrate with Search API**
   - Modify search API to use cached images
   - Fallback to live scraping if cache miss

2. **Add Image Optimization**
   - Compress images on download
   - Generate multiple sizes (thumbnail, full)
   - Use Next.js Image Optimization

3. **Webhook Integration**
   - Auto-scrape when new creators added to Airtable
   - Use Airtable automation webhooks

4. **Monitoring & Alerts**
   - Add success/failure notifications
   - Track scraping statistics over time
   - Alert on high failure rates

5. **Vercel Blob Storage**
   - For scaling beyond 500 creators
   - Better CDN performance
   - No static file size limits

## 💡 Tips

- Run initial scrape during low-traffic hours
- Monitor first run closely for errors
- Check Airtable after scraping to verify URLs
- Test with a few records first using Airtable filters

## 📞 Support

If you encounter issues:
1. Check the documentation in `docs/image-caching-setup.md`
2. Review console logs for specific errors
3. Verify all environment variables are set correctly
4. Check Airtable field names and types
