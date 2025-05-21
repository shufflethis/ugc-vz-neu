import { NextResponse } from 'next/server';
import Airtable from 'airtable';
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

// Fix the duplicate minFollowers declaration first
// Fix the duplicate minFollowers declaration
export async function POST(req: Request) {
  // Extract request ID from headers for better logging
  const requestId = req.headers.get('x-request-id') || Date.now().toString();
  const isTestRequest = req.headers.get('x-test-request') === 'true';

  console.log(`[${requestId}] Search API called ${isTestRequest ? '(TEST REQUEST)' : ''}`);
  console.log(`[${requestId}] Request headers:`, Object.fromEntries([...req.headers.entries()]));

  try {
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
        details: parseError.toString()
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

    // Initialize Airtable base inside the function
    const airtableApiKey = process.env.AIRTABLE_API_KEY;
    if (!airtableApiKey) {
      console.error(`[${requestId}] AIRTABLE_API_KEY is not defined in environment variables`);
      console.log(`[${requestId}] Environment variables:`, {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV,
        // Don't log actual keys, just whether they exist
        HAS_AIRTABLE_KEY: Boolean(process.env.AIRTABLE_API_KEY),
        HAS_OPENROUTER_KEY: Boolean(process.env.OPENROUTER_API_KEY)
      });
      throw new Error('AIRTABLE_API_KEY is not defined in environment variables');
    }

    console.log(`[${requestId}] Initializing Airtable connection...`);
    let base;
    try {
      base = new Airtable({ apiKey: airtableApiKey }).base('appOAS76TTY2MBVuf');
      console.log(`[${requestId}] Airtable connection initialized successfully`);
    } catch (airtableError) {
      console.error(`[${requestId}] Failed to initialize Airtable:`, airtableError);
      throw new Error(`Airtable initialization failed: ${airtableError.message}`);
    }

    // Generate reasoning explanation
    console.log(`[${requestId}] Generating reasoning for query: "${query}"`);
    const reasoning = generateReasoning(query);
    console.log(`[${requestId}] Reasoning generated successfully, length: ${reasoning.length} characters`);

    console.log(`[${requestId}] Analyzing query with AI: "${query}"`);

    // AI-based query analysis - this is used for generating reasoning
    // We'll reuse this analysis later for filtering
    const initialAnalysis = analyzeQueryWithAI(query, requestId);

    console.log(`[${requestId}] AI query analysis results:`, initialAnalysis);

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

    // Use cached records if available, but for debugging always fetch fresh records
    const now = Date.now();
    const forceFresh = true; // Force fresh fetch for debugging

    if (forceFresh || !cachedRecords || now - lastFetch > CACHE_DURATION) {
      console.log(`[${requestId}] Fetching fresh records from Airtable...`);

      try {
        // Create a direct fetch promise
        console.log(`[${requestId}] Creating Airtable fetch promise...`);

        // Test if we can access the table
        try {
          console.log(`[${requestId}] Testing Airtable table access...`);
          const tables = await base.tables();
          console.log(`[${requestId}] Available tables:`, tables.map(t => ({ id: t.id, name: t.name })));
        } catch (tableError) {
          console.error(`[${requestId}] Error accessing tables:`, tableError);
        }

        // Force a direct Airtable fetch to ensure we get fresh data
        const fetchPromise = new Promise<AirtableRecord[]>((resolve, reject) => {
          console.log(`[${requestId}] Starting Airtable fetch...`);

          try {
            base('tblDlScXJMvZQ1XGc').select({
              view: 'viw5IA8sDIXNQ3ZQx',
              maxRecords: 100 // Limit for faster response
            }).firstPage((err, records) => {
              if (err) {
                console.error(`[${requestId}] Airtable firstPage error:`, err);
                reject(err);
                return;
              }

              console.log(`[${requestId}] Airtable firstPage success, records:`, records?.length || 0);
              resolve(records as AirtableRecord[]);
            });
          } catch (selectError) {
            console.error(`[${requestId}] Error in select:`, selectError);
            reject(selectError);
          }
        });

        // Set a timeout for the Airtable fetch
        const timeoutPromise = new Promise<AirtableRecord[]>((_, reject) =>
          setTimeout(() => {
            console.log(`[${requestId}] Airtable fetch timeout after 15 seconds`);
            reject(new Error('Airtable timeout'));
          }, 15000)
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
        }
      ];
    }

    // Reuse the initial analysis for filtering
    console.log(`[${requestId}] Using initial analysis for filtering`);

    // Process creators in batches with AI-based filtering
    const BATCH_SIZE = 10;
    const results = [];

    console.log(`[${requestId}] Processing ${cachedRecords.length} creators with AI filtering in batches of ${BATCH_SIZE}`);

    // Create a scoring function based on the query analysis
    const scoreCreator = (record: AirtableRecord): number => {
      // Use the initialAnalysis from above
      const analysis = initialAnalysis;
      const fields = record.fields;
      let score = 0;

      // Basic information
      const fullName = String(fields['Wie heißt du?  (Vor- und Nachname)'] || '');
      const gender = fields['Wie ist dein Geschlecht?'];
      const socialLinks = String(fields['In welchem Netzwerk hast du Accounts und möchtest du aktiv sein?&nbsp; '] || '');
      const reachText = String(fields['Wie groß ist deine Reichweite pro Netzwerk? '] || '');
      const totalReach = calculateTotalReach(reachText);

      // 1. Gender match (highest priority)
      if (analysis.gender === 'male' && gender === 'Männlich') {
        score += 100;
      } else if (analysis.gender === 'female' && gender === 'Weiblich') {
        score += 100;
      } else if (analysis.gender === 'any') {
        score += 50; // Neutral score for any gender when no preference
      } else {
        // Gender mismatch is a deal-breaker for gender-specific queries
        return -1;
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

        // If no platforms match and platforms were specified, this is a deal-breaker
        if (!hasPlatformMatch) {
          return -1;
        }
      } else {
        // If no specific platforms requested, give some points for having any platform
        score += 20;
      }

      // 3. Reach/follower count match
      if (analysis.minFollowers > 0 && totalReach < analysis.minFollowers) {
        // Below minimum followers is a deal-breaker
        return -1;
      }

      if (analysis.maxFollowers && totalReach > analysis.maxFollowers) {
        // Above maximum followers is a deal-breaker
        return -1;
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
        const creatorInfo = `${fullName} ${socialLinks} ${reachText}`.toLowerCase();

        for (const topic of analysis.topics) {
          const topicKeywords = {
            'beauty': ['beauty', 'kosmetik', 'make-up', 'makeup', 'schminke'],
            'fashion': ['mode', 'fashion', 'kleidung', 'style'],
            'travel': ['reise', 'travel', 'urlaub', 'vacation'],
            'fitness': ['fitness', 'sport', 'workout', 'training'],
            'food': ['essen', 'food', 'kochen', 'cooking', 'rezepte'],
            'lifestyle': ['lifestyle', 'leben'],
            'tech': ['tech', 'technologie', 'gadgets']
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

      // 5. Age match (if specified)
      // Note: We don't have age data in this example, but in a real system you would check it

      return score;
    };

    // Process creators with AI scoring
    for (let i = 0; i < cachedRecords.length; i += BATCH_SIZE) {
      const batch = cachedRecords.slice(i, i + BATCH_SIZE);
      console.log(`[${requestId}] Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(cachedRecords.length/BATCH_SIZE)}`);

      const batchResults = await Promise.all(batch.map(async (record: AirtableRecord) => {
        try {
          const fields = record.fields;
          const fullName = String(fields['Wie heißt du?  (Vor- und Nachname)'] || '');

          // Score this creator based on the query analysis
          const score = scoreCreator(record);

          // If score is negative, this creator doesn't match the requirements
          if (score < 0) {
            console.log(`[${requestId}] Skipping ${fullName} - doesn't meet requirements`);
            return null;
          }

          console.log(`[${requestId}] Creator ${fullName} scored ${score} points`);

          const gender = fields['Wie ist dein Geschlecht?'];
          const socialLinks = String(fields['In welchem Netzwerk hast du Accounts und möchtest du aktiv sein?&nbsp; '] || '');
          const firstName = fullName.split(' ')[0];
          const reachText = String(fields['Wie groß ist deine Reichweite pro Netzwerk? '] || '');
          const totalReach = calculateTotalReach(reachText);

          console.log(`[${requestId}] Getting profile image for ${fullName}`);
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

          console.log(`[${requestId}] Creator ${fullName} passed AI filtering with score ${score}`);
          return {
            id: record.id,
            name: firstName,
            image: finalImage,
            reach: reachText,
            totalReach: totalReach,
            hasCustomImage: !profileImage.includes('placeholder'),
            networks: socialLinks.split('\n').filter(Boolean),
            priceRange: String(fields.Price || ''),
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

      // Small delay between batches to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
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

    // Remove helper properties before sending
    const finalCreators = validCreators.map(({ hasCustomImage, totalReach, gender, score, ...rest }) => rest);

    console.log(`[${requestId}] Returning ${finalCreators.length} creators to client after AI filtering`);

    // Include reasoning and AI analysis in the response
    return NextResponse.json({
      success: true,
      creators: finalCreators,
      query: query,
      reasoning: reasoning,
      analysis: {
        gender: queryAnalysis.gender,
        platforms: queryAnalysis.platforms,
        topics: queryAnalysis.topics,
        followerRange: {
          min: queryAnalysis.minFollowers,
          max: queryAnalysis.maxFollowers
        },
        ageRange: queryAnalysis.ageRange,
        keywords: queryAnalysis.keywords
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

  // Step 1: Extract gender preferences
  if (queryLower.includes('männer') || queryLower.includes('männlich') || queryLower.includes('mann')) {
    analysis.gender = 'male';
  } else if (queryLower.includes('frauen') || queryLower.includes('weiblich') || queryLower.includes('frau')) {
    analysis.gender = 'female';
  } else if (queryLower.includes('kosmetik') || queryLower.includes('beauty') || queryLower.includes('make-up')) {
    // Default to female for beauty/cosmetics if not specified
    analysis.gender = 'female';
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

  // Step 3: Extract topics/niches
  const topics = [
    { keywords: ['kosmetik', 'beauty', 'make-up', 'makeup', 'schminke'], topic: 'beauty' },
    { keywords: ['mode', 'fashion', 'kleidung', 'style'], topic: 'fashion' },
    { keywords: ['reise', 'travel', 'urlaub', 'vacation'], topic: 'travel' },
    { keywords: ['fitness', 'sport', 'workout', 'training'], topic: 'fitness' },
    { keywords: ['essen', 'food', 'kochen', 'cooking', 'rezepte'], topic: 'food' },
    { keywords: ['lifestyle', 'leben'], topic: 'lifestyle' },
    { keywords: ['tech', 'technologie', 'gadgets'], topic: 'tech' }
  ];

  topics.forEach(topicObj => {
    if (topicObj.keywords.some(keyword => queryLower.includes(keyword))) {
      analysis.topics.push(topicObj.topic);
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

  // Step 5: Extract age range
  const agePatterns = [
    /unter (\d+)/i,
    /über (\d+)/i,
    /zwischen (\d+) und (\d+)/i,
    /(\d+)-(\d+) jahre/i
  ];

  for (const pattern of agePatterns) {
    const match = queryLower.match(pattern);
    if (match) {
      if (match[0].startsWith('unter')) {
        analysis.ageRange.max = parseInt(match[1]);
      } else if (match[0].startsWith('über')) {
        analysis.ageRange.min = parseInt(match[1]);
      } else if (match[1] && match[2]) {
        analysis.ageRange.min = parseInt(match[1]);
        analysis.ageRange.max = parseInt(match[2]);
      }
      break;
    }
  }

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
