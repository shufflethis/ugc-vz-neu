import axios from 'axios';
import * as cheerio from 'cheerio';
import { tiktokdl } from '@bochilteam/scraper-tiktok';
// Temporarily disable cheerio and tiktok-scraper to fix canvas dependency issue
// import * as TikTokScraper from 'tiktok-scraper';

// Array of user agents to rotate through
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];

// Get a random user agent
function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// Function to add a delay between requests
async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function extractTikTokUsername(url: string): Promise<string | null> {
  try {
    const match = url.match(/tiktok\.com\/@([^?]+)/);
    return match ? match[1] : null;
  } catch (error) {
    return null;
  }
}

async function extractInstagramUsername(url: string): Promise<string | null> {
  try {
    // Updated regex to handle query parameters
    const match = url.match(/instagram\.com\/([^/?&#]+)/);
    console.log('Instagram URL:', url);
    console.log('Extracted username:', match?.[1]);
    return match ? match[1] : null;
  } catch (error) {
    console.error('Error extracting Instagram username:', error);
    return null;
  }
}

async function getInstagramProfilePic(username: string): Promise<string | null> {
  try {
    console.log('Fetching Instagram profile for:', username);

    // Use a random browser-like User-Agent
    const headers = {
      'User-Agent': getRandomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Cache-Control': 'no-cache'
    };

    // Method 1: Direct profile page scraping
    try {
      const response = await axios.get(`https://www.instagram.com/${username}/`, {
        headers,
        timeout: 8000
      });
      const $ = cheerio.load(response.data);
      const ogImage = $('meta[property="og:image"]').attr('content');

      if (ogImage) {
        console.log('Found Instagram profile image via cheerio:', ogImage);
        return ogImage;
      }
    } catch (error) {
      console.log('Method 1 failed, trying alternative methods...');
    }

    // Method 2: Try Instagram's public API
    try {
      const apiResponse = await axios.get(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`, {
        headers: {
          ...headers,
          'x-ig-app-id': '936619743392459', // Instagram web app ID
        },
        timeout: 8000
      });

      if (apiResponse.data?.data?.user?.profile_pic_url_hd) {
        const imageUrl = apiResponse.data.data.user.profile_pic_url_hd;
        console.log('Found Instagram profile image via API:', imageUrl);
        return imageUrl;
      }

      if (apiResponse.data?.data?.user?.profile_pic_url) {
        const imageUrl = apiResponse.data.data.user.profile_pic_url;
        console.log('Found Instagram profile image via API (standard):', imageUrl);
        return imageUrl;
      }
    } catch (error) {
      console.log('Method 2 failed, trying next method...');
    }

    // Method 3: Try Instagram's GraphQL API
    try {
      const graphqlResponse = await axios.get(`https://www.instagram.com/graphql/query/?query_hash=c9100bf9110dd6361671f113dd02e7d6&variables={"username":"${username}"}`, {
        headers,
        timeout: 8000
      });

      if (graphqlResponse.data?.data?.user?.profile_pic_url_hd) {
        const imageUrl = graphqlResponse.data.data.user.profile_pic_url_hd;
        console.log('Found Instagram profile image via GraphQL:', imageUrl);
        return imageUrl;
      }
    } catch (error) {
      console.log('Method 3 failed, all direct methods exhausted');
    }

    console.log('Could not find Instagram profile image for:', username);
    return null;
  } catch (error) {
    console.error('Error fetching Instagram profile:', error);
    return null;
  }
}

async function getTikTokProfilePic(username: string): Promise<string | null> {
  try {
    console.log('Fetching TikTok profile for:', username);

    // Method 2: Direct HTML scraping with Cheerio
    try {
      const response = await axios.get(`https://www.tiktok.com/@${username}`, {
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Cache-Control': 'no-cache'
        },
        timeout: 8000
      });

      const html = response.data;
      const $ = cheerio.load(html);
      let imageUrl = $('meta[property="og:image"]').attr('content');
      if (imageUrl) {
        console.log('Found TikTok image via og:image with cheerio:', imageUrl);
        return imageUrl;
      }

      // Fallback to searching for the image in the page's JSON data
      const jsonData = $('script[id="__UNIVERSAL_DATA_FOR_REHYDRATION__"]').html();
      if (jsonData) {
        const data = JSON.parse(jsonData);
        const user = data?.['__DEFAULT_SCOPE__']?.['webapp.user-detail']?.userInfo?.user;
        if (user?.avatarLarger) {
          imageUrl = user.avatarLarger;
          console.log('Found TikTok image via JSON data with cheerio:', imageUrl);
          return imageUrl;
        }
      }
    } catch (error) {
      console.log('Direct HTML scraping method failed');
    }

    // Method 3: Try TikTok's API
    try {
      const apiResponse = await axios.get(`https://www.tiktok.com/api/user/detail/?uniqueId=${username}`, {
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Accept': 'application/json',
          'Referer': `https://www.tiktok.com/@${username}`
        },
        timeout: 8000
      });

      if (apiResponse.data?.userInfo?.user?.avatarLarger) {
        const imageUrl = apiResponse.data.userInfo.user.avatarLarger;
        console.log('Found TikTok profile image via API:', imageUrl);
        return imageUrl;
      }
    } catch (error) {
      console.log('TikTok API method failed');
    }

    console.log('Could not find TikTok profile image for:', username);
    return null;
  } catch (error) {
    console.error('Error fetching TikTok profile:', error);
    return null;
  }
}

