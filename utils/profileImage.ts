import axios from 'axios';

async function extractUsername(url: string): Promise<string | null> {
  try {
    const match = url.match(/(?:instagram\.com|tiktok\.com)\/(?:@)?([^/?]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

async function getInstagramProfilePic(username: string): Promise<string | null> {
  try {
    const response = await axios.get(`https://www.instagram.com/${username}/?__a=1`);
    return response.data?.graphql?.user?.profile_pic_url_hd || null;
  } catch {
    return null;
  }
}

async function getTikTokProfilePic(username: string): Promise<string | null> {
  try {
    const response = await axios.get(`https://www.tiktok.com/@${username}`);
    const html = response.data;
    const match = html.match(/property="og:image" content="([^"]+)"/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export async function getProfileImage(socialLinks: string): Promise<string> {
  const defaultImage = '/placeholder.jpg';
  
  try {
    const links = socialLinks.split('\n');
    
    for (const link of links) {
      const username = await extractUsername(link);
      if (!username) continue;

      if (link.includes('instagram.com')) {
        const pic = await getInstagramProfilePic(username);
        if (pic) return pic;
      } else if (link.includes('tiktok.com')) {
        const pic = await getTikTokProfilePic(username);
        if (pic) return pic;
      }
    }
  } catch (error) {
    console.error('Error fetching profile image:', error);
  }

  return defaultImage;
}