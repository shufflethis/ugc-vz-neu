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

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    console.log('Search query:', query);
    
    // Fetch creators from Airtable with timeout and proper typing
    const records = await Promise.race([
      base('tblDlScXJMvZQ1XGc').select({
        view: 'viw5IA8sDIXNQ3ZQx'
      }).all(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Airtable timeout')), 10000)
      )
    ]) as AirtableRecord[];

    // Process creators with shorter timeouts
    const creatorsWithData = await Promise.all(records.map(async (record: AirtableRecord) => {
      try {
        const fields = record.fields;
        const socialLinks = String(fields['In welchem Netzwerk hast du Accounts und möchtest du aktiv sein?&nbsp; '] || '');
        const fullName = String(fields['Wie heißt du?  (Vor- und Nachname)'] || '');
        const firstName = fullName.split(' ')[0];
        const reachText = String(fields['Wie groß ist deine Reichweite pro Netzwerk? '] || '');

        // Set timeout for image fetching
        const profileImage = await Promise.race([
          getProfileImage(socialLinks),
          new Promise<string>((resolve) => 
            setTimeout(() => resolve('/placeholder.jpg'), 5000)
          )
        ]);

        return {
          id: record.id,
          name: firstName,
          image: profileImage,
          reach: reachText,
          networks: socialLinks.split('\n').filter(Boolean),
          priceRange: String(fields.Price || '')
        };
      } catch (error) {
        console.error('Error processing creator:', error);
        return null;
      }
    }));

    // Filter out failed entries and sort
    const validCreators = creatorsWithData.filter(creator => creator !== null);
    
    return NextResponse.json({ 
      success: true,
      creators: validCreators,
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