import { cleanText, emailShell, getInitials, htmlEscape } from './email-shell';
import type {
  InternalCreatorDetails,
  InternalSocialAccount,
  LeadClientInfo,
  RenderedEmail,
  SelectedCreator,
} from './lead-email';

const numberFormat = new Intl.NumberFormat('de-DE');

const followerLabel = (followers: number | null) =>
  typeof followers === 'number' && followers > 0
    ? `${numberFormat.format(followers)} Follower`
    : 'Follower unbekannt';

const platformName = (platform: string) => {
  const names: Record<string, string> = {
    tiktok: 'TikTok',
    instagram: 'Instagram',
    youtube: 'YouTube',
    linkedin: 'LinkedIn',
    facebook: 'Facebook',
    pinterest: 'Pinterest',
    twitter: 'X',
    other: 'Website',
  };
  return names[platform.toLowerCase()] || platform;
};

// TikTok und Instagram zuerst: das sind die Plattformen, nach denen im
// Tagesgeschaeft entschieden wird.
const platformRank = (platform: string) => {
  const order = ['tiktok', 'instagram', 'youtube'];
  const index = order.indexOf(platform.toLowerCase());
  return index === -1 ? order.length : index;
};

const sortedAccounts = (accounts: InternalSocialAccount[]) =>
  [...accounts].sort((a, b) => {
    const byPlatform = platformRank(a.platform) - platformRank(b.platform);
    if (byPlatform !== 0) return byPlatform;
    return (b.followers || 0) - (a.followers || 0);
  });

const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

// Der Schreibpfad filtert URL-Schemata bereits; das hier ist die zweite
// Verteidigungslinie im Renderer, damit z. B. ein "javascript:"-Schema nie
// als klickbarer Link im Dossier landet.
const isSafeUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

const socialButtons = (accounts: InternalSocialAccount[]) => sortedAccounts(accounts)
  .map((account) => {
    const label = `${htmlEscape(platformName(account.platform))}${account.handle ? ` ${htmlEscape(account.handle)}` : ''} · ${htmlEscape(followerLabel(account.followers))}`;
    const style = 'display:inline-block;margin:5px 6px 0 0;padding:8px 11px;border:1px solid #ddd2e5;border-radius:8px;background:#ffffff;color:#6f2fa9;font-size:12px;font-weight:800;text-decoration:none;';
    return isSafeUrl(account.url)
      ? `<a href="${htmlEscape(account.url)}" style="${style}">${label}</a>`
      : `<span style="${style}">${label}</span>`;
  })
  .join('');

const dateLabel = (value: string | null) => {
  if (!value) return '';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleDateString('de-DE');
};

// Leere Felder werden ausgelassen. Bei rund zwanzig Feldern erzeugt
// "Nicht angegeben" mehr Scrollweg als Information.
const detailRows = (details: InternalCreatorDetails) => ([
  ['Branchen', details.industries],
  ['Themen', details.topics],
  ['Wunschformate', details.preferredContent],
  ['Equipment', details.equipment],
  ['Erfahrung seit', details.experienceSince],
  ['Besonderheiten', details.specialTraits],
  ['Hauttyp', details.skinType],
  ['Haustiere', details.petContext],
  ['Kinder', details.childrenContext],
  ['Größe', details.heightCm ? `${details.heightCm} cm` : ''],
  ['Gender', details.gender],
  ['Land', details.countryCode],
  ['Portfolio', details.portfolioLinks],
  ['Gesamtreichweite', details.totalReach ? numberFormat.format(details.totalReach) : ''],
  ['Profil-Score', `${details.profileQualityScore}/100`],
  ['E-Mail verifiziert', dateLabel(details.emailVerifiedAt)],
] as const)
  .filter(([, value]) => cleanText(value).length > 0)
  .map(([label, value]) => `<tr><td style="padding:4px 12px 4px 0;color:#817688;font-size:12px;vertical-align:top;white-space:nowrap;">${htmlEscape(label)}</td><td style="padding:4px 0;color:#31283a;font-size:13px;">${htmlEscape(cleanText(value)).replace(/\n/g, '<br />')}</td></tr>`)
  .join('');

