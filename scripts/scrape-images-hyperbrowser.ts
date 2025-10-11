#!/usr/bin/env tsx

/**
 * Hyperbrowser-based Creator Image Scraping Script
 * 
 * This script uses Hyperbrowser to scrape profile images from Instagram/TikTok
 * with real browser sessions, bypassing rate limits and anti-scraping measures.
 * 
 * Usage: npm run scrape-images:hyperbrowser
 */

// Load environment variables from .env.local
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import Airtable from 'airtable';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appbpBRQkSWkdwTT5';
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'tblXbhX5gIB47BjBr';
const HYPERBROWSER_API_KEY = process.env.HYPERBROWSER_API_KEY;
const IMAGE_DIR = path.join(process.cwd(), 'public', 'creator-images');
const DELAY_BETWEEN_REQUESTS = 3000; // 3 seconds between requests
const MAX_CONCURRENT = 1; // Process 1 at a time for Hyperbrowser

// Statistics
let stats = {
  total: 0,
  processed: 0,
  successful: 0,
  failed: 0,
  skipped: 0,
  updated: 0
};

// Helper function to sleep
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper function to extract username from URL
function extractUsername(url: string, platform: 'instagram' | 'tiktok'): string | null {
  try {
    if (platform === 'instagram') {
      const match = url.match(/instagram\.com\/([^/?&#]+)/);
      return match ? match[1] : null;
    } else if (platform === 'tiktok') {
      const match = url.match(/tiktok\.com\/@([^?]+)/);
      return match ? match[1] : null;
    }
  } catch (error) {
    return null;
  }
  return null;
}

// Scrape profile image using Hyperbrowser
async function scrapeProfileWithHyperbrowser(url: string, platform: 'instagram' | 'tiktok'): Promise<string | null> {
  try {
    console.log(`  🌐 Scraping ${platform} with Hyperbrowser: ${url}`);

    const response = await axios.post('https://api.hyperbrowser.ai/v1/scrape', {
      url: url,
      outputFormat: ['markdown', 'screenshot']
    }, {
      headers: {
        'Authorization': `Bearer ${HYPERBROWSER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 60 seconds timeout for Hyperbrowser
    });

    if (!response.data || !response.data.data) {
      console.log(`  ❌ No data returned from Hyperbrowser`);
      return null;
    }

    // Check if we got a screenshot
    if (response.data.data.screenshot) {
      console.log(`  ✅ Got screenshot from Hyperbrowser`);
      return response.data.data.screenshot; // This will be a base64 or URL
    }

    // Try to extract profile image from markdown
    if (response.data.data.markdown) {
      const markdown = response.data.data.markdown;
      
      // Look for profile image patterns in markdown
      const imagePatterns = [
        /!\[.*?\]\((https?:\/\/[^)]+\.(?:jpg|jpeg|png|webp))\)/gi,
        /(https?:\/\/[^"'\s]+\/profile[^"'\s]*\.(?:jpg|jpeg|png|webp))/gi,
        /(https?:\/\/[^"'\s]+avatar[^"'\s]*\.(?:jpg|jpeg|png|webp))/gi
      ];

      for (const pattern of imagePatterns) {
        const matches = markdown.match(pattern);
        if (matches && matches.length > 0) {
          // Get the first image URL
          const imageUrl = matches[0].includes('](') 
            ? matches[0].match(/\((https?:\/\/[^)]+)\)/)?.[1]
            : matches[0];
          
          if (imageUrl) {
            console.log(`  ✅ Found profile image in markdown: ${imageUrl.substring(0, 60)}...`);
            return imageUrl;
          }
        }
      }
    }

    console.log(`  ⚠️  Could not find profile image in Hyperbrowser response`);
    return null;

  } catch (error) {
    console.error(`  ❌ Hyperbrowser error:`, error instanceof Error ? error.message : String(error));
    return null;
  }
}

// Download and save image
async function downloadImage(url: string, filepath: string): Promise<boolean> {
  try {
    console.log(`  📥 Downloading image...`);
    
    // Check if it's a base64 string
    if (url.startsWith('data:image')) {
      const base64Data = url.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      
      const dir = path.dirname(filepath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(filepath, buffer);
      console.log(`  ✅ Image saved from base64`);
      return true;
    }

    // Otherwise download from URL
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const contentType = response.headers['content-type'];
    if (!contentType || !contentType.startsWith('image/')) {
      console.log(`  ❌ Invalid content type: ${contentType}`);
      return false;
    }

    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filepath, response.data);
    console.log(`  ✅ Image saved`);
    return true;
  } catch (error) {
    console.error(`  ❌ Error downloading image:`, error instanceof Error ? error.message : String(error));
    return false;
  }
}

// Update Airtable record
async function updateAirtableRecord(
  base: any,
  recordId: string,
  imageUrl: string
): Promise<boolean> {
  try {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    
    await base(AIRTABLE_TABLE_NAME).update([
      {
        id: recordId,
        fields: {
          'cached_image_url': imageUrl,
          'image_last_updated': dateString
        }
      }
    ]);
    console.log(`  ✅ Updated Airtable record`);
    return true;
  } catch (error) {
    console.error(`  ❌ Error updating Airtable:`, error instanceof Error ? error.message : String(error));
    return false;
  }
}

// Process a single creator with Hyperbrowser
async function processCreator(base: any, record: any): Promise<void> {
  const recordId = record.id;
  const fields = record.fields;
  const name = fields['Wie heißt du?  (Vor- und Nachname)'] || 'Unknown';
  const gender = fields['Wie ist dein Geschlecht?'];
  const socialLinks = fields['In welchem Netzwerk hast du Accounts und möchtest du aktiv sein?&nbsp; '] || '';
  const existingCachedUrl = fields['cached_image_url'];

  console.log(`\n📝 Processing: ${name} (${recordId})`);
  console.log(`   Gender: ${gender || 'Not specified'}`);

  // Skip if already has cached image
  if (existingCachedUrl) {
    console.log(`  ⏭️  Skipping - Already has cached image`);
    stats.skipped++;
    return;
  }

  // Skip if no social links
  if (!socialLinks || socialLinks.trim().length === 0) {
    console.log(`  ⏭️  Skipping - No social links`);
    stats.skipped++;
    return;
  }

  console.log(`   Social Links: ${socialLinks.substring(0, 100)}${socialLinks.length > 100 ? '...' : ''}`);

  try {
    const links = socialLinks.split('\n').filter((link: string) => link.trim() !== '');
    let imageUrl: string | null = null;

    // Try Instagram first
    const instagramLinks = links.filter((link: string) => link.toLowerCase().includes('instagram'));
    for (const link of instagramLinks) {
      const username = extractUsername(link, 'instagram');
      if (username) {
        const fullUrl = `https://www.instagram.com/${username}/`;
        imageUrl = await scrapeProfileWithHyperbrowser(fullUrl, 'instagram');
        
        if (imageUrl) break;
        
        // Small delay between attempts
        await sleep(2000);
      }
    }

    // If Instagram failed, try TikTok
    if (!imageUrl) {
      const tiktokLinks = links.filter((link: string) => link.toLowerCase().includes('tiktok'));
      for (const link of tiktokLinks) {
        const username = extractUsername(link, 'tiktok');
        if (username) {
          const fullUrl = `https://www.tiktok.com/@${username}`;
          imageUrl = await scrapeProfileWithHyperbrowser(fullUrl, 'tiktok');
          
          if (imageUrl) break;
          
          await sleep(2000);
        }
      }
    }

    if (!imageUrl) {
      console.log(`  ⚠️  Could not scrape profile image with Hyperbrowser`);
      stats.failed++;
      return;
    }

    // Download and save image
    const imageExtension = imageUrl.includes('.png') ? 'png' : 'jpg';
    const localFilename = `${recordId}.${imageExtension}`;
    const localPath = path.join(IMAGE_DIR, localFilename);
    const publicUrl = `/creator-images/${localFilename}`;

    const downloadSuccess = await downloadImage(imageUrl, localPath);
    
    if (!downloadSuccess) {
      console.log(`  ❌ Failed to download image`);
      stats.failed++;
      return;
    }

    // Update Airtable
    const updateSuccess = await updateAirtableRecord(base, recordId, publicUrl);
    
    if (updateSuccess) {
      stats.successful++;
      stats.updated++;
    } else {
      stats.failed++;
    }

  } catch (error) {
    console.error(`  ❌ Error processing creator:`, error instanceof Error ? error.message : String(error));
    stats.failed++;
  } finally {
    stats.processed++;
  }
}

// Main function
async function main() {
  console.log('🚀 Starting Hyperbrowser Image Scraping Script\n');
  console.log('========================================\n');

  // Check environment variables
  if (!AIRTABLE_API_KEY) {
    console.error('❌ Error: AIRTABLE_API_KEY is not set');
    process.exit(1);
  }

  if (!HYPERBROWSER_API_KEY) {
    console.error('❌ Error: HYPERBROWSER_API_KEY is not set');
    process.exit(1);
  }

  console.log(`📊 Configuration:`);
  console.log(`   Base ID: ${AIRTABLE_BASE_ID}`);
  console.log(`   Table: ${AIRTABLE_TABLE_NAME}`);
  console.log(`   Hyperbrowser: Enabled`);
  console.log(`   Delay: ${DELAY_BETWEEN_REQUESTS}ms\n`);

  // Initialize Airtable
  console.log('🔌 Connecting to Airtable...');
  const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

  // Create image directory
  if (!fs.existsSync(IMAGE_DIR)) {
    fs.mkdirSync(IMAGE_DIR, { recursive: true });
  }

  // Fetch records WITHOUT cached images
  console.log('\n📋 Fetching records without cached images...');
  
  let allRecords: any[] = [];
  
  try {
    await base(AIRTABLE_TABLE_NAME)
      .select({
        filterByFormula: "OR({cached_image_url} = '', {cached_image_url} = BLANK())"
      })
      .eachPage((records, fetchNextPage) => {
        allRecords = allRecords.concat(records);
        console.log(`   Fetched ${allRecords.length} records without images...`);
        fetchNextPage();
      });
  } catch (error) {
    console.error('❌ Error fetching records:', error);
    process.exit(1);
  }

  stats.total = allRecords.length;
  console.log(`\n✅ Found ${stats.total} records needing images\n`);
  console.log('========================================\n');

  // Process records one by one (Hyperbrowser is slower but more successful)
  console.log(`🔄 Processing creators with Hyperbrowser (one at a time)...\n`);
  
  for (let i = 0; i < allRecords.length; i++) {
    const record = allRecords[i];
    
    await processCreator(base, record);

    // Progress update
    const progress = Math.round((stats.processed / stats.total) * 100);
    console.log(`\n📊 Progress: ${stats.processed}/${stats.total} (${progress}%)`);
    console.log(`   ✅ Successful: ${stats.successful}`);
    console.log(`   ❌ Failed: ${stats.failed}`);
    console.log(`   ⏭️  Skipped: ${stats.skipped}`);

    // Delay between requests
    if (i < allRecords.length - 1) {
      console.log(`\n⏳ Waiting ${DELAY_BETWEEN_REQUESTS}ms before next request...\n`);
      await sleep(DELAY_BETWEEN_REQUESTS);
    }
  }

  // Final statistics
  console.log('\n========================================');
  console.log('\n🎉 Hyperbrowser Scraping Complete!\n');
  console.log('📊 Final Statistics:');
  console.log(`   Total Records: ${stats.total}`);
  console.log(`   Processed: ${stats.processed}`);
  console.log(`   ✅ Successful: ${stats.successful}`);
  console.log(`   ❌ Failed: ${stats.failed}`);
  console.log(`   ⏭️  Skipped: ${stats.skipped}`);
  console.log(`   📝 Airtable Updated: ${stats.updated}`);
  if (stats.processed > 0) {
    console.log(`   Success Rate: ${Math.round((stats.successful / stats.processed) * 100)}%`);
  }
  console.log('\n========================================\n');
}

// Run the script
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
