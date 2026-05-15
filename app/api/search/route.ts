import { NextResponse } from 'next/server';
import Airtable from 'airtable';
import fs from 'fs';
import path from 'path';
import { getProfileImage } from '@/utils/profileImage';

// Define a proper type for processed creators
type ProcessedCreator = {
  id: string;
  name: string;
  image: string;
  reach: string;
  totalReach: number;
  hasCustomImage: boolean;
  networks: string[];
  priceRange: string;
  gender: string | undefined;
  score?: number; // AI-based relevance score
};

interface AirtableRecord {
  id: string;
  fields: Record<string, any>;
}

export const maxDuration = 30; // Reduced to 30 seconds for Vercel
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Add caching for Airtable results
let cachedRecords: AirtableRecord[] | null = null;
let lastFetch: number = 0;
const CACHE_DURATION = 300000; // 5 minutes cache for better performance

const getLocalCreatorImage = (recordId: string): string | null => {
  const relativePath = `/creator-images/${recordId}.jpg`;
  const absolutePath = path.join(process.cwd(), 'public', 'creator-images', `${recordId}.jpg`);

  return fs.existsSync(absolutePath) ? relativePath : null;
};

type CreatorProfile = {
  fullName: string;
  firstName: string;
  gender?: string;
  socialLinks: string;
  reachText: string;
  totalReach: number;
  priceRange: string;
  age: number | null;
  location: string;
  languages: string;
  topicsText: string;
  formatsText: string;
  portfolioText: string;
  availability: string;
  imageUrl: string;
};

const fieldCandidates = {
  fullName: [
    'Wie heißt du?  (Vor- und Nachname)',
    'Wie heißt du? (Vor- und Nachname)',
    'Name',
    'Vor- und Nachname',
    'Vollständiger Name',
    'Full name',
  ],
  gender: [
    'Wie ist dein Geschlecht?',
    'Geschlecht',
    'Gender',
  ],
  socialLinks: [
    'In welchem Netzwerk hast du Accounts und möchtest du aktiv sein?&nbsp; ',
    'In welchem Netzwerk hast du Accounts und möchtest du aktiv sein?',
    'Social Links',
    'Social Media Links',
    'Instagram',
    'TikTok',
    'Profile',
  ],
  reach: [
    'Wie groß ist deine Reichweite pro Netzwerk? ',
    'Wie groß ist deine Reichweite pro Netzwerk?',
    'Reichweite',
    'Follower',
    'Follower je Netzwerk',
  ],
  price: [
    'Price',
    'Preis',
    'Preisrange',
    'Preisvorstellung',
    'Rate',
    'Rates',
    'Was kostet ein Video bei dir?',
  ],
  age: [
    'Alter',
    'Age',
    'Wie alt bist du?',
  ],
  birthDate: [
    'Geburtsdatum',
    'Geburtstag',
    'Date of birth',
    'Birthday',
  ],
  location: [
    'Standort',
    'Stadt',
    'Wohnort',
    'Ort',
    'Location',
    'Wo wohnst du?',
  ],
  languages: [
    'Sprache',
    'Sprachen',
    'Languages',
    'Welche Sprachen sprichst du?',
  ],
  topics: [
    'Branche',
    'Branchen',
    'Nische',
    'Nischen',
    'Themen',
    'Kategorien',
    'Für welche Themen erstellst du Content?',
    'Welche Branchen passen zu dir?',
  ],
  formats: [
    'Content-Formate',
    'Formate',
    'Videoformate',
    'Welche Formate bietest du an?',
    'UGC Formate',
  ],
  portfolio: [
    'Portfolio',
    'Portfolio-Link',
    'Portfolio Links',
    'Arbeitsproben',
    'Beispiele',
    'Content Beispiele',
  ],
  availability: [
    'Verfügbarkeit',
    'Availability',
    'Wann bist du verfügbar?',
  ],
  image: [
    'cached_image_url',
    'Profilbild',
    'Profile Picture',
    'Bild',
    'Foto',
    'Image',
  ],
};

const stringifyField = (value: any): string => {
  if (Array.isArray(value)) {
    return value.map(stringifyField).filter(Boolean).join('\n');
  }

  if (value && typeof value === 'object') {
    if (value.url) return String(value.url);
    if (value.filename) return String(value.filename);
    return Object.values(value).map(stringifyField).filter(Boolean).join(' ');
  }

  return String(value || '').trim();
};

const getFieldValue = (fields: Record<string, any>, candidates: string[]): string => {
  for (const candidate of candidates) {
    const value = stringifyField(fields[candidate]);
    if (value) return value;
  }

  const normalizedCandidates = candidates.map(candidate => candidate.toLowerCase().replace(/\s|&nbsp;|[?:()]/g, ''));
  for (const [key, rawValue] of Object.entries(fields)) {
    const normalizedKey = key.toLowerCase().replace(/\s|&nbsp;|[?:()]/g, '');
    if (normalizedCandidates.some(candidate => normalizedKey.includes(candidate) || candidate.includes(normalizedKey))) {
      const value = stringifyField(rawValue);
      if (value) return value;
    }
  }

  return '';
};

const parseAge = (ageText: string, birthDateText: string): number | null => {
  const ageMatch = ageText.match(/\b(1[6-9]|[2-6]\d|70)\b/);
  if (ageMatch) return Number(ageMatch[1]);

  if (birthDateText) {
    const birthDate = new Date(birthDateText);
    if (!Number.isNaN(birthDate.getTime())) {
      const now = new Date();
      let age = now.getFullYear() - birthDate.getFullYear();
      const monthDiff = now.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) age -= 1;
      return age >= 16 && age <= 90 ? age : null;
    }
  }

  return null;
};

const parsePriceValue = (priceText: string): number | null => {
  const match = priceText.replace(/\./g, '').match(/(\d{2,5})/);
  return match ? Number(match[1]) : null;
};

const mapCreatorProfile = (record: AirtableRecord): CreatorProfile => {
  const fields = record.fields;
  const fullName = getFieldValue(fields, fieldCandidates.fullName);
  const socialLinks = getFieldValue(fields, fieldCandidates.socialLinks);
  const reachText = getFieldValue(fields, fieldCandidates.reach);
  const priceRange = getFieldValue(fields, fieldCandidates.price);

  return {
    fullName,
    firstName: fullName.split(' ')[0] || 'Creator',
    gender: getFieldValue(fields, fieldCandidates.gender),
    socialLinks,
    reachText,
    totalReach: calculateTotalReach(reachText),
    priceRange,
    age: parseAge(getFieldValue(fields, fieldCandidates.age), getFieldValue(fields, fieldCandidates.birthDate)),
    location: getFieldValue(fields, fieldCandidates.location),
    languages: getFieldValue(fields, fieldCandidates.languages),
    topicsText: getFieldValue(fields, fieldCandidates.topics),
    formatsText: getFieldValue(fields, fieldCandidates.formats),
    portfolioText: getFieldValue(fields, fieldCandidates.portfolio),
    availability: getFieldValue(fields, fieldCandidates.availability),
    imageUrl: getFieldValue(fields, fieldCandidates.image),
  };
};