const headline = (details: InternalCreatorDetails) => [
  details.approxAge ? `ca. ${details.approxAge} Jahre` : '',
  details.city,
].filter(Boolean).join(' · ');

const pausedBadge = (details: InternalCreatorDetails) => details.notificationsPaused
  ? '<div style="margin-top:10px;padding:9px 12px;border-radius:8px;background:#fdeaea;border:1px solid #f0c4c4;color:#a12727;font-size:12px;font-weight:800;">Benachrichtigungen pausiert – nicht automatisiert anschreiben</div>'
  : '';

const contactBlock = (creator: SelectedCreator, details: InternalCreatorDetails) => {
  const rows = [
    creator.contactEmail
      ? `<a href="mailto:${htmlEscape(creator.contactEmail)}" style="color:#6f2fa9;font-weight:700;text-decoration:none;">${htmlEscape(creator.contactEmail)}</a>`
      : '',
    details.phone
      ? `<a href="${htmlEscape(telHref(details.phone))}" style="color:#6f2fa9;font-weight:700;text-decoration:none;">${htmlEscape(details.phone)}</a>`
      : '',
    details.contactText ? htmlEscape(cleanText(details.contactText)) : '',
  ].filter(Boolean);

  return rows.length ? rows.join('<br />') : 'Keine Kontaktdaten hinterlegt';
};

const dossierCard = (creator: SelectedCreator) => {
  const details = creator.internal;
  if (!details) return '';

  const rows = detailRows(details);

  return `
    <tr>
      <td style="padding:0 0 14px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e1ed;border-radius:16px;background:#ffffff;">
          <tr>
            <td style="padding:20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="58" valign="top" style="width:58px;">
                    <div class="creator-avatar" style="width:46px;height:46px;line-height:46px;border-radius:50%;background:#8b3fca;color:#ffffff;text-align:center;font-size:15px;font-weight:800;">${getInitials(creator.name)}</div>
                  </td>
                  <td valign="middle">
                    <div style="font-size:19px;line-height:25px;font-weight:800;color:#21172a;">${htmlEscape(creator.name || 'UGC Creator')}</div>
                    <div style="margin-top:3px;font-size:13px;line-height:19px;color:#746b7c;">${htmlEscape(creator.id)}${headline(details) ? ` · ${htmlEscape(headline(details))}` : ''}</div>
                  </td>
                </tr>
              </table>
              ${pausedBadge(details)}
              <div style="margin-top:14px;">${socialButtons(details.socialAccounts) || '<span style="font-size:13px;color:#817688;">Keine Social-Accounts hinterlegt</span>'}</div>
              <div style="margin-top:14px;padding:12px 14px;border-radius:10px;background:#f8f6fa;font-size:13px;line-height:20px;color:#31283a;">
                <strong>Kontakt:</strong><br />${contactBlock(creator, details)}
              </div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;">
                <tr>
                  <td class="stack-cell" width="50%" valign="top" style="width:50%;padding-right:10px;">
                    <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.8px;color:#9a8fa2;">Preisvorstellung</div>
                    <div style="margin-top:4px;font-size:14px;line-height:20px;color:#31283a;">${htmlEscape(cleanText(creator.priceRange, 'Nicht hinterlegt')).replace(/\n/g, '<br />')}</div>
                  </td>
                  <td class="stack-cell" width="50%" valign="top" style="width:50%;padding-left:10px;">
                    <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.8px;color:#9a8fa2;">Reichweite</div>
                    <div style="margin-top:4px;font-size:14px;line-height:20px;color:#31283a;">${htmlEscape(cleanText(creator.reach, 'Nicht hinterlegt')).replace(/\n/g, '<br />')}</div>
                  </td>
                </tr>
              </table>
              ${rows ? `<div style="margin-top:16px;padding-top:14px;border-top:1px solid #eee9f2;"><div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.8px;color:#9a8fa2;margin-bottom:8px;">Alle Details</div><table role="presentation" cellpadding="0" cellspacing="0" width="100%">${rows}</table></div>` : ''}
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
};

