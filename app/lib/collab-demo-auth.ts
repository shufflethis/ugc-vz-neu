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
