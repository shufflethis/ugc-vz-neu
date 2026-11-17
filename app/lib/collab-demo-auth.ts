/** Shared by the Edge middleware and the server page. No public/default password. */
export async function authorizeCollabDemo(authorization: string | null, password = process.env.COLLAB_DEMO_PASSWORD): Promise<boolean> {
  if (!password || password.length < 20 || !authorization || authorization.length > 2048) return false;
  const match = authorization.match(/^Basic ([A-Za-z0-9+/]+={0,2})$/i);
  if (!match) return false;
  let supplied: string;
  try { supplied = atob(match[1]); } catch { return false; }
  const encoder = new TextEncoder();
  const [actual, expected] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(supplied)),
    crypto.subtle.digest('SHA-256', encoder.encode(`ugc-vz:${password}`)),
  ]);
  const a = new Uint8Array(actual);
  const b = new Uint8Array(expected);
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
  return difference === 0;
}

/** Authorizes /demo (new site preview) via DEMO_SITE_PASSWORD or existing COLLAB_DEMO_PASSWORD. */
export async function authorizeSiteDemo(
  authorization: string | null,
  sitePassword = process.env.DEMO_SITE_PASSWORD,
  collabPassword = process.env.COLLAB_DEMO_PASSWORD,
): Promise<boolean> {
  if (sitePassword && await authorizeCollabDemo(authorization, sitePassword)) return true;
  if (collabPassword && await authorizeCollabDemo(authorization, collabPassword)) return true;
  return false;
}
