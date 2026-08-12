import {
  cleanText,
  emailShell,
  extractUrls,
  getInitials,
  htmlEscape,
  htmlLines,
  platformLabel,
  socialPlatformNames,
} from './email-shell';

export type LeadKind = 'creator_match' | 'no_results' | 'general_contact';

export type LeadClientInfo = {
  name: string;
  email: string;
  company?: string;
  subject?: string;
  message: string;
  searchQuery?: string;
  noResultsQuery?: string;
  sourceUrl?: string;
  sourcePath?: string;
  submissionId?: string;
  website?: string;
};

export type InternalSocialAccount = {
  platform: string;
  handle: string;
  url: string;
  followers: number | null;
  isPrimary: boolean;
};

export type InternalCreatorDetails = {
  birthYear: number | null;
  approxAge: number | null;
  gender: string;
  city: string;
  countryCode: string;
  heightCm: number | null;
  phone: string;
  contactText: string;
  emailVerifiedAt: string | null;
  notificationsPaused: boolean;
  socialAccounts: InternalSocialAccount[];
  portfolioLinks: string;
  totalReach: number;
  industries: string;
  topics: string;
  preferredContent: string;
  equipment: string;
  experienceSince: string;
  specialTraits: string;
  skinType: string;
  petContext: string;
  childrenContext: string;
  profileQualityScore: number;
};

export type SelectedCreator = {
  id: string;
  name: string;
  reach: string;
  networks: string;
  priceRange: string;
  contactEmail?: string;
  socialLinks?: string;
  // Nur bei internen Anfragen befuellt. Die bestehenden Render-Funktionen
  // ignorieren das Feld, damit Privatdaten nicht versehentlich in Brand- oder
  // Creator-Mails landen koennen.
  internal?: InternalCreatorDetails;
};

export type DeliveryResult = {
  status: 'queued' | 'failed' | 'not_configured' | 'not_requested';
  id?: string;
  error?: string;
};

export type RenderedEmail = {
  subject: string;
  html: string;
  text: string;
};

// Interne Anfragen erkennen wir ausschliesslich an der Absenderdomain. Der
// Schutz liegt nicht in dieser Pruefung, sondern darin, dass die angereicherte
// Mail nur an genau diese Adresse zugestellt wird.
const INTERNAL_EMAIL_PATTERN = /@famefact\.com$/i;

export const isInternalRequest = (email: string) =>
  INTERNAL_EMAIL_PATTERN.test(String(email ?? '').trim().toLowerCase());

const creatorUrls = (creator: SelectedCreator) =>
  extractUrls(`${creator.socialLinks || ''}\n${creator.networks || ''}`);

const networkSummary = (creator: SelectedCreator) => {
  const source = `${creator.networks || ''} ${creator.socialLinks || ''}`;
  const labels: string[] = socialPlatformNames
    .filter(([needle]) => new RegExp(needle, 'i').test(source))
    .map(([, label]) => label);

  creatorUrls(creator).forEach((url) => labels.push(platformLabel(url)));
  const uniqueLabels = [...new Set(labels)];
  return uniqueLabels.join(' · ') || cleanText(creator.networks, 'Nicht angegeben');
};

const reachSummary = (creator: SelectedCreator) => {
  const reach = cleanText(creator.reach);
  if (!reach) return 'Keine konkrete Reichweite angegeben';
  if (!/\d/.test(reach) && reach.length > 90) return 'Keine konkrete Reichweite angegeben';
  return reach.length > 180 ? `${reach.slice(0, 177).trimEnd()}…` : reach;
};

const socialButtonsHtml = (creator: SelectedCreator) => creatorUrls(creator)
  .map((url) => `<a href="${htmlEscape(url)}" style="display:inline-block;margin:5px 6px 0 0;padding:7px 10px;border:1px solid #ddd2e5;border-radius:8px;background:#ffffff;color:#6f2fa9;font-size:12px;font-weight:800;text-decoration:none;">${htmlEscape(platformLabel(url))} öffnen</a>`)
  .join('');

