/** Public fields only; private contacts never belong in search or profile UI. */
export interface SearchCreator {
  id: string;
  name: string;
  image: string;
  reach: string;
  networks: string[];
  priceRange: string;
  gender?: string;
  city?: string;
  topics?: string;
  preferredContent?: string;
}

export interface PublicCreatorProfile {
  public_id: string;
  display_name: string;
  city: string | null;
  topics: string | null;
  preferred_content: string | null;
  equipment: string | null;
  rate_text: string | null;
  portfolio: string[];
  socials: Array<{ platform: string; url: string; handle?: string }>;
  humanVerification: { level: 0 | 1; name: string };
}

export function safePortfolioUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password
      ? url.href : null;
  } catch {
    return null;
  }
}
