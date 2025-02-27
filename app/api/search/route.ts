import { NextResponse } from 'next/server';
import Airtable from 'airtable';
import { getProfileImage } from '@/utils/profileImage';

// Initialize Airtable base
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base('appOAS76TTY2MBVuf');

interface AirtableRecord {
  id: string;
  fields: {
    'Wie heißt du?  (Vor- und Nachname)'?: string;
    'Wie ist dein Geschlecht?'?: string;
    'In welchem Netzwerk hast du Accounts und möchtest du aktiv sein?&nbsp; '?: string;
    'Wie groß ist deine Reichweite pro Netzwerk? '?: string;
    'Price'?: string;
  };
}

export const maxDuration = 60; // Changed from 300 to 60 seconds for hobby plan
export const dynamic = 'force-dynamic';

// Add caching for Airtable results
let cachedRecords: AirtableRecord[] | null = null;
let lastFetch: number = 0;
const CACHE_DURATION = 30000; // 30 seconds cache

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    console.log('Search query:', query);
    
    // Check gender filter
    const isMaleQuery = query.toLowerCase().includes('männer') || 
                       query.toLowerCase().includes('männlich') ||
                       query.toLowerCase().includes('mann');
    const isFemaleQuery = query.toLowerCase().includes('frauen') || 
                         query.toLowerCase().includes('weiblich') ||
                         query.toLowerCase().includes('frau');

    // Use cached records if available and fresh
    const now = Date.now();
    if (!cachedRecords || now - lastFetch > CACHE_DURATION) {
      console.log('Fetching fresh records from Airtable');
      cachedRecords = await Promise.race([
        base('tblDlScXJMvZQ1XGc').select({
          view: 'viw5IA8sDIXNQ3ZQx'
        }).all(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Airtable timeout')), 15000)
        )
      ]) as AirtableRecord[];
      lastFetch = now;
    } else {
      console.log('Using cached records');
    }

    // Process creators in smaller batches
    const BATCH_SIZE = 10;
    const results = [];
    
    for (let i = 0; i < cachedRecords.length; i += BATCH_SIZE) {
      const batch = cachedRecords.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(batch.map(async (record: AirtableRecord) => {
        try {
          const fields = record.fields;
          const socialLinks = String(fields['In welchem Netzwerk hast du Accounts und möchtest du aktiv sein?&nbsp; '] || '');
          const fullName = String(fields['Wie heißt du?  (Vor- und Nachname)'] || '');
          const firstName = fullName.split(' ')[0];

          // Skip if gender doesn't match query
          if ((isMaleQuery && gender !== 'männlich') || 
              (isFemaleQuery && gender !== 'weiblich')) {
            return null;
          }

          const socialLinks = String(fields['In welchem Netzwerk hast du Accounts und möchtest du aktiv sein?&nbsp; '] || '');
          const reachText = String(fields['Wie groß ist deine Reichweite pro Netzwerk? '] || '');
          const profileImage = await getProfileImage(socialLinks);
          const totalReach = calculateTotalReach(reachText);

          return {
            id: record.id,
            name: firstName,
            image: profileImage,
            reach: reachText,
            totalReach: totalReach,
            hasCustomImage: !profileImage.includes('placeholder.jpg'),
            networks: socialLinks.split('\n').filter(Boolean),
            priceRange: String(fields.Price || '')
          };
        } catch (error) {
          console.error('Error processing creator:', error);
          return null;
        }
      }));
      
      results.push(...batchResults);
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const creatorsWithData = await Promise.all(records.map(async (record: AirtableRecord) => {
      try {
        const fields = record.fields;
        let gender = String(fields['Wie ist dein Geschlecht?'] || '').toLowerCase();
        const fullName = String(fields['Wie heißt du?  (Vor- und Nachname)'] || '');
        const firstName = fullName.split(' ')[0];

        // Skip if gender doesn't match query
        if ((isMaleQuery && gender !== 'männlich') || 
            (isFemaleQuery && gender !== 'weiblich')) {
          return null;
        }

        const socialLinks = String(fields['In welchem Netzwerk hast du Accounts und möchtest du aktiv sein?&nbsp; '] || '');
        const reachText = String(fields['Wie groß ist deine Reichweite pro Netzwerk? '] || '');
        const profileImage = await getProfileImage(socialLinks);
        const totalReach = calculateTotalReach(reachText);

        return {
          id: record.id,
          name: firstName,
          image: profileImage,
          reach: reachText,
          totalReach: totalReach,
          hasCustomImage: !profileImage.includes('placeholder.jpg'),
          networks: socialLinks.split('\n').filter(Boolean),
          priceRange: String(fields.Price || '')
        };
      } catch (error) {
        console.error('Error processing creator:', error);
        return null;
      }
    }));

    // Filter out nulls and sort
    const validCreators = creatorsWithData
      .filter(creator => creator !== null)
      .sort((a, b) => {
        // First sort by custom image
        if (a.hasCustomImage !== b.hasCustomImage) {
          return a.hasCustomImage ? -1 : 1;
        }
        // Then by reach within each group
        return b.totalReach - a.totalReach;
      });

    // Remove helper properties before sending
    const finalCreators = validCreators.map(({ hasCustomImage, totalReach, ...rest }) => rest);

    return NextResponse.json({ 
      success: true,
      creators: finalCreators,
      query: query 
    });

  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Search failed', 
      message: error.message || 'Unknown error'
    }, { 
      status: error.message === 'Airtable timeout' ? 504 : 500 
    });
  }
}

// Helper function to calculate numeric reach value for sorting
function calculateTotalReach(reachText: string): number {
  const numbers = reachText.match(/\d+(?:[.,]\d+)?(?:\s*[kKmM])?/g) || [];
  if (numbers.length === 0) return 0;

  let total = 0;
  numbers.forEach(num => {
    let value = parseFloat(num.replace(/[.,]/g, ''));
    if (num.toLowerCase().includes('k')) value *= 1000;
    if (num.toLowerCase().includes('m')) value *= 1000000;
    total += value;
  });

  return total;
}