// Helper function to create mock Airtable records for testing
function getMockAirtableRecords(): AirtableRecord[] {
  return [
    {
      id: 'rec1',
      fields: {
        'Wie heißt du?  (Vor- und Nachname)': 'Anna Müller',
        'Wie ist dein Geschlecht?': 'Weiblich',
        'In welchem Netzwerk hast du Accounts und möchtest du aktiv sein?&nbsp; ': 'Instagram\nTikTok',
        'Wie groß ist deine Reichweite pro Netzwerk? ': 'Instagram: 25k\nTikTok: 40k',
        'Price': '500-1000€'
      }
    },
    {
      id: 'rec2',
      fields: {
        'Wie heißt du?  (Vor- und Nachname)': 'Max Schmidt',
        'Wie ist dein Geschlecht?': 'Männlich',
        'In welchem Netzwerk hast du Accounts und möchtest du aktiv sein?&nbsp; ': 'Instagram\nYouTube',
        'Wie groß ist deine Reichweite pro Netzwerk? ': 'Instagram: 15k\nYouTube: 50k',
        'Price': '1000-2000€'
      }
    },
    {
      id: 'rec3',
      fields: {
        'Wie heißt du?  (Vor- und Nachname)': 'Sophie Weber',
        'Wie ist dein Geschlecht?': 'Weiblich',
        'In welchem Netzwerk hast du Accounts und möchtest du aktiv sein?&nbsp; ': 'TikTok\nInstagram',
        'Wie groß ist deine Reichweite pro Netzwerk? ': 'TikTok: 100k\nInstagram: 35k',
        'Price': '2000-3000€'
      }
    },
    {
      id: 'rec4',
      fields: {
        'Wie heißt du?  (Vor- und Nachname)': 'Luca Bauer',
        'Wie ist dein Geschlecht?': 'Männlich',
        'In welchem Netzwerk hast du Accounts und möchtest du aktiv sein?&nbsp; ': 'TikTok\nInstagram',
        'Wie groß ist deine Reichweite pro Netzwerk? ': 'TikTok: 80k\nInstagram: 30k',
        'Price': '800-1500€'
      }
    },
    {
      id: 'rec5',
      fields: {
        'Wie heißt du?  (Vor- und Nachname)': 'René Fischer',
        'Wie ist dein Geschlecht?': 'Männlich',
        'In welchem Netzwerk hast du Accounts und möchtest du aktiv sein?&nbsp; ': 'TikTok\nYouTube',
        'Wie groß ist deine Reichweite pro Netzwerk? ': 'TikTok: 120k\nYouTube: 45k',
        'Price': '1500-2500€'
      }
    }
  ];
}

