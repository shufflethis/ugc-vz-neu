# Image Caching System - Setup Guide

## Overview
This system automatically caches creator profile images from Instagram/TikTok to avoid rate limits and improve performance.

## Environment Variables Setup

Create a `.env.local` file in the root directory with these variables:

```bash
# OpenRouter API (for AI-based search improvements)
OPENROUTER_API_KEY=your-openrouter-api-key

# Airtable Configuration
AIRTABLE_API_KEY=your-airtable-api-key
AIRTABLE_BASE_ID=your-base-id
AIRTABLE_TABLE_NAME=your-table-name
```

### Get Your API Keys:

1. **OpenRouter API Key**: https://openrouter.ai/keys
2. **Airtable API Key**: https://airtable.com/account

## Initial Setup

### 1. Add Airtable Fields

Add these two fields to your Airtable base:
- `cached_image_url` (Single line text) - Stores the URL to the cached image
- `image_last_updated` (Date) - Tracks when the image was last updated

### 2. Run Initial Image Scraping

```bash
npm run scrape-images
```

This will:
- Fetch all creator profiles from Airtable
- Scrape profile images from Instagram/TikTok
- Save images to `/public/creator-images/`
- Update Airtable with cached image URLs

### 3. Deploy to Vercel

The Vercel Cron job will automatically:
- Run every 3 months
- Check for outdated images
- Re-scrape and update as needed

## Directory Structure

```
/public/creator-images/
  ├── rec123456.jpg      # Cached image for record rec123456
  ├── rec789012.jpg      # Cached image for record rec789012
  └── ...
```

## Maintenance

- **Manual re-scraping**: Run `npm run scrape-images` anytime
- **Automatic updates**: Vercel Cron runs every 3 months
- **New profiles**: Automatically detected and scraped within 1 hour

## Troubleshooting

### Images not showing?
- Check if files exist in `/public/creator-images/`
- Verify Airtable `cached_image_url` field is populated
- Check console logs for scraping errors

### Scraping fails?
- Verify Instagram/TikTok profile URLs in Airtable
- Check rate limits (script includes delays)
- Review error logs in terminal

## Cost & Performance

- ✅ **Free** - Uses Vercel's free cron jobs
- ✅ **Fast** - Images served from CDN
- ✅ **Reliable** - Automatic updates
- ✅ **Scalable** - Works with thousands of profiles
