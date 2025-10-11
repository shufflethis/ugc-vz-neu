#!/usr/bin/env tsx

/**
 * Creator Image Scraping Script
 * 
 * This script:
 * 1. Fetches all creator profiles from Airtable
 * 2. Scrapes profile images from Instagram/TikTok
 * 3. Saves images locally to /public/creator-images/
 * 4. Updates Airtable with cached image URLs and timestamps
 * 
 * Usage: npm run scrape-images
 */

// Load environment variables from .env.local
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import Airtable from 'airtable';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { getProfileImage } from '@/utils/profileImage';

// Configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appbpBRQkSWkdwTT5';
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'tblXbhX5gIB47BjBr';
const IMAGE_DIR = path.join(process.cwd(), 'public', 'creator-images');
const DELAY_BETWEEN_REQUESTS = 2000; // 2 seconds between requests to avoid rate limits
const MAX_CONCURRENT_DOWNLOADS = 3; // Process 3 creators at a time

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

// Helper function to download and save image
async function downloadImage(url: string, filepath: string): Promise<boolean> {
  try {
    console.log(`  📥 Downloading image from: ${url}`);
    
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    // Verify it's actually an image
    const contentType = response.headers['content-type'];
    if (!contentType || !contentType.startsWith('image/')) {
      console.log(`  ❌ Invalid content type: ${contentType}`);
      return false;
    }

    // Create directory if it doesn't exist
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Save the image
    fs.writeFileSync(filepath, response.data);
    console.log(`  ✅ Image saved to: ${filepath}`);
    return true;
  } catch (error) {
    console.error(`  ❌ Error downloading image:`, error instanceof Error ? error.message : String(error));
    return false;
  }
}

// Helper function to update Airtable record
async function updateAirtableRecord(
  base: any,
  recordId: string,
  imageUrl: string
): Promise<boolean> {
  try {
    // Format date as YYYY-MM-DD for Airtable Date field
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
    console.log(`  ✅ Updated Airtable record with cached image URL`);
    return true;
  } catch (error) {
    console.error(`  ❌ Error updating Airtable:`, error instanceof Error ? error.message : String(error));
    return false;
  }
}

