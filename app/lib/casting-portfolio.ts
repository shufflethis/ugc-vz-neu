// Used with either creator_search_public (public) or creator_profiles (admin) as p.
export const portfolioForCasting = `COALESCE((
  SELECT jsonb_agg(jsonb_build_object(
    'id', f.id, 'url', f.url, 'title', f.title,
    'skateboard', f.skateboard_verified, 'capImage', f.cap_image_url
  ) ORDER BY f.sort_order, f.id)
  FROM creator_portfolio_items f WHERE f.creator_id = p.id
), '[]'::jsonb)`;