// Fix the duplicate minFollowers declaration first
// Fix the duplicate minFollowers declaration
export async function POST(req: Request) {
  // Extract request ID from headers for better logging
  const requestId = req.headers.get('x-request-id') || Date.now().toString();
  const isTestRequest = req.headers.get('x-test-request') === 'true';

  // Log device and browser information for debugging
  const userAgent = req.headers.get('user-agent') || 'Unknown';
  const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent);
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

  console.log(`[${requestId}] Search API called ${isTestRequest ? '(TEST REQUEST)' : ''}`);
  console.log(`[${requestId}] User Agent: ${userAgent}`);
  console.log(`[${requestId}] iOS Device: ${isIOSDevice}, Mobile Device: ${isMobileDevice}`);

  try {
    // Early timeout check for Vercel
    const startTime = Date.now();
    const TIMEOUT_MS = 25000; // 25 seconds to leave buffer for response
    // Check if request body is valid
    let query;
    let reqBody;

    try {
      reqBody = await req.json();
      console.log(`[${requestId}] Request body:`, reqBody);

      query = reqBody.query;
      console.log(`[${requestId}] Search query received:`, query);

      if (!query || typeof query !== 'string') {
        console.error(`[${requestId}] Invalid query parameter:`, query);
        throw new Error('Invalid query parameter');
      }
    } catch (parseError) {
      console.error(`[${requestId}] Failed to parse request body:`, parseError);
      return NextResponse.json({
        success: false,
        error: 'Invalid request body',
        message: 'Could not parse request body',
        details: parseError instanceof Error ? parseError.message : String(parseError)
      }, { status: 400 });
    }

    // If this is a test request, return a simple response to verify the API is working
    if (isTestRequest || reqBody.isTest) {
      console.log(`[${requestId}] This is a test request, returning test response`);
      return NextResponse.json({
        success: true,
        message: 'Test request received successfully',
        query: query,
        timestamp: new Date().toISOString(),
        requestId: requestId
      });
    }

    // Check timeout before proceeding
    if (Date.now() - startTime > TIMEOUT_MS) {
      console.warn(`[${requestId}] Request timeout before Airtable initialization`);
      return NextResponse.json({
        success: false,
        error: 'Request timeout',
        message: 'Request took too long to process'
      }, { status: 504 });
    }

    // Initialize Airtable base inside the function
    const airtableApiKey = process.env.AIRTABLE_API_KEY;
    let base: any = null;
    let usingMockData = false;

    if (!airtableApiKey) {
      console.error(`[${requestId}] AIRTABLE_API_KEY is not defined in environment variables`);
      console.log(`[${requestId}] Will use mock data due to missing API key`);
      usingMockData = true;
    } else {
      console.log(`[${requestId}] Initializing Airtable connection...`);
      try {
        base = new Airtable({ apiKey: airtableApiKey }).base(process.env.AIRTABLE_BASE_ID || 'appbpBRQkSWkdwTT5');
        console.log(`[${requestId}] Airtable connection initialized successfully`);
      } catch (airtableError) {
        console.error(`[${requestId}] Failed to initialize Airtable:`, airtableError);
        console.log(`[${requestId}] Will use mock data due to Airtable initialization error`);
        usingMockData = true;
      }
    }



    // Generate reasoning explanation
    console.log(`[${requestId}] Generating reasoning for query: "${query}"`);
    const reasoning = generateReasoning(query);
    console.log(`[${requestId}] Reasoning generated successfully, length: ${reasoning.length} characters`);

    console.log(`[${requestId}] Analyzing query with AI: "${query}"`);

    // AI-based query analysis - try OpenRouter first, fallback to regex-based
    let initialAnalysis: QueryAnalysis;
    
    // Try OpenRouter if API key is available
    if (process.env.OPENROUTER_API_KEY) {
      try {
        console.log(`[${requestId}] Using OpenRouter for query analysis`);
        initialAnalysis = await analyzeQueryWithOpenRouter(query, requestId);
        console.log(`[${requestId}] OpenRouter query analysis results:`, initialAnalysis);
      } catch (openRouterError) {
        console.warn(`[${requestId}] OpenRouter failed, falling back to regex analysis:`, openRouterError);
        initialAnalysis = analyzeQueryWithAI(query, requestId);
        console.log(`[${requestId}] Fallback regex analysis results:`, initialAnalysis);
      }
    } else {
      console.log(`[${requestId}] No OpenRouter key, using regex analysis`);
      initialAnalysis = analyzeQueryWithAI(query, requestId);
      console.log(`[${requestId}] Regex query analysis results:`, initialAnalysis);
    }

    // Extract filters from AI analysis
    const isMaleQuery = initialAnalysis.gender === 'male';
    const isFemaleQuery = initialAnalysis.gender === 'female';
    const wantsTikTok = initialAnalysis.platforms.includes('tiktok');
    const wantsInstagram = initialAnalysis.platforms.includes('instagram');
    const minFollowers = initialAnalysis.minFollowers;
    const maxFollowers = initialAnalysis.maxFollowers;

    // Log the extracted filters
    console.log(`[${requestId}] Extracted filters:`, {
      gender: initialAnalysis.gender,
      platforms: initialAnalysis.platforms,
      topics: initialAnalysis.topics,
      minFollowers,
      maxFollowers
    });

    // Remove duplicate declaration
    // const minFollowers = followerMatch ? parseInt(followerMatch[1]) : 0;
    // console.log('Minimum followers:', minFollowers);

    // Use cached records if available for better performance
    const now = Date.now();
    const forceFresh = false; // Use cache for better performance

    if (usingMockData) {
      console.log(`[${requestId}] Using mock data instead of Airtable`);
      cachedRecords = getMockAirtableRecords();
      console.log(`[${requestId}] Created ${cachedRecords.length} mock records`);
    } else if (forceFresh || !cachedRecords || now - lastFetch > CACHE_DURATION) {
      console.log(`[${requestId}] Fetching fresh records from Airtable...`);

      try {
        // Build Airtable filter formula based on query analysis
        let filterFormula = '';
        
        // Apply gender filter if specified
        if (initialAnalysis.gender === 'male') {
          filterFormula = "{Wie ist dein Geschlecht?} = 'Männlich'";
          console.log(`[${requestId}] Applying Airtable gender filter: Male`);
        } else if (initialAnalysis.gender === 'female') {
          filterFormula = "{Wie ist dein Geschlecht?} = 'Weiblich'";
          console.log(`[${requestId}] Applying Airtable gender filter: Female`);
        }
        
        // Apply platform filter if specified
        if (initialAnalysis.platforms.length > 0) {
          const platformFilters = initialAnalysis.platforms.map(platform => {
            const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
            return `FIND('${platformName}', {In welchem Netzwerk hast du Accounts und möchtest du aktiv sein?})`;
          });
          
          const platformFormula = platformFilters.length > 1 
            ? `OR(${platformFilters.join(', ')})` 
            : platformFilters[0];
          
          filterFormula = filterFormula 
            ? `AND(${filterFormula}, ${platformFormula})` 
            : platformFormula;
          
          console.log(`[${requestId}] Applying Airtable platform filter: ${initialAnalysis.platforms.join(', ')}`);
        }
        
        console.log(`[${requestId}] Final Airtable filter formula: ${filterFormula || 'none (fetching all records)'}`);

        // Create a direct fetch promise
        console.log(`[${requestId}] Creating Airtable fetch promise...`);

        // Test if we can access the table
        try {
          console.log(`[${requestId}] Testing Airtable table access...`);
          // Test table access by trying to get records from the main table
          if (base) {
            const testRecords = await base(process.env.AIRTABLE_TABLE_NAME || 'tblXbhX5gIB47BjBr').select({ maxRecords: 1 }).firstPage();
            console.log(`[${requestId}] Successfully accessed table, found ${testRecords.length} records`);
          }
        } catch (tableError) {
          console.error(`[${requestId}] Error accessing tables:`, tableError);
        }

        // Force a direct Airtable fetch to ensure we get fresh data
        const fetchPromise = new Promise<AirtableRecord[]>((resolve, reject) => {
          console.log(`[${requestId}] Starting Airtable fetch with filters...`);

          try {
            if (!base) {
              reject(new Error('Airtable base not initialized'));
              return;
            }

            const selectOptions: any = {
              maxRecords: 100 // Reduced from 200 since we're filtering server-side
            };
            
            // Only add filter if we have one
            if (filterFormula) {
              selectOptions.filterByFormula = filterFormula;
            }

            base(process.env.AIRTABLE_TABLE_NAME || 'tblXbhX5gIB47BjBr').select(selectOptions).firstPage((err: any, records: any) => {
              if (err) {
                console.error(`[${requestId}] Airtable firstPage error:`, err);
                reject(err);
                return;
              }

              console.log(`[${requestId}] Airtable firstPage success with filters, records:`, records?.length || 0);
              resolve(records ? [...records] as AirtableRecord[] : []);
            });
          } catch (selectError) {
            console.error(`[${requestId}] Error in select:`, selectError);
            reject(selectError);
          }
        });

        // Set a timeout for the Airtable fetch
        const timeoutPromise = new Promise<AirtableRecord[]>((_, reject) =>
          setTimeout(() => {
            console.log(`[${requestId}] Airtable fetch timeout after 20 seconds`);
            reject(new Error('Airtable timeout'));
          }, 20000)
        );

        // Race the fetch against the timeout
        console.log(`[${requestId}] Waiting for Airtable fetch or timeout...`);
        cachedRecords = await Promise.race([
          fetchPromise,
          timeoutPromise
        ]);

        console.log(`[${requestId}] Successfully fetched ${cachedRecords.length} records from Airtable`);

        // Log a sample record for debugging
        if (cachedRecords.length > 0) {
          const sampleRecord = cachedRecords[0];
          console.log(`[${requestId}] Sample record:`, {
            id: sampleRecord.id,
            name: sampleRecord.fields['Wie heißt du?  (Vor- und Nachname)'],
            networks: sampleRecord.fields['In welchem Netzwerk hast du Accounts und möchtest du aktiv sein?&nbsp; '],
            reach: sampleRecord.fields['Wie groß ist deine Reichweite pro Netzwerk? ']
          });
        } else {
          console.warn(`[${requestId}] No records returned from Airtable`);

          // Use mock data for testing if no records are returned
          console.log(`[${requestId}] Using mock data for testing`);
          cachedRecords = getMockAirtableRecords();
          console.log(`[${requestId}] Created ${cachedRecords.length} mock records`);
        }

        lastFetch = now;
      } catch (airtableError) {
        console.error(`[${requestId}] Error fetching from Airtable:`, airtableError);

        // Use mock data for testing if Airtable fetch fails
        console.log(`[${requestId}] Using mock data due to Airtable error`);
        cachedRecords = getMockAirtableRecords();
        console.log(`[${requestId}] Created ${cachedRecords.length} mock records`);
      }
    } else {
      console.log(`[${requestId}] Using ${cachedRecords.length} cached records from previous fetch`);
    }

    // Reuse the initial analysis for filtering
    console.log(`[${requestId}] Using initial analysis for filtering`);

    // Process creators in batches with AI-based filtering
    // Dynamic batch size: 25% of total records, min 10, max 50
    const BATCH_SIZE = Math.max(10, Math.min(50, Math.ceil(cachedRecords.length / 4)));
    const results = [];

    console.log(`[${requestId}] Processing ${cachedRecords.length} creators with AI filtering in batches of ${BATCH_SIZE}`);

    // Create a scoring function based on the query analysis
    const scoreCreator = (record: AirtableRecord): number => {
      // Use the initialAnalysis from above
      const analysis = initialAnalysis;
      const profile = mapCreatorProfile(record);
      let score = 0;

      // Basic information
      const fullName = profile.fullName;
      const gender = profile.gender;
      const socialLinks = profile.socialLinks;
      const reachText = profile.reachText;
      const totalReach = profile.totalReach;
      const searchableProfileText = [
        profile.fullName,
        profile.socialLinks,
        profile.reachText,
        profile.location,
        profile.languages,
        profile.topicsText,
        profile.formatsText,
        profile.portfolioText,
        profile.availability,
        profile.priceRange,
      ].join(' ').toLowerCase();

      // 1. Gender match (highest priority)
      console.log(`[${requestId}] Gender filtering for ${fullName}: query wants "${analysis.gender}", creator is "${gender}"`);

      if (analysis.gender === 'male' && gender === 'Männlich') {
        score += 100;
        console.log(`[${requestId}] ✓ Male match for ${fullName}`);
      } else if (analysis.gender === 'female' && gender === 'Weiblich') {
        score += 100;
        console.log(`[${requestId}] ✓ Female match for ${fullName}`);
      } else if (analysis.gender === 'any') {
        score += 50; // Neutral score for any gender when no preference
        console.log(`[${requestId}] ✓ Any gender accepted for ${fullName}`);
      } else if (analysis.gender === 'male' && gender !== 'Männlich') {
        // Male requested but creator is not male - EXCLUDE completely
        console.log(`[${requestId}] ❌ Male requested but ${fullName} is ${gender} - EXCLUDED`);
        return 0; // Return 0 score to exclude this creator entirely
      } else if (analysis.gender === 'female' && gender !== 'Weiblich') {
        // Female requested but creator is not female - EXCLUDE completely
        console.log(`[${requestId}] ❌ Female requested but ${fullName} is ${gender} - EXCLUDED`);
        return 0; // Return 0 score to exclude this creator entirely
      } else {
        // Default case - give some points
        score += 30;
        console.log(`[${requestId}] ✓ Default gender scoring for ${fullName}`);
      }

      // 2. Platform match
      const platforms = {
        tiktok: socialLinks.toLowerCase().includes('tiktok'),
        instagram: socialLinks.toLowerCase().includes('instagram'),
        youtube: socialLinks.toLowerCase().includes('youtube'),
        facebook: socialLinks.toLowerCase().includes('facebook')
      };

      // If specific platforms are requested, they must be present
      if (analysis.platforms.length > 0) {
        let hasPlatformMatch = false;

        for (const platform of analysis.platforms) {
          if (platforms[platform as keyof typeof platforms]) {
            score += 50; // Add points for each matching platform
            hasPlatformMatch = true;
          }
        }

        // If no platforms match and platforms were specified, reduce score but don't exclude
        if (!hasPlatformMatch) {
          score += 5; // Very low score but still included
          console.log(`[${requestId}] ⚠ No platform match for ${fullName} - low score`);
        }
      } else {
        // If no specific platforms requested, give some points for having any platform
        score += 20;
      }

      // 3. Reach/follower count match
      if (analysis.minFollowers > 0 && totalReach < analysis.minFollowers) {
        // Below minimum followers - reduce score but don't exclude
        score += 5;
        console.log(`[${requestId}] ⚠ ${fullName} below minimum followers (${totalReach} < ${analysis.minFollowers}) - low score`);
      } else if (analysis.maxFollowers && totalReach > analysis.maxFollowers) {
        // Above maximum followers - reduce score but don't exclude
        score += 5;
        console.log(`[${requestId}] ⚠ ${fullName} above maximum followers (${totalReach} > ${analysis.maxFollowers}) - low score`);
      }

      // If within range, give points based on how close to the ideal range
      if (analysis.minFollowers > 0 && analysis.maxFollowers) {
        // Ideal is in the middle of the range
        const idealReach = (analysis.minFollowers + analysis.maxFollowers) / 2;
        const distanceFromIdeal = Math.abs(totalReach - idealReach) / idealReach;
        score += 50 * (1 - Math.min(distanceFromIdeal, 1)); // Higher score for closer to ideal
      } else if (analysis.minFollowers > 0) {
        // For minimum only, higher is better (up to a point)
        score += Math.min(30 * (totalReach / analysis.minFollowers), 50);
      } else if (analysis.maxFollowers) {
        // For maximum only, closer to max is better
        score += 50 * (1 - Math.min(totalReach / analysis.maxFollowers, 1));
      } else {
        // No follower constraints, higher reach is slightly better
        score += Math.min(Math.log10(totalReach) * 5, 30);
      }

      // 4. Topic/niche match (check in bio or other fields)
      // This is a simplified approach - in a real system, you'd have better topic classification
      if (analysis.topics.length > 0) {
        const creatorInfo = searchableProfileText;

        for (const topic of analysis.topics) {
          const topicKeywords = {
            'beauty': ['beauty', 'kosmetik', 'make-up', 'makeup', 'schminke'],
            'fashion': ['mode', 'fashion', 'kleidung', 'style'],
            'travel': ['reise', 'travel', 'urlaub', 'vacation'],
            'fitness': ['fitness', 'sport', 'workout', 'training'],
            'food': ['essen', 'food', 'kochen', 'cooking', 'rezepte'],
            'lifestyle': ['lifestyle', 'leben'],
            'tech': ['tech', 'technologie', 'gadgets', 'software', 'app', 'saas'],
            'family': ['family', 'familie', 'mama', 'papa', 'eltern', 'baby', 'kids'],
            'gaming': ['gaming', 'games', 'zocken', 'streaming'],
            'business': ['business', 'b2b', 'karriere', 'office', 'linkedin'],
            'finance': ['finance', 'finanzen', 'versicherung', 'bank', 'geld'],
            'health': ['health', 'gesundheit', 'wellness', 'pflege'],
            'home': ['home', 'wohnen', 'interior', 'diy', 'haushalt'],
            'automotive': ['auto', 'automotive', 'mobilität', 'car']
          };

          const keywords = topicKeywords[topic as keyof typeof topicKeywords] || [];

          for (const keyword of keywords) {
            if (creatorInfo.includes(keyword)) {
              score += 40; // Points for topic match
              break; // Only count each topic once
            }
          }
        }
      }

      // 5. Age match (if the profile has age data mapped from Airtable/Tally)
      if (analysis.ageRange.min !== null || analysis.ageRange.max !== null) {
        if (profile.age === null) {
          score -= 10;
          console.log(`[${requestId}] ⚠ ${fullName} has no mapped age data - slight penalty`);
        } else if (
          (analysis.ageRange.min !== null && profile.age < analysis.ageRange.min) ||
          (analysis.ageRange.max !== null && profile.age > analysis.ageRange.max)
        ) {
          score -= 60;
          console.log(`[${requestId}] ⚠ ${fullName} outside requested age range (${profile.age})`);
        } else {
          score += 45;
          console.log(`[${requestId}] ✓ Age match for ${fullName}: ${profile.age}`);
        }
      }

      // 6. Location match
      if (analysis.location) {
        if (profile.location.toLowerCase().includes(analysis.location)) {
          score += 35;
        } else if (profile.location) {
          score -= 15;
        }
      }

      // 7. Price match
      const creatorPrice = parsePriceValue(profile.priceRange);
      if (creatorPrice !== null && (analysis.priceRange.min !== null || analysis.priceRange.max !== null)) {
        if (
          (analysis.priceRange.min !== null && creatorPrice < analysis.priceRange.min) ||
          (analysis.priceRange.max !== null && creatorPrice > analysis.priceRange.max)
        ) {
          score -= 25;
        } else {
          score += 20;
        }
      }

      // 8. Quality signals from mapped Tally/Airtable data
      if (profile.portfolioText) score += 18;
      if (profile.formatsText) score += 12;
      if (profile.languages) score += 8;
      if (profile.availability) score += 6;

      return score;
    };

    // Process creators with AI scoring
    for (let i = 0; i < cachedRecords.length; i += BATCH_SIZE) {
      const batch = cachedRecords.slice(i, i + BATCH_SIZE);
      console.log(`[${requestId}] Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(cachedRecords.length/BATCH_SIZE)}`);

      const batchResults = await Promise.all(batch.map(async (record: AirtableRecord) => {
        try {
          const profile = mapCreatorProfile(record);
          const fields = record.fields;
          const fullName = profile.fullName;

          // Score this creator based on the query analysis
          const score = scoreCreator(record);

          // If score is very low, this creator doesn't match the requirements
          if (score < 5) {
            console.log(`[${requestId}] Skipping ${fullName} - score too low (${score})`);
            return null;
          }

          console.log(`[${requestId}] Creator ${fullName} scored ${score} points`);

          const gender = profile.gender;
          const socialLinks = profile.socialLinks;
          const firstName = profile.firstName;
          const reachText = profile.reachText;
          const totalReach = profile.totalReach;

          const cachedImageUrl = profile.imageUrl;
          let finalImage: string;
          let hasCustomImage: boolean;

          if (cachedImageUrl && cachedImageUrl.trim() !== '') {
            finalImage = cachedImageUrl;
            hasCustomImage = true;
            console.log(`[${requestId}] Using cached image for ${fullName}: ${finalImage}`);
          } else {
            const localCreatorImage = getLocalCreatorImage(record.id);
            if (localCreatorImage) {
              finalImage = localCreatorImage;
              hasCustomImage = true;
              console.log(`[${requestId}] Using local creator image for ${fullName}: ${finalImage}`);
            } else {
              // Fallback to gender-specific placeholder
              if (gender === 'Weiblich') {
                finalImage = '/female-placeholder.webp';
              } else {
                finalImage = '/placeholder.jpg';
              }
              hasCustomImage = false;
              console.log(`[${requestId}] No cached/local image for ${fullName}, using placeholder: ${finalImage}`);
            }
          }
          // Debug logging for gender and image assignment
          console.log(`[${requestId}] Creator ${fullName}: gender="${gender}", finalImage="${finalImage}"`);

          return {
            id: record.id,
            name: firstName,
            image: finalImage,
            reach: reachText,
            totalReach: totalReach,
            hasCustomImage: hasCustomImage,
            networks: socialLinks.split('\n').filter(Boolean),
            priceRange: profile.priceRange,
            gender: gender, // Add gender for debugging
            score: score // Add AI score for sorting
          };
        } catch (error) {
          console.error(`[${requestId}] Error processing creator:`, error);
          return null;
        }
      }));

      // Count valid results in this batch
      const validBatchResults = batchResults.filter(result => result !== null);
      console.log(`[${requestId}] Batch yielded ${validBatchResults.length} valid creators after AI filtering`);

      results.push(...batchResults);

      // Reduced delay for faster processing
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // Filter out nulls and creators with 0 reach
    const validCreators = results.filter((creator): creator is ProcessedCreator & { score: number } => {
      return creator !== null && creator.totalReach > 0;
    });

    console.log(`[${requestId}] Found ${validCreators.length} valid creators after AI filtering`);

    // Sort valid creators by AI score (highest first)
    validCreators.sort((a, b) => {
      // First sort by AI score (highest first)
      if (a.score !== b.score) {
        return b.score - a.score;
      }

      // If scores are equal, prioritize creators with custom images
      if (a.hasCustomImage !== b.hasCustomImage) {
        return a.hasCustomImage ? -1 : 1; // Custom images first
      }

      // Then sort by reach descending
      return b.totalReach - a.totalReach;
    });

    // Log top creators with AI scores for debugging
    if (validCreators.length > 0) {
      console.log(`[${requestId}] Top creators after AI scoring:`);
      validCreators.slice(0, 5).forEach((c, i) => {
        console.log(`[${requestId}] ${i+1}. ${c.name}: Score ${c.score}, Reach: ${c.totalReach}, Gender: ${c.gender}`);
      });
    } else {
      console.warn(`[${requestId}] No valid creators found for query: "${query}"`);
    }

    const creatorsWithRealImages = validCreators.filter(creator => creator.hasCustomImage);
    const displayCreators = creatorsWithRealImages.length > 0 ? creatorsWithRealImages : validCreators;

    if (creatorsWithRealImages.length > 0 && creatorsWithRealImages.length < validCreators.length) {
      console.log(
        `[${requestId}] Hiding ${validCreators.length - creatorsWithRealImages.length} creators without real images from visible results`
      );
    }

    // Remove helper properties before sending (but keep gender for frontend placeholder logic)
    const finalCreators = displayCreators.map(({ hasCustomImage, totalReach, score, ...rest }) => rest);

    console.log(`[${requestId}] Returning ${finalCreators.length} creators to client after AI filtering`);

    // Include reasoning and AI analysis in the response
    return NextResponse.json({
      success: true,
      creators: finalCreators,
      query: query,
      reasoning: reasoning,
      analysis: {
        gender: initialAnalysis.gender,
        platforms: initialAnalysis.platforms,
        topics: initialAnalysis.topics,
        followerRange: {
          min: initialAnalysis.minFollowers,
          max: initialAnalysis.maxFollowers
        },
        ageRange: initialAnalysis.ageRange,
        keywords: initialAnalysis.keywords
      },
      timestamp: new Date().toISOString(),
      processingTime: Date.now() - new Date(requestId).getTime()
    });

  } catch (error: any) {
    console.error(`[${requestId}] Search error:`, error);

    // Determine appropriate status code
    let statusCode = 500;
    if (error.message === 'Airtable timeout') {
      statusCode = 504; // Gateway Timeout
    } else if (error.message.includes('AIRTABLE_API_KEY')) {
      statusCode = 503; // Service Unavailable
    }

    return NextResponse.json({
      success: false,
      error: 'Search failed',
      message: error.message || 'Unknown error',
      timestamp: new Date().toISOString(),
      requestId: requestId
    }, {
      status: statusCode
    });
  }
}

