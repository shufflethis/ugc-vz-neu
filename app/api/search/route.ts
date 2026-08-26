import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { isUsableCustomImageUrl } from '@/app/lib/social-avatar';

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

interface CreatorRecord {
  id: string;
  fields: Record<string, any>;
}

export const maxDuration = 30; // Reduced to 30 seconds for Vercel
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

let cachedNeonRecords: CreatorRecord[] | null = null;
let lastNeonFetch: number = 0;
const CACHE_DURATION = 300000; // 5 minutes cache for better performance

const BLOCKED_CREATOR_IMAGE_RECORD_IDS = new Set([
  // Cached image does not match the creator profile (Nadine).
  'recBkIwtksvVWVeaL',
]);

const getLocalCreatorImage = (recordId: string): string | null => {
  if (BLOCKED_CREATOR_IMAGE_RECORD_IDS.has(recordId)) return null;

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
    'Arbeitest du kostenlos?',
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

const normalizeGenderValue = (gender?: string) => {
  const normalized = String(gender || '').toLowerCase();
  if (normalized.includes('männ') || normalized.includes('mann') || normalized.includes('male')) return 'male';
  if (normalized.includes('weib') || normalized.includes('frau') || normalized.includes('female')) return 'female';
  return 'any';
};

const mapCreatorProfile = (record: CreatorRecord): CreatorProfile => {
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

const fetchNeonCreatorRecords = async (): Promise<CreatorRecord[]> => {
  const sql = getDatabase();
  const rows = await sql.query(`
    SELECT
      public_id, display_name, birth_year, gender, city, special_traits,
      industries, topics, preferred_content, equipment, rate_text, reach_text,
      total_reach, profile_image_url, social_links, portfolio_links, networks,
      has_social_avatar
    FROM creator_search_public
    ORDER BY profile_quality_score DESC, total_reach DESC, display_name ASC
    LIMIT 1000
  `);
  const currentYear = new Date().getFullYear();

  return rows.map((row: any) => ({
    id: String(row.public_id),
    fields: {
      'Wie heißt du?  (Vor- und Nachname)': String(row.display_name || ''),
      'Wie ist dein Geschlecht?': String(row.gender || ''),
      'In welchem Netzwerk hast du Accounts und möchtest du aktiv sein?&nbsp; ': String(row.social_links || ''),
      'Wie groß ist deine Reichweite pro Netzwerk? ': String(row.reach_text || ''),
      'Arbeitest du kostenlos?': String(row.rate_text || ''),
      'Alter': row.birth_year ? String(currentYear - Number(row.birth_year)) : '',
      'Standort': String(row.city || ''),
      'Themen': [row.topics, row.industries, row.special_traits].filter(Boolean).join(' '),
      'Content-Formate': String(row.preferred_content || ''),
      'Portfolio': String(row.portfolio_links || ''),
      'Ausrüstung': String(row.equipment || ''),
      'cached_image_url': String(row.profile_image_url || ''),
      'has_social_avatar': Boolean(row.has_social_avatar),
    },
  }));
};

const applyDeterministicQueryOverrides = (analysis: QueryAnalysis, query: string, requestId: string): QueryAnalysis => {
  const queryLower = query.toLowerCase();
  const malePattern = /\b(männer|maenner|männlich|maennlich|mann|male|herren|jungs)\b/i;
  const femalePattern = /\b(frauen|weiblich|frau|female|damen|mädchen|maedchen)\b/i;

  if (malePattern.test(queryLower)) {
    if (analysis.gender !== 'male') {
      console.log(`[${requestId}] Deterministic override: query contains explicit male keyword, overriding gender "${analysis.gender}" -> "male"`);
    }
    return { ...analysis, gender: 'male' };
  }

  if (femalePattern.test(queryLower)) {
    if (analysis.gender !== 'female') {
      console.log(`[${requestId}] Deterministic override: query contains explicit female keyword, overriding gender "${analysis.gender}" -> "female"`);
    }
    return { ...analysis, gender: 'female' };
  }

  return analysis;
};

export async function POST(req: Request) {
  const startedAt = Date.now();
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
      console.warn(`[${requestId}] Request timeout before creator lookup`);
      return NextResponse.json({
        success: false,
        error: 'Request timeout',
        message: 'Request took too long to process'
      }, { status: 504 });
    }

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

    initialAnalysis = applyDeterministicQueryOverrides(initialAnalysis, query, requestId);
    const reasoning = generateReasoning(initialAnalysis);

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

    // Neon is the only production source. Never return fabricated creators.
    const now = Date.now();
    if (!isDatabaseConfigured()) {
      console.error(`[${requestId}] Creator database is not configured`);
      return NextResponse.json({
        success: false,
        error: 'Creator database unavailable',
        message: 'Die Creator-Suche ist vorübergehend nicht verfügbar.',
      }, { status: 503 });
    }

    try {
      if (!cachedNeonRecords || now - lastNeonFetch > CACHE_DURATION) {
        cachedNeonRecords = await fetchNeonCreatorRecords();
        lastNeonFetch = now;
      }
    } catch (databaseError) {
      console.error(`[${requestId}] Neon creator search failed`, databaseError);
      return NextResponse.json({
        success: false,
        error: 'Creator database unavailable',
        message: 'Die Creator-Suche ist vorübergehend nicht verfügbar.',
      }, { status: 503 });
    }

    const searchRecords = cachedNeonRecords;
    console.log(`[${requestId}] Using ${searchRecords.length} active creator profiles from Neon`);

    // Process creators in batches with AI-based filtering
    // Dynamic batch size: 25% of total records, min 10, max 50
    const BATCH_SIZE = Math.max(10, Math.min(50, Math.ceil(searchRecords.length / 4)));
    const results = [];

    // Diagnose: wieviele aktive Profile faellt die Pipeline unterwegs weg? Ohne
    // diese Zaehler laesst sich eine Differenz zwischen DB-Bestand und
    // totalCount nur ueber Funktionslogs rekonstruieren.
    let droppedLowScore = 0;
    let droppedError = 0;

    console.log(`[${requestId}] Processing ${searchRecords.length} creators with deterministic scoring in batches of ${BATCH_SIZE}`);

    // Create a scoring function based on the query analysis
    const scoreCreator = (record: CreatorRecord): number => {
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

      const normalizedCreatorGender = normalizeGenderValue(gender);

      if (analysis.gender === 'male' && normalizedCreatorGender === 'male') {
        score += 100;
        console.log(`[${requestId}] ✓ Male match for ${fullName}`);
      } else if (analysis.gender === 'female' && normalizedCreatorGender === 'female') {
        score += 100;
        console.log(`[${requestId}] ✓ Female match for ${fullName}`);
      } else if (analysis.gender === 'any') {
        score += 50; // Neutral score for any gender when no preference
        console.log(`[${requestId}] ✓ Any gender accepted for ${fullName}`);
      } else if (analysis.gender === 'male' && normalizedCreatorGender !== 'male') {
        // Male requested but creator is not male - EXCLUDE completely
        console.log(`[${requestId}] ❌ Male requested but ${fullName} is ${gender} - EXCLUDED`);
        return 0; // Return 0 score to exclude this creator entirely
      } else if (analysis.gender === 'female' && normalizedCreatorGender !== 'female') {
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

      // 5. Age match from the canonical creator profile
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

      // 8. Quality signals from the canonical creator profile
      if (profile.portfolioText) score += 18;
      if (profile.formatsText) score += 12;
      if (profile.languages) score += 8;
      if (profile.availability) score += 6;

      return score;
    };

    // Process creators with AI scoring
    for (let i = 0; i < searchRecords.length; i += BATCH_SIZE) {
      const batch = searchRecords.slice(i, i + BATCH_SIZE);
      console.log(`[${requestId}] Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(searchRecords.length/BATCH_SIZE)}`);

      const batchResults = await Promise.all(batch.map(async (record: CreatorRecord) => {
        try {
          const profile = mapCreatorProfile(record);
          const fields = record.fields;
          const fullName = profile.fullName;

          // Score this creator based on the query analysis
          const score = scoreCreator(record);

          // If score is very low, this creator doesn't match the requirements
          if (score < 5) {
            droppedLowScore += 1;
            console.log(`[${requestId}] Skipping ${fullName} - score too low (${score})`);
            return null;
          }

          console.log(`[${requestId}] Creator ${fullName} scored ${score} points`);

          const gender = profile.gender;
          const socialLinks = profile.socialLinks;
          const firstName = profile.firstName;
          const reachText = profile.reachText;
          const totalReach = profile.totalReach;

          // Bild-Prioritaet:
          // 1. vom Creator gesetzter direkter Bildlink (keine Social-Seiten-URLs,
          //    keine ablaufenden CDN-Links aus dem Airtable-Altbestand)
          // 2. automatisch geholtes Social-Profilbild (/api/avatar/..., eigene Domain)
          // 3. lokal vorgerendertes Legacy-Bild
          // 4. Placeholder nach Geschlecht
          const cachedImageUrl = profile.imageUrl;
          const hasSocialAvatar = Boolean(fields['has_social_avatar']);
          let finalImage: string;
          let hasCustomImage: boolean;

          if (
            isUsableCustomImageUrl(cachedImageUrl) &&
            !BLOCKED_CREATOR_IMAGE_RECORD_IDS.has(record.id)
          ) {
            finalImage = cachedImageUrl;
            hasCustomImage = true;
            console.log(`[${requestId}] Using custom image for ${fullName}: ${finalImage}`);
          } else if (hasSocialAvatar) {
            finalImage = `/api/avatar/${record.id}`;
            hasCustomImage = true;
            console.log(`[${requestId}] Using social avatar for ${fullName}: ${finalImage}`);
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
              console.log(`[${requestId}] No custom/social image for ${fullName}, using placeholder: ${finalImage}`);
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
          droppedError += 1;
          console.error(`[${requestId}] Error processing creator ${record.id}:`, error);
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

    // Reach is optional for UGC production. A creator can be relevant without an audience.
    const validCreators = results.filter((creator): creator is ProcessedCreator & { score: number } => {
      return creator !== null;
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

    const genderFilteredCreators = initialAnalysis.gender === 'any'
      ? validCreators
      : validCreators.filter((creator) => normalizeGenderValue(creator.gender) === initialAnalysis.gender);

    if (initialAnalysis.gender !== 'any' && genderFilteredCreators.length < validCreators.length) {
      console.log(
        `[${requestId}] Strict gender filter removed ${validCreators.length - genderFilteredCreators.length} creators after scoring`
      );
    }

    const displayCreators = genderFilteredCreators.slice(0, 24);

    // Remove helper properties before sending (but keep gender for frontend placeholder logic)
    const finalCreators = displayCreators.map(({ hasCustomImage, totalReach, score, ...rest }) => rest);

    console.log(`[${requestId}] Returning ${finalCreators.length} creators to client after AI filtering`);

    // Include reasoning and AI analysis in the response
    return NextResponse.json({
      success: true,
      creators: finalCreators,
      totalCount: genderFilteredCreators.length,
      // Herkunft der Zahl offenlegen: poolSize ist der aktive Bestand aus
      // creator_search_public, der Rest zeigt, wo Profile verloren gehen.
      pool: {
        size: searchRecords.length,
        scored: validCreators.length,
        droppedLowScore,
        droppedError,
        droppedGenderFilter: validCreators.length - genderFilteredCreators.length,
      },
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
      processingTime: Date.now() - startedAt
    });

  } catch (error: any) {
    console.error(`[${requestId}] Search error:`, error);

    return NextResponse.json({
      success: false,
      error: 'Search failed',
      message: error.message || 'Unknown error',
      timestamp: new Date().toISOString(),
      requestId: requestId
    }, {
      status: 500
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
const OPENROUTER_ANALYSIS_MODELS = [
  'deepseek/deepseek-v4-flash',
  'tencent/hy3-preview',
  'minimax/minimax-m2.7',
];

async function analyzeQueryWithOpenRouter(query: string, requestId: string): Promise<QueryAnalysis> {
  console.log(`[${requestId}] Attempting OpenRouter AI analysis for query: "${query}"`);

  let lastError: unknown;

  for (const model of OPENROUTER_ANALYSIS_MODELS) {
    try {
    console.log(`[${requestId}] Trying OpenRouter model: ${model}`);

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
        model,
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
      lastError = error;
      console.error(`[${requestId}] OpenRouter analysis failed for ${model}:`, error);
    }
  }

  throw lastError || new Error('OpenRouter analysis failed for all models');
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
function generateReasoning(analysis: QueryAnalysis): string {
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
