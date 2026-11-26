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
  ['twitch', 'Twitch'],
  ['snapchat', 'Snapchat'],
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
  unsubscribeUrl,
  headerTagline = 'Creator-Kampagnen',
}: {
  preheader: string;
  eyebrow: string;
  title: string;
  children: string;
  footerNote?: string;
  unsubscribeUrl?: string;
  headerTagline?: string;
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
  <body style="margin:0;padding:0;background:#F5F7FA;color:#202124;font-family:Inter,Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${htmlEscape(preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F7FA;">
      <tr>
        <td align="center" style="padding:28px 12px;">
          <table role="presentation" width="640" cellpadding="0" cellspacing="0" class="email-wrap" style="width:640px;max-width:640px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #DCE2EA;">
            <tr>
              <td style="padding:0;font-size:0;line-height:0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="80%" style="height:4px;background:#06458F;font-size:0;line-height:0;">&nbsp;</td>
                    <td width="20%" style="height:4px;background:#F2072A;font-size:0;line-height:0;">&nbsp;</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td class="email-pad" style="padding:22px 42px;background:#ffffff;border-bottom:1px solid #DCE2EA;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align:middle;">
                      <a href="https://ugc-vz.de" style="text-decoration:none;display:inline-block;">
                        <img src="https://ugc-vz.de/brand/ugcvz-logo-header.png" alt="UGC VZ" height="32" style="display:block;height:32px;width:auto;border:0;" />
                      </a>
                    </td>
                    <td align="right" style="vertical-align:middle;">
                      <span style="display:inline-block;padding:4px 10px;border-radius:999px;background:#F5F7FA;border:1px solid #DCE2EA;font-size:11px;font-weight:700;letter-spacing:.3px;color:#06458F;">${htmlEscape(headerTagline)}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td class="email-pad" style="padding:32px 42px 12px;">
                <div style="font-size:11px;line-height:16px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;color:#D10523;">${htmlEscape(eyebrow)}</div>
                <h1 style="margin:8px 0 0;font-size:28px;line-height:34px;font-weight:800;letter-spacing:-.5px;color:#202124;">${htmlEscape(title)}</h1>
              </td>
            </tr>
            ${children}
            <tr>
              <td class="email-pad" style="padding:24px 42px 32px;border-top:1px solid #DCE2EA;background:#F5F7FA;color:#5C6470;font-size:12px;line-height:19px;">
                ${htmlEscape(footerNote || 'Diese transaktionale E-Mail erhältst du, weil über UGC VZ eine Anfrage mit deiner Adresse gestellt wurde.')}
                <div style="margin-top:12px;">
                  UGC VZ ist ein Service der <strong style="color:#202124;">track by track GmbH</strong> · Schliemannstr. 23, 10437 Berlin<br />
                  <a href="https://ugc-vz.de/impressum" style="color:#06458F;text-decoration:none;font-weight:600;">Impressum</a>
                  &nbsp;·&nbsp;<a href="https://ugc-vz.de/datenschutz" style="color:#06458F;text-decoration:none;font-weight:600;">Datenschutz</a>${unsubscribeUrl ? `&nbsp;·&nbsp;<a href="${htmlEscape(unsubscribeUrl)}" style="color:#06458F;text-decoration:none;font-weight:600;">Abmelden</a>` : ''}<br />
                  Fragen oder Missbrauch melden: <a href="mailto:hi@ugc-vz.de" style="color:#06458F;text-decoration:none;font-weight:600;">hi@ugc-vz.de</a>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