// Process a single creator
async function processCreator(
  base: any,
  record: any,
  forceRescrape: boolean = false
): Promise<void> {
  const recordId = record.id;
  const fields = record.fields;
  const name = fields['Wie heißt du?  (Vor- und Nachname)'] || 'Unknown';
  const gender = fields['Wie ist dein Geschlecht?'];
  const socialLinks = fields['In welchem Netzwerk hast du Accounts und möchtest du aktiv sein?&nbsp; '] || '';
  const existingCachedUrl = fields['cached_image_url'];
  const lastUpdated = fields['image_last_updated'];

  console.log(`\n📝 Processing: ${name} (${recordId})`);
  console.log(`   Gender: ${gender || 'Not specified'}`);
  console.log(`   Social Links: ${socialLinks.substring(0, 100)}${socialLinks.length > 100 ? '...' : ''}`);

  // Skip if no social links
  if (!socialLinks || socialLinks.trim().length === 0) {
    console.log(`  ⏭️  Skipping - No social links`);
    stats.skipped++;
    return;
  }

  // Check if we should skip (already has cached image and not forcing rescrape)
  if (!forceRescrape && existingCachedUrl && lastUpdated) {
    const daysSinceUpdate = (Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate < 90) { // Less than 90 days old
      console.log(`  ⏭️  Skipping - Already cached (${Math.round(daysSinceUpdate)} days old)`);
      stats.skipped++;
      return;
    }
  }

  try {
    // Step 1: Scrape profile image
    console.log(`  🔍 Scraping profile image...`);
    const imageUrl = await getProfileImage(socialLinks, gender);

    // Check if we got a real image or just a placeholder
    if (imageUrl.includes('placeholder')) {
      console.log(`  ⚠️  Only got placeholder image`);
      stats.failed++;
      return;
    }

    // Step 2: Download and save image locally
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

    // Step 3: Update Airtable with cached URL
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
  console.log('🚀 Starting Creator Image Scraping Script\n');
  console.log('========================================\n');

  // Check environment variables
  if (!AIRTABLE_API_KEY) {
    console.error('❌ Error: AIRTABLE_API_KEY is not set in environment variables');
    console.error('Please create a .env.local file with your API key');
    process.exit(1);
  }

  console.log(`📊 Configuration:`);
  console.log(`   Base ID: ${AIRTABLE_BASE_ID}`);
  console.log(`   Table: ${AIRTABLE_TABLE_NAME}`);
  console.log(`   Image Directory: ${IMAGE_DIR}`);
  console.log(`   Delay: ${DELAY_BETWEEN_REQUESTS}ms`);
  console.log(`   Concurrent: ${MAX_CONCURRENT_DOWNLOADS}\n`);

  // Initialize Airtable
  console.log('🔌 Connecting to Airtable...');
  const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

  // Create image directory if it doesn't exist
  if (!fs.existsSync(IMAGE_DIR)) {
    fs.mkdirSync(IMAGE_DIR, { recursive: true });
    console.log(`📁 Created directory: ${IMAGE_DIR}`);
  }

  // Fetch all records
  console.log('\n📋 Fetching all creator records from Airtable...');
  
  let allRecords: any[] = [];
  
  try {
    await base(AIRTABLE_TABLE_NAME).select().eachPage((records, fetchNextPage) => {
      allRecords = allRecords.concat(records);
      console.log(`   Fetched ${allRecords.length} records so far...`);
      fetchNextPage();
    });
  } catch (error) {
    console.error('❌ Error fetching records:', error);
    process.exit(1);
  }

  stats.total = allRecords.length;
  console.log(`\n✅ Fetched ${stats.total} total records\n`);
  console.log('========================================\n');

  // Ask user if they want to force rescrape
  const args = process.argv.slice(2);
  const forceRescrape = args.includes('--force') || args.includes('-f');
  
  if (forceRescrape) {
    console.log('⚠️  Force rescrape mode enabled - will update all images\n');
  }

  // Process records in batches
  console.log(`🔄 Processing creators (${MAX_CONCURRENT_DOWNLOADS} at a time)...\n`);
  
  for (let i = 0; i < allRecords.length; i += MAX_CONCURRENT_DOWNLOADS) {
    const batch = allRecords.slice(i, i + MAX_CONCURRENT_DOWNLOADS);
    
    // Process batch concurrently
    await Promise.all(
      batch.map(record => processCreator(base, record, forceRescrape))
    );

    // Progress update
    const progress = Math.round((stats.processed / stats.total) * 100);
    console.log(`\n📊 Progress: ${stats.processed}/${stats.total} (${progress}%)`);
    console.log(`   ✅ Successful: ${stats.successful}`);
    console.log(`   ❌ Failed: ${stats.failed}`);
    console.log(`   ⏭️  Skipped: ${stats.skipped}`);

    // Delay between batches to avoid rate limits
    if (i + MAX_CONCURRENT_DOWNLOADS < allRecords.length) {
      console.log(`\n⏳ Waiting ${DELAY_BETWEEN_REQUESTS}ms before next batch...\n`);
      await sleep(DELAY_BETWEEN_REQUESTS);
    }
  }

  // Final statistics
  console.log('\n========================================');
  console.log('\n🎉 Scraping Complete!\n');
  console.log('📊 Final Statistics:');
  console.log(`   Total Records: ${stats.total}`);
  console.log(`   Processed: ${stats.processed}`);
  console.log(`   ✅ Successful: ${stats.successful}`);
  console.log(`   ❌ Failed: ${stats.failed}`);
  console.log(`   ⏭️  Skipped: ${stats.skipped}`);
  console.log(`   📝 Airtable Updated: ${stats.updated}`);
  console.log(`   Success Rate: ${Math.round((stats.successful / stats.processed) * 100)}%`);
  console.log('\n========================================\n');
}

// Run the script
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
