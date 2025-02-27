import { NextResponse } from 'next/server';
import Airtable from 'airtable';
import { getProfileImage } from '@/utils/profileImage';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base('appOAS76TTY2MBVuf');

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.VERCEL_URL || 'http://localhost:3000',
        'X-Title': 'UGC VZ',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'nvidia/llama-3.1-nemotron-70b-instruct:free',
        messages: [{
          role: 'system',
          content: 'You are a helpful assistant that analyzes UGC creator search queries in German.'
        }, {
          role: 'user',
          content: `Analyze this search query and extract key requirements:
            Query: "${query}"
            Extract: budget range, content type, industry/niche, specific requirements`
        }]
      })
    });

    const data = await response.json();
    console.log('OpenRouter response:', data);

    // Extract the actual message content
    const analysisContent = data.choices?.[0]?.message?.content;
    console.log('Analysis content:', analysisContent);

    // After getting AI analysis, fetch matching creators from Airtable
    // Fetch creators from the correct table
    // Add more detailed Airtable logging
    console.log('Fetching from Airtable...');
    // Fetch creators from Airtable with correct field names and limit
    // Fetch creators with correct field names from Airtable
    const records = await base('tblDlScXJMvZQ1XGc').select({
      view: 'viw5IA8sDIXNQ3ZQx'
    }).all();

    const creators = await Promise.all(records.map(async record => {
      const fields = record.fields;
      const fullName = String(fields['Wie heißt du?  (Vor- und Nachname)'] || '');
      const firstName = fullName.split(' ')[0];
      const socialLinks = String(fields['In welchem Netzwerk hast du Accounts und möchtest du aktiv sein?&nbsp; '] || '');
      const reachData = String(fields['Wie groß ist deine Reichweite pro Netzwerk? '] || '');

      const profileImage = await getProfileImage(socialLinks);

      return {
        id: record.id,
        name: firstName,
        image: profileImage,
        reach: parseReach(reachData),
        networks: parseNetworks(socialLinks),
        priceRange: String(fields.Price || '')
      };
    }));

    return NextResponse.json({ 
      success: true,
      analysis: analysisContent,
      creators: creators,
      query: query 
    });

  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Search failed', 
      message: error.message || 'Unknown error'
    }, { 
      status: 500 
    });
  }
}

function parseNetworks(networksField: string): string[] {
  const networkMap = {
    'instagram': { name: 'Instagram', icon: '📸' },
    'tiktok': { name: 'TikTok', icon: '🎵' },
    'youtube': { name: 'YouTube', icon: '🎥' },
    'facebook': { name: 'Facebook', icon: '👥' },
    'linkedin': { name: 'LinkedIn', icon: '💼' }
  };

  const networks = [];
  for (const [key, value] of Object.entries(networkMap)) {
    if (networksField.toLowerCase().includes(key.toLowerCase())) {
      networks.push(`${value.icon} ${value.name}`);
    }
  }
  return networks;
}

function parseReach(reachField: string): string {
  if (!reachField) return 'k.A.';
  
  console.log('Parsing reach:', reachField);
  const numbers = reachField.match(/\d+(?:[.,]\d+)?(?:\s*[kKmM])?/g) || [];
  if (numbers.length === 0) return 'k.A.';

  const values = numbers.map(num => {
    const n = parseFloat(num.replace(/[.,]/g, ''));
    if (num.toLowerCase().includes('k')) return n * 1000;
    if (num.toLowerCase().includes('m')) return n * 1000000;
    return n;
  });

  const min = Math.min(...values);
  const max = Math.max(...values);

  function formatNumber(n: number): string {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  }

  return min === max ? formatNumber(min) : `${formatNumber(min)}-${formatNumber(max)}`;
}