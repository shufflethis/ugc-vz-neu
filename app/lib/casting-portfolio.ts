// Used with either creator_search_public (public) or creator_profiles (admin) as p.
export const portfolioForCasting = `COALESCE((
  SELECT jsonb_agg(jsonb_build_object(
    'id', f.id, 'url', f.url, 'title', f.title,
    'skateboard', f.skateboard_verified, 'capImage', f.cap_image_url
  ) ORDER BY f.sort_order, f.id)
  FROM creator_portfolio_items f WHERE f.creator_id = p.id
), '[]'::jsonb)`;

export const reviewedCapHash = `(
  SELECT encode(a.cap_image_sha256, 'hex') FROM creator_social_avatars a
  WHERE a.creator_id=p.id AND a.cap_image_sha256 IS NOT NULL
    AND a.cap_image_sha256=sha256(a.image)
)`;

export function reviewedCapImage(id: string, hash: string | null): string | undefined {
  return hash ? '/api/avatar/' + encodeURIComponent(id) + '?cap=' + hash : undefined;
}