// AI-based query analysis function
interface QueryAnalysis {
  gender: 'male' | 'female' | 'any';
  platforms: string[];
  topics: string[];
  minFollowers: number;
  maxFollowers: number | null;
  ageRange: {
    min: number | null;
    max: number | null;
  };
  location: string | null;
  priceRange: {
    min: number | null;
    max: number | null;
  };
  keywords: string[];
}

// OpenRouter-based AI query analysis
async function analyzeQueryWithOpenRouter(query: string, requestId: string): Promise<QueryAnalysis> {
  console.log(`[${requestId}] Attempting OpenRouter AI analysis for query: "${query}"`);

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://ugc-vz.vercel.app',
        'X-Title': 'UGC VZ Creator Search',
        'X-Request-ID': requestId
      },
      body: JSON.stringify({
        model: 'zhipu-ai/glm-4.5-air:free',
        messages: [
          {
            role: 'system',
            content: `Du bist ein Experte für Creator-Suche. Analysiere die Suchanfrage und extrahiere strukturierte Informationen.

Antworte NUR mit einem JSON-Objekt in diesem exakten Format (keine zusätzlichen Erklärungen):
{
  "gender": "male" | "female" | "any",
  "platforms": ["tiktok", "instagram", "youtube", "facebook"],
  "topics": ["beauty", "fashion", "travel", "fitness", "food", "lifestyle", "tech", "family", "gaming", "business", "finance", "health", "home", "pets", "automotive"],
  "minFollowers": 0,
  "maxFollowers": null,
  "ageRange": {"min": null, "max": null},
  "location": null,
  "priceRange": {"min": null, "max": null},
  "keywords": ["relevante", "begriffe"]
}

Regeln:
- Erkenne Synonyme: "Insta" = "instagram", "YT" = "youtube"
- Interpretiere Kontext: "Beauty/Kosmetik" impliziert meist "female"
- Extrahiere Reichweiten intelligent: "10k" = 10000, "1m" = 1000000
- Extrahiere Alter: "ab 30" = {"min":30,"max":null}, "unter 25" = {"min":null,"max":25}
- Extrahiere Orte: "Berlin", "Hamburg", "Deutschland", "NRW"
- Extrahiere Budget/Preis: "bis 500 Euro" = {"min":null,"max":500}
- WICHTIG: Explizite Geschlechts-Keywords haben IMMER Vorrang vor Topic-Defaults`
          },
          {
            role: 'user',
            content: `Analysiere diese Creator-Suchanfrage: "${query}"`
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent structured output
        max_tokens: 300
      })
    });

    if (!response.ok) {
      console.error(`[${requestId}] OpenRouter API error: ${response.status} ${response.statusText}`);
      throw new Error(`OpenRouter API failed with status ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error(`[${requestId}] Invalid OpenRouter response format`);
      throw new Error('Invalid OpenRouter response format');
    }

    const content = data.choices[0].message.content;
    console.log(`[${requestId}] OpenRouter raw response:`, content);

    // Parse JSON from response
    let analysis: QueryAnalysis;
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        analysis = {
          gender: parsed.gender || 'any',
          platforms: parsed.platforms || [],
          topics: parsed.topics || [],
          minFollowers: parsed.minFollowers || 0,
          maxFollowers: parsed.maxFollowers || null,
          ageRange: {
            min: parsed.ageRange?.min || null,
            max: parsed.ageRange?.max || null
          },
          location: parsed.location || null,
          priceRange: {
            min: parsed.priceRange?.min || null,
            max: parsed.priceRange?.max || null
          },
          keywords: parsed.keywords || []
        };
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error(`[${requestId}] Failed to parse OpenRouter JSON:`, parseError);
      throw parseError;
    }

    console.log(`[${requestId}] OpenRouter analysis successful:`, analysis);
    return analysis;

  } catch (error) {
    console.error(`[${requestId}] OpenRouter analysis failed:`, error);
    throw error;
  }
}

// Fallback: Regex-based query analysis (used when OpenRouter fails or is unavailable)
function analyzeQueryWithAI(query: string, requestId: string): QueryAnalysis {
  console.log(`[${requestId}] Running AI analysis on query: "${query}"`);

  // Default analysis result
  const analysis: QueryAnalysis = {
    gender: 'any',
    platforms: [],
    topics: [],
    minFollowers: 0,
    maxFollowers: null,
    ageRange: {
      min: null,
      max: null
    },
    location: null,
    priceRange: {
      min: null,
      max: null
    },
    keywords: []
  };

  // Convert query to lowercase for easier matching
  const queryLower = query.toLowerCase();

  // Step 1: Extract gender preferences - explicit gender keywords ALWAYS take precedence
  console.log(`[${requestId}] Analyzing gender preferences in query: "${query}"`);

  // Check for explicit male keywords first
  const hasMaleKeywords = queryLower.includes('männer') || queryLower.includes('männlich') || queryLower.includes('mann');
  const hasFemaleKeywords = queryLower.includes('frauen') || queryLower.includes('weiblich') || queryLower.includes('frau');
  const hasBeautyKeywords = queryLower.includes('kosmetik') || queryLower.includes('beauty') || queryLower.includes('make-up');

  console.log(`[${requestId}] Gender keyword analysis: male=${hasMaleKeywords}, female=${hasFemaleKeywords}, beauty=${hasBeautyKeywords}`);

  if (hasMaleKeywords) {
    analysis.gender = 'male';
    console.log(`[${requestId}] Gender analysis: Detected MALE preference from explicit keywords - this takes precedence over any topic defaults`);
  } else if (hasFemaleKeywords) {
    analysis.gender = 'female';
    console.log(`[${requestId}] Gender analysis: Detected FEMALE preference from explicit keywords`);
  } else if (hasBeautyKeywords) {
    // Only default to female for beauty/cosmetics if NO explicit gender is specified
    analysis.gender = 'female';
    console.log(`[${requestId}] Gender analysis: Defaulting to FEMALE for beauty/cosmetics query (no explicit gender specified)`);
  } else {
    console.log(`[${requestId}] Gender analysis: No specific gender preference detected, using ANY`);
  }

  // Step 2: Extract platforms
  if (queryLower.includes('tiktok')) {
    analysis.platforms.push('tiktok');
  }
  if (queryLower.includes('instagram') || queryLower.includes('insta')) {
    analysis.platforms.push('instagram');
  }
  if (queryLower.includes('youtube') || queryLower.includes('yt')) {
    analysis.platforms.push('youtube');
  }
  if (queryLower.includes('facebook') || queryLower.includes('fb')) {
    analysis.platforms.push('facebook');
  }

  // Step 3: Extract topics/niches with fuzzy matching for typo tolerance
  const topics = [
    { keywords: ['kosmetik', 'beauty', 'make-up', 'makeup', 'schminke'], topic: 'beauty' },
    { keywords: ['mode', 'fashion', 'kleidung', 'style'], topic: 'fashion' },
    { keywords: ['reise', 'travel', 'urlaub', 'vacation'], topic: 'travel' },
    { keywords: ['fitness', 'sport', 'workout', 'training'], topic: 'fitness' },
    { keywords: ['essen', 'food', 'kochen', 'cooking', 'rezepte'], topic: 'food' },
    { keywords: ['lifestyle', 'leben'], topic: 'lifestyle' },
    { keywords: ['tech', 'technologie', 'gadgets', 'software', 'app', 'saas'], topic: 'tech' },
    { keywords: ['family', 'familie', 'mama', 'papa', 'eltern', 'baby', 'kids'], topic: 'family' },
    { keywords: ['gaming', 'games', 'zocken', 'streaming'], topic: 'gaming' },
    { keywords: ['business', 'b2b', 'karriere', 'office', 'linkedin'], topic: 'business' },
    { keywords: ['finance', 'finanzen', 'versicherung', 'bank', 'geld'], topic: 'finance' },
    { keywords: ['health', 'gesundheit', 'wellness', 'pflege'], topic: 'health' },
    { keywords: ['home', 'wohnen', 'interior', 'diy', 'haushalt'], topic: 'home' },
    { keywords: ['auto', 'automotive', 'mobilität', 'car'], topic: 'automotive' }
  ];

  topics.forEach(topicObj => {
    // Check for exact match OR fuzzy match (typo tolerance)
    const hasMatch = topicObj.keywords.some(keyword => 
      queryLower.includes(keyword) || isSimilar(queryLower, keyword, 2)
    );
    
    if (hasMatch) {
      analysis.topics.push(topicObj.topic);
      console.log(`[${requestId}] Topic match found: ${topicObj.topic}`);
    }
  });

  // Step 4: Extract follower counts
  // Check for minimum followers
  const minFollowerPatterns = [
    /mehr als (\d+(?:\.\d+)?(?:k|m)?)/i,
    /mindestens (\d+(?:\.\d+)?(?:k|m)?)/i,
    /(\d+(?:\.\d+)?(?:k|m)?) follower oder mehr/i,
    /über (\d+(?:\.\d+)?(?:k|m)?)/i
  ];

  for (const pattern of minFollowerPatterns) {
    const match = queryLower.match(pattern);
    if (match && match[1]) {
      let value = match[1].toLowerCase();
      let multiplier = 1;

      if (value.includes('k')) {
        multiplier = 1000;
        value = value.replace('k', '');
      } else if (value.includes('m')) {
        multiplier = 1000000;
        value = value.replace('m', '');
      }

      analysis.minFollowers = parseFloat(value) * multiplier;
      break;
    }
  }

  // Check for maximum followers
  const maxFollowerPatterns = [
    /weniger als (\d+(?:\.\d+)?(?:k|m)?)/i,
    /maximal (\d+(?:\.\d+)?(?:k|m)?)/i,
    /höchstens (\d+(?:\.\d+)?(?:k|m)?)/i,
    /unter (\d+(?:\.\d+)?(?:k|m)?)/i
  ];

  for (const pattern of maxFollowerPatterns) {
    const match = queryLower.match(pattern);
    if (match && match[1]) {
      let value = match[1].toLowerCase();
      let multiplier = 1;

      if (value.includes('k')) {
        multiplier = 1000;
        value = value.replace('k', '');
      } else if (value.includes('m')) {
        multiplier = 1000000;
        value = value.replace('m', '');
      }

      analysis.maxFollowers = parseFloat(value) * multiplier;
      break;
    }
  }

  const agePatterns = [
    { type: 'min', pattern: /(?:ab|über|ueber|mindestens)\s*(\d{2})/i },
    { type: 'max', pattern: /(?:unter|bis|maximal|höchstens|hoechstens)\s*(\d{2})/i },
    { type: 'range', pattern: /(?:zwischen\s*)?(\d{2})\s*(?:-|bis|und)\s*(\d{2})/i }
  ];

  for (const { type, pattern } of agePatterns) {
    const match = queryLower.match(pattern);
    if (match) {
      if (type === 'range') {
        analysis.ageRange.min = Number(match[1]);
        analysis.ageRange.max = Number(match[2]);
      } else if (type === 'min') {
        analysis.ageRange.min = Number(match[1]);
      } else if (type === 'max') {
        analysis.ageRange.max = Number(match[1]);
      }
      break;
    }
  }

  const knownLocations = ['berlin', 'hamburg', 'münchen', 'muenchen', 'köln', 'koeln', 'frankfurt', 'stuttgart', 'düsseldorf', 'duesseldorf', 'leipzig', 'nrw', 'deutschland', 'österreich', 'oesterreich', 'schweiz'];
  analysis.location = knownLocations.find(location => queryLower.includes(location)) || null;

  const priceMaxMatch = queryLower.match(/(?:bis|maximal|unter)\s*(\d{2,5})\s*(?:€|euro|eur)?/i);
  const priceMinMatch = queryLower.match(/(?:ab|mindestens|über|ueber)\s*(\d{2,5})\s*(?:€|euro|eur)/i);
  if (priceMaxMatch) analysis.priceRange.max = Number(priceMaxMatch[1]);
  if (priceMinMatch) analysis.priceRange.min = Number(priceMinMatch[1]);

  // Step 6: Extract keywords
  // Remove common words and extract potential keywords
  const commonWords = ['ich', 'suche', 'nach', 'für', 'mit', 'und', 'oder', 'der', 'die', 'das', 'ein', 'eine', 'auf', 'in', 'bei'];
  const words = queryLower.split(/\s+/).filter(word =>
    word.length > 3 && !commonWords.includes(word) && !word.match(/^\d+$/)
  );

  analysis.keywords = [...new Set(words)]; // Remove duplicates

  console.log(`[${requestId}] AI analysis complete:`, analysis);
  return analysis;
}

// Generate structured reasoning explanation based on AI analysis
function generateReasoning(query: string): string {
  // Use the AI analysis to generate reasoning
  const analysis = analyzeQueryWithAI(query, Date.now().toString());

  // Build structured reasoning text
  let reasoning = "";

  // Section 1: Understanding the query
  reasoning += "1. Verständnis der Anfrage\n";
  reasoning += "Die KI analysiert die Schlüsselwörter und Kriterien:\n\n";

  // Add gender information
  if (analysis.gender === 'male') {
    reasoning += "• Geschlecht: Männliche Creator werden gesucht.\n\n";
  } else if (analysis.gender === 'female') {
    reasoning += "• Geschlecht: Weibliche Creator werden gesucht.\n\n";
  }

  // Add platform information
  if (analysis.platforms.length > 0) {
    const platformsFormatted = analysis.platforms.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(', ');
    reasoning += `• Plattformen: ${platformsFormatted}.\n\n`;
  }

  // Add topic information
  if (analysis.topics.length > 0) {
    const topicsMap: {[key: string]: string} = {
      'beauty': 'Beauty/Kosmetik',
      'fashion': 'Mode/Fashion',
      'travel': 'Reisen',
      'fitness': 'Fitness/Sport',
      'food': 'Essen/Kochen',
      'lifestyle': 'Lifestyle',
      'tech': 'Technologie'
    };

    const topicsFormatted = analysis.topics.map(t => topicsMap[t] || t).join(', ');
    reasoning += `• Themen: ${topicsFormatted}.\n\n`;
  }

  // Add follower information
  if (analysis.minFollowers > 0) {
    reasoning += `• Mindestreichweite: ${analysis.minFollowers.toLocaleString('de-DE')} Follower.\n\n`;
  }

  if (analysis.maxFollowers) {
    reasoning += `• Maximale Reichweite: ${analysis.maxFollowers.toLocaleString('de-DE')} Follower.\n\n`;
  }

  // Add age information
  if (analysis.ageRange.min !== null || analysis.ageRange.max !== null) {
    if (analysis.ageRange.min !== null && analysis.ageRange.max !== null) {
      reasoning += `• Alter: Zwischen ${analysis.ageRange.min} und ${analysis.ageRange.max} Jahren.\n\n`;
    } else if (analysis.ageRange.min !== null) {
      reasoning += `• Alter: Über ${analysis.ageRange.min} Jahre.\n\n`;
    } else if (analysis.ageRange.max !== null) {
      reasoning += `• Alter: Unter ${analysis.ageRange.max} Jahre.\n\n`;
    }
  }

  // Section 2: Database query
  reasoning += "2. Datenbankabfrage\n";
  reasoning += "Die KI durchsucht die Datenbank nach Creators, die folgende Kriterien erfüllen:\n\n";

  // Add gender filter for database
  if (analysis.gender !== 'any') {
    reasoning += `• Geschlecht: ${analysis.gender === 'male' ? 'Männlich' : 'Weiblich'}.\n\n`;
  }

  // Add platform filter for database
  if (analysis.platforms.length > 0) {
    const platformsFormatted = analysis.platforms.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(', ');
    reasoning += `• Aktiv auf: ${platformsFormatted}.\n\n`;
  }

  // Add topic filter for database
  if (analysis.topics.length > 0) {
    const topicsMap: {[key: string]: string} = {
      'beauty': 'Beauty/Kosmetik',
      'fashion': 'Mode/Fashion',
      'travel': 'Reisen',
      'fitness': 'Fitness/Sport',
      'food': 'Essen/Kochen',
      'lifestyle': 'Lifestyle',
      'tech': 'Technologie'
    };

    const topicsFormatted = analysis.topics.map(t => topicsMap[t] || t).join(', ');
    reasoning += `• Content-Nische: ${topicsFormatted}.\n\n`;
  }

  // Add follower filter for database
  if (analysis.minFollowers > 0 || analysis.maxFollowers) {
    let reachText = "• Reichweite: ";

    if (analysis.minFollowers > 0 && analysis.maxFollowers) {
      reachText += `Zwischen ${analysis.minFollowers.toLocaleString('de-DE')} und ${analysis.maxFollowers.toLocaleString('de-DE')} Follower.`;
    } else if (analysis.minFollowers > 0) {
      reachText += `Mindestens ${analysis.minFollowers.toLocaleString('de-DE')} Follower.`;
    } else if (analysis.maxFollowers) {
      reachText += `Maximal ${analysis.maxFollowers.toLocaleString('de-DE')} Follower.`;
    }

    reasoning += reachText + "\n\n";
  }

  // Section 3: Filtering and prioritization
  reasoning += "3. Filterung und Priorisierung\n";
  reasoning += "Die KI filtert die Ergebnisse und priorisiert Creators nach:\n\n";

  reasoning += "• Relevanz: Passende Inhalte in den gesuchten Nischen.\n\n";

  if (analysis.minFollowers > 0 || analysis.maxFollowers) {
    reasoning += "• Reichweite: Innerhalb der angegebenen Grenzen.\n\n";
  } else {
    reasoning += "• Reichweite: Höhere Reichweite wird bevorzugt.\n\n";
  }

  reasoning += "• Bildqualität: Creators mit professionellen Profilbildern werden bevorzugt angezeigt.\n\n";

  if (analysis.platforms.length > 1) {
    reasoning += "• Multi-Plattform: Creator, die auf mehreren der gewünschten Plattformen aktiv sind, werden bevorzugt.\n\n";
  }

  return reasoning;
}

// Helper function to calculate Levenshtein distance for fuzzy matching
function levenshteinDistance(a: string, b: string): number {
  const matrix = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

// Helper function to check if two strings are similar (for typo tolerance)
function isSimilar(query: string, keyword: string, threshold: number = 2): boolean {
  return levenshteinDistance(query.toLowerCase(), keyword.toLowerCase()) <= threshold;
}

// Helper function to calculate numeric reach value for sorting
function calculateTotalReach(reachText: string): number {
  // Handle more platform name variations and better number extraction
  const platforms = reachText.split(/(?:Instagram|Insta|TikTok|YouTube|Facebook|LinkedIn|FB|YT):\s*/i).filter(Boolean);

  let total = 0;

  platforms.forEach(platform => {
    const numbers = platform.trim().match(/\d+(?:[.,]\d+)?(?:\s*[kKmM])?/g) || [];

    numbers.forEach(num => {
      let cleanNum = num.trim().replace(/[.,]/g, '');
      let value = parseFloat(cleanNum);

      if (num.toLowerCase().includes('k')) {
        value *= 1000;
      } else if (num.toLowerCase().includes('m')) {
        value *= 1000000;
      }

      if (!isNaN(value)) {
        total += value;
      }
    });
  });

  return Math.round(total);
}