async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await axios.head(url);
    return response.headers['content-type']?.startsWith('image/');
  } catch (error) {
    return false;
  }
}

async function getGoogleImageResult(searchQuery: string): Promise<string | null> {
  try {
    // Clean up the Instagram URL
    if (searchQuery.includes('instagram.com')) {
      searchQuery = searchQuery.split('?')[0].split('&')[0];
      console.log('Cleaned search query:', searchQuery);
    }

    const encodedQuery = encodeURIComponent(searchQuery);
    const response = await axios.get(`https://www.google.com/search?q=${encodedQuery}&tbm=isch`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache'
      },
      timeout: 8000 // Add timeout for Google search
    });

    // Use regex instead of cheerio (temporarily disabled due to canvas dependency)
    const imgMatches = response.data.match(/<img[^>]*src="([^"]*)"[^>]*>/gi);

    if (imgMatches) {
      for (const imgMatch of imgMatches) {
        const srcMatch = imgMatch.match(/src="([^"]*)"/);
        if (srcMatch && srcMatch[1]) {
          const src = srcMatch[1];
          if (src &&
              !src.startsWith('data:') &&
              !src.includes('gstatic.com') &&
              !src.includes('google.com')) {

            // Validate that the URL actually returns an image
            const isValid = await validateImageUrl(src);
            if (isValid) {
              console.log('Found and validated Google image result:', src);
              return src;
            }
          }
        }
      }
    }

    console.log('No valid images found for:', searchQuery);
    return null;
  } catch (error) {
    console.error('Error in Google image search:', error);
    return null;
  }
}

// Cache for profile images to avoid duplicate requests
const profileImageCache: Record<string, string> = {};

// Persistent cache for successful image URLs (in a real app, this would be in a database)
const successfulImageCache: Record<string, { url: string; timestamp: number; username: string }> = {};

// Cache management
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

function getCachedImage(username: string, platform: string): string | null {
  const key = `${platform}:${username}`;
  const cached = successfulImageCache[key];
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`Using cached image for ${username} on ${platform}: ${cached.url}`);
    return cached.url;
  }
  
  return null;
}

function setCachedImage(username: string, platform: string, url: string): void {
  const key = `${platform}:${username}`;
  successfulImageCache[key] = {
    url,
    timestamp: Date.now(),
    username
  };
  console.log(`Cached image for ${username} on ${platform}: ${url}`);
}

