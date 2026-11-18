// Edge-compatible checks for the browser's HTTP Basic login.
function basicCredentials(authorization: string | null): string | null {
  if (!authorization || authorization.length > 2048) return null;
  const match = authorization.match(/^Basic ([A-Za-z0-9+/]+={0,2})$/i);
  if (!match) return null;
  try { return atob(match[1]); } catch { return null; }
}

const digest = async (value: string) => new Uint8Array(
  await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
);

function equalDigests(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
  return difference === 0;
}

export async function authorizeCollabDemo(authorization: string | null, password = process.env.COLLAB_DEMO_PASSWORD): Promise<boolean> {
  const supplied = basicCredentials(authorization);
  if (!password || password.length < 20 || !supplied) return false;
  const [actual, expected] = await Promise.all([digest(supplied), digest(`ugc-vz:${password}`)]);
  return equalDigests(actual, expected);
}

export async function directoryRole(authorization: string | null): Promise<'admin' | 'reader' | null> {
  if (await authorizeCollabDemo(authorization, process.env.COLLAB_ADMIN_PASSWORD || '')) return 'admin';
  const hash = process.env.CREATOR_DIRECTORY_READER_HASH;
  const supplied = basicCredentials(authorization);
  if (!supplied || !hash || !/^[a-f0-9]{64}$/i.test(hash)) return null;
  const expected = Uint8Array.from(hash.match(/../g)!, byte => parseInt(byte, 16));
  return equalDigests(await digest(supplied), expected) ? 'reader' : null;
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
