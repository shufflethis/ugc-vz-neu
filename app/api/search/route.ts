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
    
    // Generate reasoning explanation
    const reasoning = generateReasoning(query);
    
    // Check gender filter
    const isMaleQuery = query.toLowerCase().includes('männer') || 
                       query.toLowerCase().includes('männlich') ||
                       query.toLowerCase().includes('mann');
    const isFemaleQuery = query.toLowerCase().includes('frauen') || 
                         query.toLowerCase().includes('weiblich') ||
                         query.toLowerCase().includes('frau');
    
    // Check platform filter
    const wantsTikTok = query.toLowerCase().includes('tiktok');
    const wantsInstagram = query.toLowerCase().includes('instagram') || query.toLowerCase().includes('insta');
    
    // Check follower minimum - make sure we parse it correctly
    const followerMatch = query.match(/mehr als (\d+) follower/i);
    const minFollowers = followerMatch ? parseInt(followerMatch[1]) : 0;
    console.log('Minimum followers:', minFollowers);
    
    // Use cached records if available
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
    }

    // Process creators in batches
    const BATCH_SIZE = 10;
    const results = [];
    
    for (let i = 0; i < cachedRecords.length; i += BATCH_SIZE) {
      const batch = cachedRecords.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(batch.map(async (record: AirtableRecord) => {
        try {
          const fields = record.fields;
          
          // Strict gender check - case sensitive exact match
          const gender = fields['Wie ist dein Geschlecht?'];
          
          // Skip if gender doesn't match query - more strict check
          if (isFemaleQuery && gender !== 'Weiblich') {
            console.log(`Skipping non-female: ${fields['Wie heißt du?  (Vor- und Nachname)']} - Gender: ${gender}`);
            return null;
          }
          
          if (isMaleQuery && gender !== 'Männlich') {
            return null;
          }
          
          // If neither male nor female is specified but we're looking for specific attributes
          // like "kosmetik", default to female
          if (!isMaleQuery && !isFemaleQuery && 
              (query.toLowerCase().includes('kosmetik') || 
               query.toLowerCase().includes('beauty')) && 
              gender !== 'Weiblich') {
            console.log(`Skipping non-female for beauty query: ${fields['Wie heißt du?  (Vor- und Nachname)']}`);
            return null;
          }

          const socialLinks = String(fields['In welchem Netzwerk hast du Accounts und möchtest du aktiv sein?&nbsp; '] || '');
          
          // Check if they have the requested platform
          const hasTikTok = socialLinks.toLowerCase().includes('tiktok');
          const hasInstagram = socialLinks.toLowerCase().includes('instagram');
          
          // Skip if they don't have the requested platform
          if (wantsTikTok && !hasTikTok) {
            return null;
          }
          
          if (wantsInstagram && !hasInstagram) {
            return null;
          }
          
          const fullName = String(fields['Wie heißt du?  (Vor- und Nachname)'] || '');
          const firstName = fullName.split(' ')[0];
          const reachText = String(fields['Wie groß ist deine Reichweite pro Netzwerk? '] || '');
          
          // Calculate total reach and platform-specific reach
          const totalReach = calculateTotalReach(reachText);
          
          // More strict follower check
          if (minFollowers > 0 && totalReach < minFollowers) {
            console.log(`Skipping ${firstName} - insufficient reach: ${totalReach} < ${minFollowers}`);
            return null;
          }
          
          const profileImage = await getProfileImage(socialLinks);
          
          // Use gender-specific placeholder if needed
          let finalImage = profileImage;
          if (profileImage.includes('placeholder.jpg')) {
            if (gender === 'Weiblich') {
              finalImage = '/female-placeholder.webp';
            } else {
              finalImage = '/placeholder.jpg';
            }
          }

          return {
            id: record.id,
            name: firstName,
            image: finalImage,
            reach: reachText,
            totalReach: totalReach,
            hasCustomImage: !profileImage.includes('placeholder'),
            networks: socialLinks.split('\n').filter(Boolean),
            priceRange: String(fields.Price || ''),
            gender: gender // Add gender for debugging
          };
        } catch (error) {
          console.error('Error processing creator:', error);
          return null;
        }
      }));
      
      results.push(...batchResults);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Filter out nulls and sort - fix sorting logic
    const validCreators = results
      .filter(creator => creator !== null)
      .sort((a, b) => {
        // First sort by custom image
        if (a.hasCustomImage !== b.hasCustomImage) {
          return a.hasCustomImage ? -1 : 1;
        }
        // Then by reach within each group - ensure numeric comparison
        return (b.totalReach || 0) - (a.totalReach || 0);
      });

    console.log(`Found ${validCreators.length} valid creators after filtering`);
    
    // Log top creators for debugging
    if (validCreators.length > 0) {
      console.log('Top creators:');
      validCreators.slice(0, 5).forEach((c, i) => {
        console.log(`${i+1}. ${c.name}: ${c.totalReach} reach, custom image: ${c.hasCustomImage}, gender: ${c.gender}`);
      });
    }

    // Remove helper properties before sending
    const finalCreators = validCreators.map(({ hasCustomImage, totalReach, gender, ...rest }) => rest);

    // Include reasoning in the response
    return NextResponse.json({ 
      success: true,
      creators: finalCreators,
      query: query,
      reasoning: reasoning
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

// New function to generate reasoning explanation in German
function generateReasoning(query: string): string {
  let reasoning = "Thinking\n\n";
  reasoning += "Analysiere die Anfrage\n\n";
  
  // Add the original query as first thought
  reasoning += `• Die Anfrage lautet: "${query}"\n\n`;
  
  // Add analysis thoughts
  if (query.toLowerCase().includes('unter')) {
    reasoning += `• Ich überprüfe, ob es sich um eine Altersangabe handelt\n\n`;
  }

  if (query.toLowerCase().includes('kosmetik')) {
    reasoning += `• Es geht um Kosmetikprodukte, ich suche nach passenden Influencern\n\n`;
  }

  if (query.toLowerCase().includes('tiktok')) {
    const followerMatch = query.match(/mehr als (\d+) follower/i);
    if (followerMatch) {
      reasoning += `• TikTok Creator mit mindestens ${followerMatch[1]} Followern werden gesucht\n\n`;
    }
  }

  if (query.toLowerCase().includes('weniger als') || query.toLowerCase().includes('unter')) {
    const maxMatch = query.match(/weniger als (\d+)/i) || query.match(/unter (\d+)/i);
    if (maxMatch) {
      reasoning += `• Eine Obergrenze von ${maxMatch[1]} wurde angegeben\n\n`;
    }
  }

  reasoning += "• Suche nach passenden Creators in der Datenbank...";
  
  return reasoning;
}

// Helper function to calculate numeric reach value for sorting
function calculateTotalReach(reachText: string): number {
  // Handle more platform name variations
  const platforms = reachText.split(/Instagram:|Insta:|TikTok:|YouTube:|Facebook:|LinkedIn:|FB:|YT:/i).filter(Boolean);
  
  let total = 0;
  
  // Process each platform section
  platforms.forEach(platform => {
    const numbers = platform.match(/\d+(?:[.,]\d+)?(?:\s*[kKmM])?/g) || [];
    
    numbers.forEach(num => {
      let value = parseFloat(num.replace(/[.,]/g, ''));
      if (num.toLowerCase().includes('k')) value *= 1000;
      if (num.toLowerCase().includes('m')) value *= 1000000;
      total += value;
    });
  });
  
  return total;
}