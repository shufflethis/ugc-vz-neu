import axios from 'axios';
import * as cheerio from 'cheerio';

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
    
    // Use a more browser-like User-Agent
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Cache-Control': 'no-cache'
    };

    // Fetch the Instagram profile page
    const response = await axios.get(`https://www.instagram.com/${username}/`, { headers });
    
    // Use cheerio to parse the HTML
    const $ = cheerio.load(response.data);
    
    // Try to find the og:image meta tag (most reliable method)
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage) {
      console.log('Found Instagram profile image via og:image:', ogImage);
      return ogImage;
    }
    
    // Try alternative methods if og:image fails
    const scripts = $('script').toArray();
    for (const script of scripts) {
      const content = $(script).html() || '';
      
      // Look for profile_pic_url in JSON data
      if (content.includes('profile_pic_url')) {
        const match = content.match(/"profile_pic_url_hd":"([^"]+)"|"profile_pic_url":"([^"]+)"/);
        if (match) {
          const imageUrl = (match[1] || match[2]).replace(/\\u0026/g, '&').replace(/\\/g, '');
          console.log('Found Instagram profile image via JSON data:', imageUrl);
          return imageUrl;
        }
      }
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
    const response = await axios.get(`https://www.tiktok.com/@${username}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache'
      },
      timeout: 8000
    });

    const html = response.data;
    console.log('Got TikTok HTML response, searching for profile image');
    
    // Try with cheerio first (more reliable)
    const $ = cheerio.load(html);
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage) {
      console.log('Found TikTok image via og:image:', ogImage);
      return ogImage;
    }
    
    // Try multiple regex patterns as fallback
    const patterns = [
      /"avatarLarger":"([^"]+)"/,
      /"avatarMedium":"([^"]+)"/,
      /property="og:image"\s+content="([^"]+)"/
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) {
        const imageUrl = match[1].replace(/\\u002F/g, '/');
        console.log('Found TikTok image via regex:', imageUrl);
        return imageUrl;
      }
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
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    const $ = cheerio.load(response.data);
    const images = $('img').toArray();
    
    // Try each image until we find a valid one
    for (const img of images) {
      const src = $(img).attr('src');
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
    
    console.log('No valid images found for:', searchQuery);
    return null;
  } catch (error) {
    console.error('Error in Google image search:', error);
    return null;
  }
}

// In getProfileImage function
export async function getProfileImage(socialLinks: string): Promise<string> {
  const defaultImage = '/placeholder.jpg';
  
  try {
    if (!socialLinks) return defaultImage;

    const links = socialLinks.split('\n');
    
    // Add timeout to axios requests
    const axiosConfig = {
      timeout: 4000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      }
    };

    // Try TikTok with timeout
    for (const link of links) {
      if (link.toLowerCase().includes('tiktok.com')) {
        try {
          const username = await extractTikTokUsername(link);
          if (username) {
            const profilePic = await Promise.race([
              getTikTokProfilePic(username),
              new Promise<string | null>((resolve) => 
                setTimeout(() => resolve(null), 4000)
              )
            ]);
            if (profilePic) return profilePic;
          }
        } catch (error) {
          console.error('TikTok fetch error:', error);
        }
      }
    }

    // Similar timeout handling for Instagram...
    for (const link of links) {
      if (link.toLowerCase().includes('instagram.com')) {
        const username = await extractInstagramUsername(link);
        if (username) {
          const profilePic = await getInstagramProfilePic(username);
          if (profilePic) return profilePic;
        }
      }
    }

    // Try to find Instagram handle in text
    const instagramMatch = socialLinks.match(/(?:instagram|ig|insta)[^@]*@?([a-zA-Z0-9._]+)/i);
    if (instagramMatch?.[1]) {
      const username = instagramMatch[1].trim();
      console.log('Found Instagram username in text:', username);
      const profilePic = await getInstagramProfilePic(username);
      if (profilePic) return profilePic;
    }

    // Last resort: Try Google Image search with better error handling
    for (const link of links) {
      if (link.toLowerCase().includes('instagram.com')) {
        const cleanLink = link.split('?')[0];
        const googleResult = await getGoogleImageResult(cleanLink);
        if (googleResult && await validateImageUrl(googleResult)) {
          return googleResult;
        }
      }
    }

    return defaultImage;
  } catch (error) {
    console.error('Error in getProfileImage:', error);
    return defaultImage;
  }
}