const creatorCardHtml = (creator: SelectedCreator) => {
  const contactRows = [
    creator.contactEmail
      ? `<a href="mailto:${htmlEscape(creator.contactEmail)}" style="color:#6f2fa9;font-weight:700;text-decoration:none;">E-Mail: ${htmlEscape(creator.contactEmail)}</a>`
      : '',
    socialButtonsHtml(creator),
  ].filter(Boolean);

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
                    <div style="margin-top:3px;font-size:13px;line-height:19px;color:#746b7c;">Profil-ID ${htmlEscape(creator.id)}</div>
                  </td>
                  <td align="right" valign="middle" style="padding-left:10px;">
                    <span style="display:inline-block;padding:7px 10px;border-radius:999px;background:#f0e8f7;color:#6f2fa9;font-size:12px;font-weight:800;">${htmlEscape(creator.priceRange || 'Preis auf Anfrage')}</span>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
                <tr>
                  <td class="stack-cell" width="50%" valign="top" style="width:50%;padding-right:10px;">
                    <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.8px;color:#9a8fa2;">Netzwerke</div>
                    <div style="margin-top:4px;font-size:14px;line-height:20px;color:#31283a;">${htmlEscape(networkSummary(creator))}</div>
                  </td>
                  <td class="stack-cell" width="50%" valign="top" style="width:50%;padding-left:10px;">
                    <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.8px;color:#9a8fa2;">Reichweite</div>
                    <div style="margin-top:4px;font-size:14px;line-height:20px;color:#31283a;">${htmlEscape(reachSummary(creator))}</div>
                  </td>
                </tr>
              </table>
              <div style="margin-top:16px;padding:12px 14px;border-radius:10px;background:#f8f6fa;font-size:13px;line-height:20px;color:#31283a;">
                <strong>Direkter Kontakt:</strong><br />
                ${contactRows.length ? contactRows.join('<br />') : 'Keine direkte Kontaktangabe hinterlegt – antworte auf diese E-Mail, dann helfen wir weiter.'}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
};

const creatorText = (creator: SelectedCreator, index: number) => [
  `${index + 1}. ${creator.name || 'UGC Creator'}`,
  `Preis: ${creator.priceRange || 'auf Anfrage'}`,
  `Netzwerke: ${networkSummary(creator)}`,
  `Reichweite: ${reachSummary(creator)}`,
  `E-Mail: ${creator.contactEmail || 'nicht hinterlegt'}`,
  `Social: ${creatorUrls(creator).join(', ') || 'nicht hinterlegt'}`,
].join('\n');