// Enhanced getProfileImage function with better error handling and gender-specific placeholders
export async function getProfileImage(socialLinks: string, gender?: string): Promise<string> {
  // Gender-specific placeholders
  const getDefaultImage = (gender?: string) => {
    if (gender?.toLowerCase() === 'female' || gender?.toLowerCase() === 'woman' || gender?.toLowerCase() === 'w') {
      return '/female-placeholder.webp';
    }
    return '/placeholder.jpg'; // Use original placeholder for male and others
  };
  
  const defaultImage = getDefaultImage(gender);

  try {
    if (!socialLinks) return defaultImage;

    const links = socialLinks.split('\n').filter(link => link.trim() !== '');

    // If we've already fetched this set of links, return from cache with 20% chance of refetching
    const cacheKey = links.sort().join('|');
    if (profileImageCache[cacheKey] && Math.random() > 0.2) {
      console.log('Using cached profile image for:', cacheKey);
      return profileImageCache[cacheKey];
    }

    // Enhanced retry mechanism with better timeout handling
    const fetchWithRetry = async (fn: () => Promise<string | null>, retries = 2, delay = 500): Promise<string | null> => {
      for (let i = 0; i < retries; i++) {
        try {
          // Set a timeout for each individual attempt
          const timeoutPromise = new Promise<null>((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 5000)
          );
          
          const result = await Promise.race([fn(), timeoutPromise]);
          if (result) {
            console.log(`Successfully fetched image on attempt ${i + 1}`);
            return result;
          }
        } catch (error) {
          console.warn(`Attempt ${i + 1} failed: ${error instanceof Error ? error.message : String(error)}`);
          if (i < retries - 1) {
            await new Promise(resolve => setTimeout(resolve, delay * (i + 1))); // Exponential backoff
          }
        }
      }
      console.log('All retry attempts failed, returning null');
      return null;
    };

    // Collect all possible profile images
    const profileImages: string[] = [];

    // Process TikTok links with caching
    const tiktokLinks = links.filter(link => link.toLowerCase().includes('tiktok.com'));
    for (const link of tiktokLinks) {
      const username = await extractTikTokUsername(link);
      if (username) {
        // Check cache first
        const cachedImage = getCachedImage(username, 'tiktok');
        if (cachedImage) {
          profileImages.push(cachedImage);
          continue;
        }
        
        try {
          const profilePic = await fetchWithRetry(() => getTikTokProfilePic(username));
          if (profilePic) {
            profileImages.push(profilePic);
            setCachedImage(username, 'tiktok', profilePic); // Cache successful result
          }
        } catch (e: any) {
          console.error(`Failed to get TikTok profile pic after retries for ${username}:`, e);
        }
      }
    }

    // Process Instagram links with caching
    const instagramLinks = links.filter(link => link.toLowerCase().includes('instagram.com'));
    for (const link of instagramLinks) {
      const username = await extractInstagramUsername(link);
      if (username) {
        // Check cache first
        const cachedImage = getCachedImage(username, 'instagram');
        if (cachedImage) {
          profileImages.push(cachedImage);
          continue;
        }
        
        try {
          const profilePic = await fetchWithRetry(() => getInstagramProfilePic(username));
          if (profilePic) {
            profileImages.push(profilePic);
            setCachedImage(username, 'instagram', profilePic); // Cache successful result
          }
        } catch (e: any) {
          console.error(`Failed to get Instagram profile pic after retries for ${username}:`, e);
        }
      }
    }

    // If we have profile images, randomly select one
    if (profileImages.length > 0) {
      const selectedImage = profileImages[Math.floor(Math.random() * profileImages.length)];
      // Cache the result
      profileImageCache[cacheKey] = selectedImage;
      return selectedImage;
    }

    // Fallback to Google Image Search if direct scraping fails
    for (const link of links) {
      if (link.toLowerCase().includes('tiktok.com') || link.toLowerCase().includes('instagram.com')) {
        try {
          const googleImage = await getGoogleImageResult(link);
          if (googleImage) {
            // Cache the result
            profileImageCache[cacheKey] = googleImage;
            return googleImage;
          }
        } catch (e: any) {
          console.error(`Failed to get Google image for ${link}:`, e);
        }
      }
    }

    return defaultImage;
  } catch (error: any) {
    console.error('Error in getProfileImage:', error);
    return defaultImage;
  }
}
