export const htmlEscape = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

export const cleanText = (value: unknown, fallback = '') => {
  const cleaned = String(value ?? '').replace(/\r\n/g, '\n').trim();
  return cleaned || fallback;
};

export const htmlLines = (value: unknown, fallback = 'Nicht angegeben') =>
  htmlEscape(cleanText(value, fallback)).replace(/\n/g, '<br />');

export const socialPlatformNames = [
  ['instagram', 'Instagram'],
  ['tiktok', 'TikTok'],
  ['youtube', 'YouTube'],
  ['linkedin', 'LinkedIn'],
  ['facebook', 'Facebook'],
  ['pinterest', 'Pinterest'],
  ['twitter', 'X'],
] as const;

export const extractUrls = (value: unknown) => {
  const matches = cleanText(value).match(/(?:https?:\/\/|www\.)[^\s<>"']+/gi) || [];
  const urls = matches.flatMap((match) => {
    const rawUrl = match.replace(/[),.;]+$/g, '');

    try {
      const parsed = new URL(/^www\./i.test(rawUrl) ? `https://${rawUrl}` : rawUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) return [];

      // Creator fields often contain share/tracking parameters. Profile links are
      // clearer and more durable without them.
      if (/instagram\.com$|tiktok\.com$|youtube\.com$|youtu\.be$|linkedin\.com$|facebook\.com$|pinterest\.|twitter\.com$|x\.com$/i.test(parsed.hostname)) {
        parsed.search = '';
        parsed.hash = '';
      } else {
        [...parsed.searchParams.keys()]
          .filter((key) => key.toLowerCase().startsWith('utm_'))
          .forEach((key) => parsed.searchParams.delete(key));
      }

      return [parsed.toString().replace(/\/$/, '')];
    } catch {
      return [];
    }
  });

  return [...new Map(urls.map((url) => [url.toLowerCase(), url])).values()];
};

export const platformLabel = (url: string) => {
  const hostname = new URL(url).hostname.toLowerCase();
  if (hostname.includes('instagram.')) return 'Instagram';
  if (hostname.includes('tiktok.')) return 'TikTok';
  if (hostname.includes('youtube.') || hostname === 'youtu.be') return 'YouTube';
  if (hostname.includes('linkedin.')) return 'LinkedIn';
  if (hostname.includes('facebook.')) return 'Facebook';
  if (hostname.includes('pinterest.')) return 'Pinterest';
  if (hostname.includes('twitter.') || hostname === 'x.com' || hostname.endsWith('.x.com')) return 'X';
  return 'Website';
};

export const getInitials = (name: string) => {
  const initials = cleanText(name, 'UGC')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
  return htmlEscape(initials || 'UGC');
};

export const emailShell = ({
  preheader,
  eyebrow,
  title,
  children,
  footerNote,
}: {
  preheader: string;
  eyebrow: string;
  title: string;
  children: string;
  footerNote?: string;
}) => `<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>${htmlEscape(title)}</title>
    <style>
      @media only screen and (max-width: 640px) {
        .email-wrap { width: 100% !important; }
        .email-pad { padding-left: 20px !important; padding-right: 20px !important; }
        .stack-cell { display: block !important; width: 100% !important; padding-right: 0 !important; padding-bottom: 10px !important; }
        .creator-avatar { width: 42px !important; height: 42px !important; line-height: 42px !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:#f5f3f9;color:#1d1725;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${htmlEscape(preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3f9;">
      <tr>
        <td align="center" style="padding:28px 12px;">
          <table role="presentation" width="640" cellpadding="0" cellspacing="0" class="email-wrap" style="width:640px;max-width:640px;background:#ffffff;border-radius:22px;overflow:hidden;box-shadow:0 12px 35px rgba(61,31,86,.10);">
            <tr>
              <td class="email-pad" style="padding:22px 42px;background:#17121f;border-bottom:4px solid #8b3fca;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-size:21px;font-weight:800;color:#ffffff;letter-spacing:-.3px;">UGC<span style="color:#c8ff45;">VZ</span></td>
                    <td align="right" style="font-size:12px;color:#d8cfe2;">Kostenlose Creator-Vermittlung</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td class="email-pad" style="padding:38px 42px 14px;">
                <div style="font-size:12px;line-height:18px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#8b3fca;">${htmlEscape(eyebrow)}</div>
                <h1 style="margin:9px 0 0;font-size:34px;line-height:41px;letter-spacing:-.8px;color:#17121f;">${htmlEscape(title)}</h1>
              </td>
            </tr>
            ${children}
            <tr>
              <td class="email-pad" style="padding:25px 42px 34px;border-top:1px solid #eee9f2;color:#746b7c;font-size:12px;line-height:19px;">
                ${htmlEscape(footerNote || 'Diese transaktionale E-Mail erhältst du, weil über UGC VZ eine Anfrage mit deiner Adresse gestellt wurde.')}<br />
                UGC VZ ist ein Angebot der track by track GmbH / <a href="https://famefact.com/?utm_source=ugc-vz&amp;utm_medium=email" style="color:#6f2fa9;text-decoration:none;">famefact</a>, Schliemannstr. 23, 10437 Berlin.<br />
                Fragen oder Missbrauch melden: <a href="mailto:hi@ugc-vz.de" style="color:#6f2fa9;">hi@ugc-vz.de</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