export function renderBrandMatchEmail({
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
  const searchQuery = clientInfo.searchQuery || 'Deine ausgewählten UGC Creator';
  const managementSubject = encodeURIComponent(`UGC-Kampagne übernehmen – ${leadId}`);
  const managementBody = encodeURIComponent(`Hallo UGC VZ,\n\nbitte unterstützt uns bei der Abwicklung unserer UGC-Kampagne.\n\nLead-ID: ${leadId}\n`);
  const managementHref = `mailto:${internalEmail}?subject=${managementSubject}&body=${managementBody}`;
  const geoHref = 'https://famefact.com/geo-agentur/?utm_source=ugc-vz&utm_medium=email&utm_campaign=brand-match&utm_content=geo-audit';

  const children = `
    <tr>
      <td class="email-pad" style="padding:8px 42px 26px;">
        <p style="margin:0;font-size:17px;line-height:27px;color:#4a4052;">Hallo ${htmlEscape(clientInfo.name || '')},</p>
        <p style="margin:12px 0 0;font-size:17px;line-height:27px;color:#4a4052;">hier kommen die Kontaktdaten deiner Auswahl. Die Vermittlung über UGC VZ kostet dich <strong style="color:#21172a;">0 €</strong> – du kannst die Creator direkt ansprechen.</p>
        <div style="margin-top:20px;padding:15px 17px;border-left:4px solid #c8ff45;border-radius:8px;background:#17121f;color:#ffffff;font-size:14px;line-height:21px;">
          <strong>Deine Suche:</strong> ${htmlEscape(searchQuery)}<br />
          <span style="color:#cfc5d8;">Referenz: ${htmlEscape(leadId)}</span>
        </div>
      </td>
    </tr>
    <tr>
      <td class="email-pad" style="padding:0 42px 25px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${selectedCreators.map(creatorCardHtml).join('')}
        </table>
        <p style="margin:4px 0 0;font-size:12px;line-height:19px;color:#817688;">Die Profil-, Preis- und Reichweitenangaben wurden von den Creatorn selbst hinterlegt. Bitte Verfügbarkeit, Leistungsumfang, Nutzungsrechte und finalen Preis direkt bestätigen.</p>
      </td>
    </tr>
    <tr>
      <td class="email-pad" style="padding:6px 42px 30px;">
        <h2 style="margin:0 0 13px;font-size:22px;line-height:29px;color:#21172a;">So geht es weiter</h2>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td width="30" valign="top" style="font-weight:800;color:#8b3fca;">1.</td><td style="padding-bottom:8px;font-size:14px;line-height:21px;color:#4a4052;">Creator direkt kontaktieren und Verfügbarkeit klären.</td></tr>
          <tr><td width="30" valign="top" style="font-weight:800;color:#8b3fca;">2.</td><td style="padding-bottom:8px;font-size:14px;line-height:21px;color:#4a4052;">Briefing, Deliverables, Timing, Korrekturen und Nutzungsrechte schriftlich festhalten.</td></tr>
          <tr><td width="30" valign="top" style="font-weight:800;color:#8b3fca;">3.</td><td style="font-size:14px;line-height:21px;color:#4a4052;">Produktion starten – oder die komplette Abwicklung an uns geben.</td></tr>
        </table>
        <p style="margin:17px 0 0;"><a href="https://ugc-vz.de/brands/ugc-vertrag-vorlage?utm_source=email&amp;utm_medium=transactional&amp;utm_campaign=brand-match" style="color:#6f2fa9;font-size:14px;font-weight:800;">Kostenlose Briefing- und Vertragsvorlage ansehen →</a></p>
      </td>
    </tr>
    <tr>
      <td class="email-pad" style="padding:0 42px 24px;">
        <div style="padding:24px;border-radius:16px;background:#efe7f6;border:1px solid #dfd0eb;">
          <div style="font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#6f2fa9;">Optionaler Full Service</div>
          <h2 style="margin:7px 0 9px;font-size:22px;line-height:29px;color:#21172a;">Du willst die Kontakte – aber nicht den ganzen Overhead?</h2>
          <p style="margin:0;font-size:14px;line-height:22px;color:#4a4052;">famefact kann Auswahl, Verhandlung, Briefing, Rechteklärung, Produktion und Feedbackschleifen übernehmen – auf Wunsch inklusive Paid-Social-Aussteuerung und Community Management unter den Ads.</p>
          <p style="margin:18px 0 0;"><a href="${htmlEscape(managementHref)}" style="display:inline-block;padding:12px 18px;border-radius:9px;background:#8b3fca;color:#ffffff;text-decoration:none;font-size:14px;font-weight:800;">Kampagnen-Support anfragen</a></p>
        </div>
      </td>
    </tr>
    <tr>
      <td class="email-pad" style="padding:0 42px 36px;">
        <div style="padding:22px 24px;border-radius:16px;background:#17121f;color:#ffffff;">
          <div style="font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#c8ff45;">Zusätzlicher Wachstumskanal</div>
          <h2 style="margin:7px 0 8px;font-size:21px;line-height:28px;color:#ffffff;">Wird deine Marke in ChatGPT, Gemini und Google AI empfohlen?</h2>
          <p style="margin:0;color:#d8cfe2;font-size:14px;line-height:22px;">Mit einem GEO-Audit siehst du, ob KI-Systeme deine Marke kennen, korrekt einordnen und gegenüber Wettbewerbern empfehlen.</p>
          <p style="margin:16px 0 0;"><a href="${htmlEscape(geoHref)}" style="color:#c8ff45;font-size:14px;font-weight:800;text-decoration:none;">Kostenlose KI-Sichtbarkeits-Analyse →</a></p>
        </div>
      </td>
    </tr>`;

  const text = `Hallo ${clientInfo.name || ''},

hier sind die Kontaktdaten deiner UGC-Creator-Auswahl. Die Vermittlung über UGC VZ ist kostenlos.

Suche: ${searchQuery}
Lead-ID: ${leadId}

${selectedCreators.map(creatorText).join('\n\n')}

Bitte Verfügbarkeit, Leistungsumfang, Nutzungsrechte und finalen Preis direkt bestätigen.

Briefing- und Vertragsvorlage:
https://ugc-vz.de/brands/ugc-vertrag-vorlage

OPTIONALER KAMPAGNEN-SUPPORT
famefact kann Auswahl, Verhandlung, Briefing, Rechteklärung, Produktion, Paid-Social-Aussteuerung und Community Management übernehmen.
Antworte mit "Bitte abwickeln" oder schreibe an ${internalEmail}.

GEO / KI-SICHTBARKEIT
Kostenlose Analyse: https://famefact.com/geo-agentur/

Viele Grüße
UGC VZ`;

  return {
    subject: `${count} UGC Creator-Kontakt${count === 1 ? '' : 'e'} für dich – kostenlos | UGC VZ`,
    html: emailShell({
      preheader: `${count} ausgewählte UGC Creator mit Kontaktdaten und Preisen`,
      eyebrow: 'Dein kostenloses Matching',
      title: 'Deine Creator-Auswahl ist da',
      children,
    }),
    text,
  };
}

export function renderNoResultsEmail({
  leadId,
  clientInfo,
}: {
  leadId: string;
  clientInfo: LeadClientInfo;
}): RenderedEmail {
  const query = clientInfo.noResultsQuery || clientInfo.searchQuery || 'Nicht angegeben';
  const children = `
    <tr><td class="email-pad" style="padding:8px 42px 34px;">
      <p style="margin:0;font-size:17px;line-height:27px;color:#4a4052;">Hallo ${htmlEscape(clientInfo.name)},</p>
      <p style="margin:12px 0;font-size:17px;line-height:27px;color:#4a4052;">für deine Suche gab es noch keinen eindeutigen Treffer. Wir haben die Anfrage erhalten und können passende Alternativen manuell prüfen.</p>
      <div style="margin:20px 0;padding:17px;border-radius:12px;background:#f5f1f8;color:#31283a;font-size:14px;line-height:22px;"><strong>Suchanfrage:</strong><br />${htmlLines(query)}<br /><span style="color:#817688;">Referenz: ${htmlEscape(leadId)}</span></div>
      <p style="margin:0;font-size:14px;line-height:22px;color:#4a4052;">Antworte einfach mit Budget, Timing und gewünschten Formaten. Das Team kann dann gezielter recherchieren oder einen passenden KI-UGC-/Hybrid-Ansatz vorschlagen.</p>
    </td></tr>`;

  return {
    subject: `Wir prüfen deine UGC-Suche – ${leadId}`,
    html: emailShell({
      preheader: 'Deine UGC-Suche ist bei uns angekommen',
      eyebrow: 'Anfrage erhalten',
      title: 'Wir suchen eine passende Alternative',
      children,
    }),
    text: `Hallo ${clientInfo.name},\n\nwir haben deine UGC-Suche erhalten.\n\nSuchanfrage: ${query}\nReferenz: ${leadId}\n\nAntworte mit Budget, Timing und Formaten, wenn wir manuell unterstützen sollen.\n\nViele Grüße\nUGC VZ`,
  };
}

export function renderContactAcknowledgementEmail({
  leadId,
  clientInfo,
}: {
  leadId: string;
  clientInfo: LeadClientInfo;
}): RenderedEmail {
  const children = `
    <tr><td class="email-pad" style="padding:8px 42px 34px;">
      <p style="margin:0;font-size:17px;line-height:27px;color:#4a4052;">Hallo ${htmlEscape(clientInfo.name)},</p>
      <p style="margin:12px 0;font-size:17px;line-height:27px;color:#4a4052;">deine Nachricht ist angekommen. Wir melden uns über diese E-Mail-Adresse bei dir.</p>
      <div style="margin:20px 0;padding:17px;border-radius:12px;background:#f5f1f8;color:#31283a;font-size:14px;line-height:22px;"><strong>Thema:</strong> ${htmlEscape(clientInfo.subject || 'Allgemeine Anfrage')}<br /><span style="color:#817688;">Referenz: ${htmlEscape(leadId)}</span></div>
    </td></tr>`;

  return {
    subject: `Deine Nachricht an UGC VZ ist angekommen – ${leadId}`,
    html: emailShell({
      preheader: 'Wir haben deine Nachricht erhalten',
      eyebrow: 'Nachricht erhalten',
      title: 'Danke für deine Nachricht',
      children,
    }),
    text: `Hallo ${clientInfo.name},\n\ndeine Nachricht ist angekommen.\nThema: ${clientInfo.subject || 'Allgemeine Anfrage'}\nReferenz: ${leadId}\n\nViele Grüße\nUGC VZ`,
  };
}

export function renderInternalLeadEmail({
  leadId,
  kind,
  clientInfo,
  selectedCreators,
  brandDelivery,
}: {
  leadId: string;
  kind: LeadKind;
  clientInfo: LeadClientInfo;
  selectedCreators: SelectedCreator[];
  brandDelivery: DeliveryResult;
}): RenderedEmail {
  const kindLabel = kind === 'creator_match'
    ? 'Brand Lead'
    : kind === 'no_results'
      ? 'No-Results Lead'
      : 'Kontaktanfrage';
  const statusLabel = brandDelivery.status === 'queued'
    ? 'Von Resend angenommen'
    : brandDelivery.status === 'failed'
      ? 'FEHLGESCHLAGEN'
      : brandDelivery.status === 'not_configured'
        ? 'Resend nicht konfiguriert'
        : 'Nicht angefordert';
  const statusColor = brandDelivery.status === 'queued' ? '#176b3a' : '#a12727';
  const query = clientInfo.searchQuery || clientInfo.noResultsQuery || clientInfo.subject || 'Nicht angegeben';
  const creatorRows = selectedCreators.length
    ? selectedCreators.map((creator) => `<li style="margin-bottom:12px;"><strong>${htmlEscape(creator.name)}</strong> · ${htmlEscape(creator.priceRange || 'Preis offen')}<br />${htmlEscape(networkSummary(creator))} · ${htmlEscape(reachSummary(creator))}<br />${creator.contactEmail ? htmlEscape(creator.contactEmail) : 'keine E-Mail'}${creatorUrls(creator).length ? `<br />${socialButtonsHtml(creator)}` : ''}</li>`).join('')
    : '<li>Keine Creator ausgewählt.</li>';

  const children = `
    <tr><td class="email-pad" style="padding:8px 42px 34px;">
      <div style="padding:14px 16px;border-radius:10px;background:#f5f1f8;font-size:14px;line-height:22px;color:#31283a;">
        <strong>Brand-Mail:</strong> <span style="color:${statusColor};font-weight:800;">${htmlEscape(statusLabel)}</span><br />
        ${brandDelivery.id ? `<strong>Resend-ID:</strong> ${htmlEscape(brandDelivery.id)}<br />` : ''}
        ${brandDelivery.error ? `<strong>Fehler:</strong> ${htmlEscape(brandDelivery.error)}<br />` : ''}
        <strong>Lead-ID:</strong> ${htmlEscape(leadId)}
      </div>
      <h2 style="margin:24px 0 8px;font-size:19px;">Kontakt</h2>
      <p style="margin:0;font-size:14px;line-height:22px;">${htmlEscape(clientInfo.name)}${clientInfo.company ? ` · ${htmlEscape(clientInfo.company)}` : ''}<br /><a href="mailto:${htmlEscape(clientInfo.email)}">${htmlEscape(clientInfo.email)}</a><br />Quelle: ${htmlEscape(clientInfo.sourceUrl || 'Nicht angegeben')}</p>
      <h2 style="margin:24px 0 8px;font-size:19px;">Anfrage</h2>
      <p style="margin:0;font-size:14px;line-height:22px;"><strong>Suche/Thema:</strong> ${htmlLines(query)}<br /><strong>Nachricht:</strong><br />${htmlLines(clientInfo.message, 'Keine Nachricht')}</p>
      <h2 style="margin:24px 0 8px;font-size:19px;">Creator</h2>
      <ol style="padding-left:20px;font-size:14px;line-height:21px;">${creatorRows}</ol>
      <p style="margin:20px 0 0;font-size:13px;line-height:20px;color:#746b7c;">Bei Status „Von Resend angenommen“ wurde die Nachricht in die Versandqueue übernommen. Der Resend-Webhook meldet Zustellung oder Bounce separat in Slack.</p>
    </td></tr>`;

  const text = `${kindLabel} ${leadId}

Brand-Mail: ${statusLabel}${brandDelivery.id ? ` (${brandDelivery.id})` : ''}${brandDelivery.error ? `\nFehler: ${brandDelivery.error}` : ''}

Kontakt: ${clientInfo.name}${clientInfo.company ? ` / ${clientInfo.company}` : ''} <${clientInfo.email}>
Quelle: ${clientInfo.sourceUrl || 'Nicht angegeben'}
Suche/Thema: ${query}
Nachricht: ${clientInfo.message || 'Keine Nachricht'}

${selectedCreators.map(creatorText).join('\n\n') || 'Keine Creator ausgewählt.'}`;

  return {
    subject: `[UGC VZ] ${kindLabel} ${leadId} · Brand-Mail ${statusLabel}`,
    html: emailShell({
      preheader: `${kindLabel} ${leadId}: ${statusLabel}`,
      eyebrow: kindLabel,
      title: `Neue Anfrage ${leadId}`,
      children,
      footerNote: 'Interne UGC-VZ-Statusmeldung zum automatisierten Lead- und E-Mail-Versand.',
    }),
    text,
  };
}

export function renderCreatorOutreachEmail({
  leadId,
  creator,
  clientInfo,
  internalEmail,
}: {
  leadId: string;
  creator: SelectedCreator;
  clientInfo: LeadClientInfo;
  internalEmail: string;
}): RenderedEmail {
  const query = clientInfo.searchQuery || 'UGC-Projekt';
  const requester = clientInfo.company || clientInfo.name || 'eine Brand';
  const replySubject = encodeURIComponent(`UGC-Anfrage ${leadId} – Verfügbarkeit`);
  const replyBody = encodeURIComponent(`Hallo ${clientInfo.name || ''},\n\nvielen Dank für deine Anfrage über UGC VZ.\n\nVerfügbarkeit: \nPreis / Leistungsumfang: \nRückfragen: \n\nViele Grüße\n${creator.name}`);
  const replyHref = `mailto:${clientInfo.email}?subject=${replySubject}&body=${replyBody}`;
  const updateSubject = encodeURIComponent(`UGC-VZ-Profil aktualisieren – ${creator.id}`);
  const updateBody = encodeURIComponent(`Hallo UGC VZ,\n\nbitte aktualisiert mein Creator-Profil.\n\nProfil-ID: ${creator.id}\nAktuelle Social-Links: \nAktuelle Preisvorstellung: \nAktuelle Reichweite: \nWeitere Änderungen: \n`);
  const updateHref = `mailto:${internalEmail}?subject=${updateSubject}&body=${updateBody}`;
  const pauseSubject = encodeURIComponent(`Creator-Benachrichtigungen pausieren – ${creator.id}`);
  const pauseHref = `mailto:${internalEmail}?subject=${pauseSubject}`;
  const referralHref = 'https://ugc-vz.de/creator?utm_source=creator-selection-email&utm_medium=email&utm_campaign=creator-referral';
  const children = `
    <tr><td class="email-pad" style="padding:8px 42px 22px;">
      <p style="margin:0;font-size:17px;line-height:27px;color:#4a4052;">Hallo ${htmlEscape(creator.name)},</p>
      <p style="margin:12px 0 0;font-size:17px;line-height:27px;color:#4a4052;"><strong style="color:#21172a;">${htmlEscape(requester)}</strong> hat dein Profil für eine konkrete UGC-Anfrage ausgewählt. Das ist noch keine Buchung – aber ein echtes Interessenssignal.</p>
      <div style="margin:20px 0 0;padding:18px;border-left:4px solid #c8ff45;border-radius:10px;background:#17121f;color:#ffffff;font-size:14px;line-height:22px;">
        <div style="font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#c8ff45;">Projektanfrage</div>
        <div style="margin-top:8px;"><strong>Gesucht:</strong> ${htmlLines(query)}</div>
        ${clientInfo.message ? `<div style="margin-top:8px;color:#d8cfe2;"><strong style="color:#ffffff;">Briefing:</strong> ${htmlLines(clientInfo.message)}</div>` : ''}
        <div style="margin-top:8px;color:#a99eb2;font-size:12px;">Referenz: ${htmlEscape(leadId)}</div>
      </div>
      <div style="margin:18px 0;padding:15px 17px;border-radius:12px;background:#f5f1f8;color:#31283a;font-size:14px;line-height:22px;">
        <strong>Deine Angaben bei UGC VZ</strong><br />
        Preis: ${htmlEscape(creator.priceRange || 'noch nicht hinterlegt')}<br />
        Netzwerke: ${htmlEscape(networkSummary(creator))}<br />
        Reichweite: ${htmlEscape(reachSummary(creator))}
      </div>
      <p style="margin:0;font-size:14px;line-height:22px;color:#4a4052;">Wenn das Projekt passt, sende der Brand direkt deine Verfügbarkeit, deinen aktuellen Preis und den vorgesehenen Leistungsumfang.</p>
      <p style="margin:18px 0 0;"><a href="${htmlEscape(replyHref)}" style="display:inline-block;padding:13px 18px;border-radius:9px;background:#8b3fca;color:#ffffff;text-decoration:none;font-size:14px;font-weight:800;">Interesse &amp; Verfügbarkeit senden</a></p>
      <p style="margin:10px 0 0;font-size:12px;line-height:19px;color:#817688;">Deine Antwort geht direkt an die anfragende Person. UGC VZ verlangt keine Vermittlungsgebühr oder Provision.</p>
    </td></tr>
    <tr><td class="email-pad" style="padding:0 42px 24px;">
      <div style="padding:20px;border-radius:14px;border:1px solid #e5dbea;background:#ffffff;">
        <div style="font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#6f2fa9;">Mehr passende Anfragen bekommen</div>
        <h2 style="margin:7px 0 8px;font-size:20px;line-height:27px;color:#21172a;">Sind Preis, Portfolio und Social-Links noch aktuell?</h2>
        <p style="margin:0;font-size:14px;line-height:22px;color:#4a4052;">Aktuelle Angaben helfen Brands bei einer schnellen Entscheidung. Schick uns Änderungen kurz per E-Mail – dein Profil bleibt kostenlos.</p>
        <p style="margin:14px 0 0;"><a href="${htmlEscape(updateHref)}" style="color:#6f2fa9;font-size:14px;font-weight:800;text-decoration:none;">Profilangaben aktualisieren →</a></p>
      </div>
    </td></tr>
    <tr><td class="email-pad" style="padding:0 42px 34px;">
      <p style="margin:0;font-size:13px;line-height:21px;color:#746b7c;"><strong>Kennst du weitere gute UGC Creator?</strong> UGC VZ ist auch für sie kostenlos. Du kannst ihnen diesen Link selbst weitergeben: <a href="${referralHref}" style="color:#6f2fa9;">ugc-vz.de/creator</a>.</p>
      <p style="margin:12px 0 0;font-size:12px;line-height:19px;color:#9a8fa2;">Du möchtest solche Auswahlbenachrichtigungen nicht mehr erhalten? <a href="${htmlEscape(pauseHref)}" style="color:#746b7c;">Benachrichtigungen pausieren</a>.</p>
    </td></tr>`;

  return {
    subject: `Dein UGC-Profil wurde ausgewählt – ${leadId}`,
    html: emailShell({
      preheader: `${requester} interessiert sich für dein UGC-Profil`,
      eyebrow: 'Neue Brand-Anfrage',
      title: 'Eine Brand interessiert sich für dein Profil',
      children,
      footerNote: 'Diese projektbezogene E-Mail erhältst du, weil dein bei UGC VZ hinterlegtes Profil für eine konkrete Brand-Anfrage ausgewählt wurde.',
    }),
    text: `Hallo ${creator.name},\n\n${requester} hat dein Profil für eine konkrete UGC-Anfrage ausgewählt. Das ist noch keine Buchung, aber ein echtes Interessenssignal.\n\nGesucht: ${query}\nBriefing: ${clientInfo.message || 'Keine zusätzliche Nachricht'}\nReferenz: ${leadId}\n\nAntworte direkt mit Verfügbarkeit, aktuellem Preis und Leistungsumfang:\n${replyHref}\n\nDeine Angaben:\nPreis: ${creator.priceRange || 'noch nicht hinterlegt'}\nNetzwerke: ${networkSummary(creator)}\nReichweite: ${reachSummary(creator)}\n\nProfil aktualisieren:\n${updateHref}\n\nUGC VZ ist für Creator kostenlos und verlangt keine Provision.\nKennst du weitere UGC Creator? Teile selbst diesen Link: https://ugc-vz.de/creator\n\nBenachrichtigungen pausieren:\n${pauseHref}`,
  };
}
