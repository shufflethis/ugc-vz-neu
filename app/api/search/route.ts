import { NextResponse } from 'next/server';
import Airtable from 'airtable';
import { getProfileImage } from '@/utils/profileImage';
import axios from 'axios';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base('appOAS76TTY2MBVuf');

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Function to detect gender from name using OpenRouter
async function detectGenderFromName(name: string): Promise<string> {
  try {
    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model: 'nvidia/llama-3.1-nemotron-70b-instruct:free',
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that determines the likely gender of a person based on their name. Respond with only 'männlich' or 'weiblich'."
          },
          {
            role: "user",
            content: `Is the name "${name}" typically associated with a male or female person in German-speaking countries?`
          }
        ],
        temperature: 0.3,
        max_tokens: 10
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': process.env.VERCEL_URL || 'http://localhost:3000',
          'X-Title': 'UGC VZ',
          'Content-Type': 'application/json'
        }
      }
    );

    const result = response.data.choices[0].message.content?.toLowerCase() || '';
    
    if (result.includes('männlich') || result.includes('male')) {
      return 'männlich';
    } else if (result.includes('weiblich') || result.includes('female')) {
      return 'weiblich';
    } else {
      return 'unbekannt';
    }
  } catch (error) {
    console.error('Error detecting gender:', error);
    return 'unbekannt';
  }
}

export const maxDuration = 300; // Set max duration to 300 seconds
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    console.log('Search query:', query);
    
    // Fetch creators from Airtable with timeout
    const records = await Promise.race([
      base('tblDlScXJMvZQ1XGc').select({
        view: 'viw5IA8sDIXNQ3ZQx'
      }).all(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Airtable timeout')), 10000)
      )
    ]);

    // Process creators with shorter timeouts
    const creatorsWithData = await Promise.all(records.map(async record => {
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