const dossierText = (creator: SelectedCreator, index: number) => {
  const details = creator.internal;
  if (!details) return `${index + 1}. ${creator.name}`;

  return [
    `${index + 1}. ${creator.name || 'UGC Creator'} (${creator.id})`,
    details.notificationsPaused ? 'ACHTUNG: Benachrichtigungen pausiert – nicht automatisiert anschreiben' : '',
    headline(details),
    `E-Mail: ${creator.contactEmail || 'nicht hinterlegt'}`,
    `Telefon: ${details.phone || 'nicht hinterlegt'}`,
    details.contactText ? `Sonstiger Kontakt: ${cleanText(details.contactText)}` : '',
    `Preis: ${cleanText(creator.priceRange, 'nicht hinterlegt')}`,
    `Reichweite: ${cleanText(creator.reach, 'nicht hinterlegt')}`,
    ...sortedAccounts(details.socialAccounts).map((account) =>
      `${platformName(account.platform)}: ${account.url} (${followerLabel(account.followers)})`),
    details.industries ? `Branchen: ${details.industries}` : '',
    details.topics ? `Themen: ${details.topics}` : '',
    details.preferredContent ? `Wunschformate: ${details.preferredContent}` : '',
    details.equipment ? `Equipment: ${details.equipment}` : '',
    details.experienceSince ? `Erfahrung seit: ${details.experienceSince}` : '',
    details.specialTraits ? `Besonderheiten: ${details.specialTraits}` : '',
    details.portfolioLinks ? `Portfolio: ${details.portfolioLinks}` : '',
  ].filter(Boolean).join('\n');
};

export function renderInternalMatchEmail({
  leadId,
  clientInfo,
  selectedCreators,
  internalEmail,
}: {
  leadId: string;
  clientInfo: LeadClientInfo;
  selectedCreators: SelectedCreator[];
  internalEmail: string;
}): RenderedEmail {
  const count = selectedCreators.length;
  const searchQuery = cleanText(clientInfo.searchQuery, 'Keine Suchanfrage übermittelt');

  const children = `
    <tr>
      <td class="email-pad" style="padding:8px 42px 22px;">
        <p style="margin:0;font-size:16px;line-height:25px;color:#4a4052;">Hallo ${htmlEscape(clientInfo.name || 'Team')},</p>
        <p style="margin:10px 0 0;font-size:16px;line-height:25px;color:#4a4052;">hier sind die vollständigen Profildaten deiner Auswahl – inklusive Direktkontakt, damit keine zweite Recherche nötig ist.</p>
        <div style="margin-top:18px;padding:14px 16px;border-left:4px solid #c8ff45;border-radius:8px;background:#17121f;color:#ffffff;font-size:14px;line-height:21px;">
          <strong>Suche:</strong> ${htmlEscape(searchQuery)}<br />
          <span style="color:#cfc5d8;">Referenz: ${htmlEscape(leadId)}</span>
        </div>
      </td>
    </tr>
    <tr>
      <td class="email-pad" style="padding:0 42px 25px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${selectedCreators.map(dossierCard).join('')}
        </table>
        <p style="margin:4px 0 0;font-size:12px;line-height:19px;color:#817688;">Die Creator wurden zu dieser Anfrage <strong>nicht</strong> benachrichtigt. Profil-, Preis- und Reichweitenangaben stammen von den Creatorn selbst.</p>
      </td>
    </tr>`;

  const text = `Interne Creator-Dossiers – ${leadId}

Suche: ${searchQuery}

${selectedCreators.map(dossierText).join('\n\n')}

Die Creator wurden zu dieser Anfrage nicht benachrichtigt.
Rueckfragen: ${internalEmail}`;

  return {
    subject: `[INTERN] ${count} Creator-Dossier${count === 1 ? '' : 's'} – ${searchQuery.slice(0, 60)}`,
    html: emailShell({
      preheader: `${count} vollständige Creator-Profile mit Direktkontakt`,
      eyebrow: 'Interne Recherche',
      title: 'Creator-Dossiers',
      children,
      footerNote: 'Interne Auswertung aus der UGC-VZ-Creator-Datenbank. Die enthaltenen Kontaktdaten sind ausschließlich für die Projektanbahnung bestimmt und nicht zur Weitergabe an Dritte.',
    }),
    text,
  };
}
