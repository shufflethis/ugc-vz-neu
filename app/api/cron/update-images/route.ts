import { NextResponse } from 'next/server';
import Airtable from 'airtable';
import axios from 'axios';
import { getProfileImage } from '@/utils/profileImage';

export const maxDuration = 300; // 5 minutes max for cron job
export const dynamic = 'force-dynamic';

/**
 * Vercel Cron Job - Update Creator Images
 * 
 * This endpoint is called automatically by Vercel Cron every 3 months
 * to re-scrape and update creator profile images.
 * 
 * Configure in vercel.json with the schedule: "0 0 1 *\/3 *"
 */

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  
  // Verify this is a legitimate cron request
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('🔄 Starting scheduled image update cron job...');

  try {
    // Initialize Airtable
    const base = new Airtable({ 
      apiKey: process.env.AIRTABLE_API_KEY 
    }).base(process.env.AIRTABLE_BASE_ID || 'appbpBRQkSWkdwTT5');

    const tableName = process.env.AIRTABLE_TABLE_NAME || 'tblXbhX5gIB47BjBr';

    // Fetch all records that need updating (older than 90 days or no image)
    console.log('📋 Fetching records that need updating...');
    
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const records = await base(tableName)
      .select({
        filterByFormula: `OR(
          {image_last_updated} = BLANK(),
          IS_BEFORE({image_last_updated}, '${threeMonthsAgo.toISOString()}')
        )`,
        maxRecords: 50 // Limit to 50 per run to avoid timeouts
      })
      .all();

    console.log(`Found ${records.length} records to update`);

    const stats = {
      total: records.length,
      successful: 0,
      failed: 0,
      skipped: 0
    };

    // Process each record
    for (const record of records) {
      try {
        const fields = record.fields;
        const name = String(fields['Wie heißt du?  (Vor- und Nachname)'] || 'Unknown');
        const socialLinks = String(fields['In welchem Netzwerk hast du Accounts und möchtest du aktiv sein?&nbsp; '] || '');
        const gender = String(fields['Wie ist dein Geschlecht?'] || '');

        console.log(`Processing: ${name}`);

        if (!socialLinks) {
          console.log(`  Skipping - no social links`);
          stats.skipped++;
          continue;
        }

        // Scrape new image
        const imageUrl = await getProfileImage(socialLinks, gender);

        if (imageUrl.includes('placeholder')) {
          console.log(`  Failed - only got placeholder`);
          stats.failed++;
          continue;
        }

        // Download and save image
        const response = await axios({
          url: imageUrl,
          method: 'GET',
          responseType: 'arraybuffer',
          timeout: 30000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        // For Vercel deployment, we'd use Vercel Blob Storage instead
        // For now, just update Airtable with the scraped URL
        await base(tableName).update([
          {
            id: record.id,
            fields: {
              'cached_image_url': imageUrl,
              'image_last_updated': new Date().toISOString()
            }
          }
        ]);

        console.log(`  ✅ Updated ${name}`);
        stats.successful++;

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`  ❌ Error:`, error);
        stats.failed++;
      }
    }

    console.log('✅ Cron job completed');
    console.log(`Stats: ${stats.successful} successful, ${stats.failed} failed, ${stats.skipped} skipped`);

    return NextResponse.json({
      success: true,
      stats,
      message: `Updated ${stats.successful} of ${stats.total} records`
    });

  } catch (error) {
    console.error('❌ Cron job error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
