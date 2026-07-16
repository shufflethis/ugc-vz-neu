import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { neon } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL_UNPOOLED
  || process.env.POSTGRES_URL_NON_POOLING
  || process.env.DATABASE_URL;

if (!connectionString) throw new Error('Keine Neon-Datenbankverbindung gefunden.');

const readStdin = async () => {
  if (process.stdin.isTTY) {
    return new Promise((resolve, reject) => {
      let buffer = Buffer.alloc(0);
      let expectedBytes = null;

      const onData = (chunk) => {
        buffer = Buffer.concat([buffer, Buffer.from(chunk)]);

        if (expectedBytes === null) {
          const newline = buffer.indexOf(10);
          if (newline === -1) return;
          const lengthHeader = buffer.subarray(0, newline).toString('ascii');
          expectedBytes = Number(lengthHeader);
          buffer = buffer.subarray(newline + 1);
          if (!Number.isSafeInteger(expectedBytes) || expectedBytes < 2 || expectedBytes > 5_000_000) {
            process.stdin.off('data', onData);
            reject(new Error('Ungültige Importlänge.'));
            return;
          }
        }

        if (buffer.length >= expectedBytes) {
          process.stdin.off('data', onData);
          process.stdin.pause();
          resolve(buffer.subarray(0, expectedBytes).toString('utf8'));
        }
      };

      process.stdin.on('data', onData);
      process.stdin.once('error', reject);
      process.stdin.resume();
    });
  }

  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
};

const clean = (value) => String(value ?? '')
  .replace(/&nbsp;/gi, ' ')
  .replace(/\u00a0/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const normalizedName = (value) => clean(value)
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const firstEmail = (value) => {
  const match = clean(value).toLowerCase().match(/[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+/i);
  return match?.[0] || null;
};

const firstPhone = (value) => {
  const match = clean(value).match(/(?:\+|00)?\d[\d\s()./-]{7,}\d/);
  if (!match) return null;
  const phone = match[0].replace(/\s+/g, ' ').trim();
  return phone.length <= 40 ? phone : null;
};

const canonicalUrl = (rawUrl) => {
  let candidate = clean(rawUrl).replace(/[),.;]+$/g, '');
  if (!candidate) return null;
  if (/^www\./i.test(candidate)) candidate = `https://${candidate}`;
  if (/^(?:instagram|tiktok|youtube|youtu\.be|facebook|linkedin|pinterest)\./i.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  try {
    const url = new URL(candidate);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    url.protocol = 'https:';
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, '');
    url.search = '';
    url.hash = '';
    url.pathname = url.pathname.replace(/\/+$/, '') || '/';
    return url.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
};

const extractUrls = (value) => {
  const source = clean(value);
  const matches = source.match(/(?:https?:\/\/|www\.)[^\s<>]+|(?:instagram\.com|tiktok\.com|youtube\.com|youtu\.be|facebook\.com|linkedin\.com|pinterest\.com)\/[^\s<>]+/gi) || [];
  return [...new Set(matches.map(canonicalUrl).filter(Boolean))];
};

const platformForUrl = (url) => {
  const host = new URL(url).hostname;
  if (host.includes('instagram')) return 'instagram';
  if (host.includes('tiktok')) return 'tiktok';
  if (host.includes('youtube') || host.includes('youtu.be')) return 'youtube';
  if (host.includes('facebook')) return 'facebook';
  if (host.includes('linkedin')) return 'linkedin';
  if (host.includes('pinterest')) return 'pinterest';
  return 'other';
};

const handleForUrl = (url) => {
  try {
    const segment = new URL(url).pathname.split('/').filter(Boolean)[0] || '';
    return segment.replace(/^@/, '').slice(0, 120) || null;
  } catch {
    return null;
  }
};

const parseBirthYear = (value) => {
  const match = clean(value).match(/\b(19[3-9]\d|200\d|2010)\b/);
  return match ? Number(match[1]) : null;
};

const parseHeight = (value) => {
  const source = clean(value).replace(',', '.');
  const meters = source.match(/\b([12]\.\d{1,2})\s*m?\b/);
  const centimeters = source.match(/\b(1[2-9]\d|2[0-2]\d|230)\s*(?:cm)?\b/i);
  const parsed = centimeters ? Number(centimeters[1]) : meters ? Math.round(Number(meters[1]) * 100) : null;
  return parsed && parsed >= 120 && parsed <= 230 ? parsed : null;
};

const parseReach = (value) => {
  const source = clean(value).toLowerCase();
  let total = 0;
  const matches = source.matchAll(/\b(\d{1,3}(?:[.]\d{3})+|\d+(?:[.,]\d+)?)\s*(k|tsd|mio|m)?\b/g);
  for (const match of matches) {
    let number = match[1];
    const suffix = match[2] || '';
    if (!suffix && /^\d{1,3}(?:\.\d{3})+$/.test(number)) number = number.replace(/\./g, '');
    else number = number.replace(',', '.');
    let parsed = Number(number);
    if (!Number.isFinite(parsed)) continue;
    if (suffix === 'k' || suffix === 'tsd') parsed *= 1_000;
    if (suffix === 'm' || suffix === 'mio') parsed *= 1_000_000;
    if (parsed > 0 && parsed < 100_000_000) total += Math.round(parsed);
  }
  return Math.min(total, 2_000_000_000);
};

const parseDate = (value) => {
  const raw = clean(value);
  if (!raw) return null;
  const isoish = raw.match(/^\d{4}-\d{2}-\d{2}/) ? `${raw.replace(' ', 'T')}Z` : raw;
  const parsed = new Date(isoish);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

const selectedChoice = (main, yesColumn, noColumn) => {
  const mainValue = clean(main).toLowerCase();
  const yesValue = clean(yesColumn).toLowerCase();
  const noValue = clean(noColumn).toLowerCase();
  const checked = (value) => /^(?:true|1|yes|ja|x)$/i.test(value);
  const yesColumnChecked = checked(yesValue);
  const noColumnChecked = checked(noValue);
  const hasCheckedColumn = yesColumnChecked || noColumnChecked;
  const yes = yesColumnChecked || (!hasCheckedColumn && /\bja\b/.test(mainValue));
  const no = noColumnChecked || (!hasCheckedColumn && /\bnein\b/.test(mainValue));
  return { yes, no, ambiguous: yes && no, answered: yes || no };
};

const deterministicUuid = (key) => {
  const bytes = Buffer.from(crypto.createHash('sha256').update(`ugc-vz:${key}`).digest('hex').slice(0, 32), 'hex');
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

const publicIdFor = (key) => `UGC-${crypto.createHash('sha256').update(`public:${key}`).digest('hex').slice(0, 10).toUpperCase()}`;
const fingerprint = (row) => crypto.createHash('sha256').update(JSON.stringify(row)).digest('hex');

const suspiciousName = (name) => {
  const normalized = normalizedName(name);
  return !normalized
    || normalized.length < 3
    || /^(test|testing|asdf|qwert|xxx|fake|demo|john doe|jane doe)(?:\s|$)/.test(normalized)
    || /^(.)\1{3,}$/.test(normalized.replace(/\s/g, ''));
};

const rowsToObjects = (rows) => {
  const [headers = [], ...dataRows] = Array.isArray(rows) ? rows : [];
  return dataRows.map((row, index) => ({
    rowNumber: index + 2,
    values: Object.fromEntries(headers.map((header, column) => [header, row[column] ?? ''])),
    raw: row,
  }));
};

const currentHeaders = {
  submissionId: 'Submission ID',
  respondentId: 'Respondent ID',
  submittedAt: 'Submitted at',
  name: 'Wie heißt du?  (Vor- und Nachname)',
  stageName: 'Hast du einen Künstlernamen?',
  birthDate: 'Wann ist dein Geburtstag?',
  gender: 'Wie ist dein Geschlecht?',
  height: 'Wie groß bist du? ',
  traits: 'Hast du besondere Merkmale?',
  contact: 'Wie können wir dich kontaktieren?',
  email: 'Deine Email',
  experience: 'Seit ungefähr wann bist du als UGC Creator tätig?',
  industries: 'Mit welchen Unternehmen oder in welchen Branchen hast du bisher Erfahrungen?',
  videos: 'Hast du Beispielvideos, die du teilen möchtest?',
  portfolio: 'Hast du ein Portfolio, das du teilen möchtest?',
  topics: 'Welche Interessensgebiete möchtest du abdecken?',
  skin: 'Wie würdest du deinen Hauttyp bezeichnen?',
  pets: 'Hast du Tiere (wenn ja, was für eins/welche) und beziehst du diese in deinen Content mit ein?',
  children: 'Hast du Kinder und beziehst du diese in deinen Content mit ein?',
  content: 'Welche Art von Content erstellst du am liebsten? ',
  rate: 'Arbeitest du kostenlos?',
  standout: 'Hast du ein besonderes herausstechendes Merkmal, dass vielleicht interessant sein könnte? ',
  equipment: 'Welche Ausrüstung nutzt du, um deine Inhalte zu erstellen?',
  socials: 'In welchem Netzwerk hast du Accounts und möchtest du aktiv sein?&nbsp; ',
  reach: 'Wie groß ist deine Reichweite pro Netzwerk? ',
  privacy: 'Bist du einverstanden mit der Verarbeitung und Speicherung deiner persönlichen Daten gemäß unserer&nbsp;Datenschutzrichtlinie?&nbsp;',
  privacyYes: 'Bist du einverstanden mit der Verarbeitung und Speicherung deiner persönlichen Daten gemäß unserer&nbsp;Datenschutzrichtlinie?&nbsp; (Ja)',
  privacyNo: 'Bist du einverstanden mit der Verarbeitung und Speicherung deiner persönlichen Daten gemäß unserer&nbsp;Datenschutzrichtlinie?&nbsp; (Nein)',
  newsletter: 'Möchtest du Updates oder Newsletter per Email von uns erhalten?&nbsp;',
  newsletterYes: 'Möchtest du Updates oder Newsletter per Email von uns erhalten?&nbsp; (Ja)',
  newsletterNo: 'Möchtest du Updates oder Newsletter per Email von uns erhalten?&nbsp; (Nein)',
};

const legacyHeaders = {
  name: currentHeaders.name,
  stageName: currentHeaders.stageName,
  birthDate: currentHeaders.birthDate,
  gender: currentHeaders.gender,
  height: currentHeaders.height,
  traits: currentHeaders.traits,
  experience: currentHeaders.experience,
  industries: currentHeaders.industries,
  videos: currentHeaders.videos,
  portfolio: currentHeaders.portfolio,
  topics: currentHeaders.topics,
  skin: currentHeaders.skin,
  pets: currentHeaders.pets,
  children: currentHeaders.children,
  content: currentHeaders.content,
  rate: currentHeaders.rate,
  standout: currentHeaders.standout,
  equipment: currentHeaders.equipment,
  socials: currentHeaders.socials,
  reach: currentHeaders.reach,
};

const value = (record, key) => clean(record.values[key]);
const joined = (...parts) => parts.map(clean).filter(Boolean).join('\n');

const normalizeRecord = (record, source) => {
  const headers = source === 'tally_sheet' ? currentHeaders : legacyHeaders;
  const name = value(record, headers.name);
  const socialText = value(record, headers.socials);
  const portfolioText = joined(value(record, headers.videos), value(record, headers.portfolio));
  const socials = extractUrls(socialText);
  const portfolio = extractUrls(portfolioText);
  const submittedAt = source === 'tally_sheet' ? parseDate(value(record, headers.submittedAt)) : null;
  const email = source === 'tally_sheet'
    ? firstEmail(joined(value(record, headers.email), value(record, headers.contact)))
    : null;
  const privacy = source === 'tally_sheet'
    ? selectedChoice(value(record, headers.privacy), value(record, headers.privacyYes), value(record, headers.privacyNo))
    : null;
  const newsletter = source === 'tally_sheet'
    ? selectedChoice(value(record, headers.newsletter), value(record, headers.newsletterYes), value(record, headers.newsletterNo))
    : null;
  const isSuspicious = suspiciousName(name) || Boolean(email && /@(example\.(?:com|org)|test\.|invalid$)/i.test(email));
  const consentProblem = Boolean(privacy && (!privacy.yes || privacy.no));
  const sourceRecordId = source === 'tally_sheet'
    ? value(record, headers.submissionId) || value(record, headers.respondentId) || `${record.rowNumber}`
    : `${record.rowNumber}`;
  const status = source === 'legacy_customer_sheet'
    ? (isSuspicious ? 'quarantined' : 'active')
    : (isSuspicious || consentProblem ? 'quarantined' : 'active');
  const reachText = value(record, headers.reach);

  const quality = Math.min(100,
    (name ? 15 : 0)
    + (email ? 15 : 0)
    + (socials.length ? 20 : 0)
    + (portfolio.length ? 20 : 0)
    + (value(record, headers.rate) ? 10 : 0)
    + (value(record, headers.topics) ? 10 : 0)
    + (reachText ? 10 : 0));

  return {
    source,
    sourceRow: record.rowNumber,
    sourceRecordId,
    sourceSubmittedAt: submittedAt,
    sourceFingerprint: fingerprint(record.raw),
    name,
    normalizedName: normalizedName(name),
    stageName: value(record, headers.stageName),
    birthYear: parseBirthYear(value(record, headers.birthDate)),
    gender: value(record, headers.gender),
    heightCm: parseHeight(value(record, headers.height)),
    specialTraits: joined(value(record, headers.traits), value(record, headers.standout)),
    experienceSince: value(record, headers.experience),
    industries: value(record, headers.industries),
    topics: value(record, headers.topics),
    skinType: value(record, headers.skin),
    petContext: value(record, headers.pets),
    childrenContext: value(record, headers.children),
    preferredContent: value(record, headers.content),
    equipment: value(record, headers.equipment),
    rateText: value(record, headers.rate),
    reachText,
    totalReach: parseReach(reachText),
    socials,
    portfolio,
    email,
    contactText: source === 'tally_sheet' ? value(record, headers.contact) : null,
    phone: source === 'tally_sheet' ? firstPhone(value(record, headers.contact)) : null,
    privacy,
    newsletter,
    status,
    quality,
    isSuspicious,
    consentProblem,
    submittedAt,
  };
};

if (process.stdin.isTTY) {
  spawnSync('stty', ['raw', '-echo'], { stdio: ['inherit', 'ignore', 'ignore'] });
  process.on('exit', () => spawnSync('stty', ['sane'], { stdio: ['inherit', 'ignore', 'ignore'] }));
  process.stdout.write('READY\n');
}

let payload;
try {
  payload = JSON.parse(await readStdin());
} catch {
  throw new Error('Importdaten konnten nicht gelesen werden; es wurden keine Datensätze geschrieben.');
}
const current = rowsToObjects(payload.currentRows).map((record) => normalizeRecord(record, 'tally_sheet'));
const legacy = rowsToObjects(payload.legacyRows).map((record) => normalizeRecord(record, 'legacy_customer_sheet'));

const entities = [];
const byEmail = new Map();
const bySocial = new Map();
const byNameAndBirthYear = new Map();

const registerEntityKeys = (entity) => {
  if (entity.email) byEmail.set(entity.email, entity);
  for (const url of entity.socials) bySocial.set(url, entity);
  if (entity.normalizedName && entity.birthYear) {
    byNameAndBirthYear.set(`${entity.normalizedName}:${entity.birthYear}`, entity);
  }
};

const mergeText = (preferred, fallback) => clean(preferred) || clean(fallback) || null;

const mergeRecord = (entity, record) => {
  const preferNew = record.source === 'tally_sheet'
    && (!entity.submittedAt || (record.submittedAt && record.submittedAt >= entity.submittedAt));
  const primary = preferNew ? record : entity;
  const secondary = preferNew ? entity : record;

  for (const field of [
    'name', 'normalizedName', 'stageName', 'gender', 'specialTraits', 'experienceSince',
    'industries', 'topics', 'skinType', 'petContext', 'childrenContext',
    'preferredContent', 'equipment', 'rateText', 'reachText', 'contactText', 'phone',
  ]) entity[field] = mergeText(primary[field], secondary[field]);

  entity.birthYear = primary.birthYear || secondary.birthYear || null;
  entity.heightCm = primary.heightCm || secondary.heightCm || null;
  entity.totalReach = Math.max(primary.totalReach || 0, secondary.totalReach || 0);
  entity.quality = Math.max(primary.quality || 0, secondary.quality || 0);
  entity.socials = [...new Set([...(entity.socials || []), ...record.socials])];
  entity.portfolio = [...new Set([...(entity.portfolio || []), ...record.portfolio])];
  entity.sources.push(record);
  entity.submittedAt = preferNew ? record.submittedAt : entity.submittedAt;
  if (!entity.email && record.email) entity.email = record.email;
  if (record.privacy) entity.privacy = record.privacy;
  if (record.newsletter) entity.newsletter = record.newsletter;
  if (record.source === 'tally_sheet' && record.status !== 'active') entity.status = record.status;
  else if (entity.status !== 'quarantined' && record.status === 'active') entity.status = 'active';
  registerEntityKeys(entity);
};

const addRecord = (record) => {
  let match = record.email ? byEmail.get(record.email) : null;
  if (!match) {
    const socialMatch = record.socials.map((url) => bySocial.get(url)).find(Boolean);
    if (socialMatch && (!record.email || !socialMatch.email || record.email === socialMatch.email)) match = socialMatch;
  }
  if (!match && record.normalizedName && record.birthYear) {
    match = byNameAndBirthYear.get(`${record.normalizedName}:${record.birthYear}`) || null;
  }

  if (match) {
    mergeRecord(match, record);
    return;
  }

  const entity = { ...record, sources: [record] };
  entities.push(entity);
  registerEntityKeys(entity);
};

[...current].sort((a, b) => String(a.submittedAt).localeCompare(String(b.submittedAt))).forEach(addRecord);
legacy.forEach(addRecord);

const profiles = [];
const contacts = [];
const socials = [];
const portfolioItems = [];
const consentEvents = [];
const sourceRecords = [];
const reviews = [];

for (const entity of entities) {
  const key = entity.email
    ? `email:${entity.email}`
    : entity.socials[0]
      ? `social:${entity.socials[0]}`
      : `${entity.sources[0].source}:${entity.sources[0].sourceRow}`;
  const id = deterministicUuid(key);
  const publicId = publicIdFor(key);

  profiles.push({
    id,
    public_id: publicId,
    import_key: key,
    status: entity.status,
    display_name: entity.stageName || entity.name || 'UGC Creator',
    legal_name: entity.name || null,
    stage_name: entity.stageName || null,
    birth_year: entity.birthYear,
    gender: entity.gender || null,
    height_cm: entity.heightCm,
    special_traits: entity.specialTraits || null,
    experience_since: entity.experienceSince || null,
    industries: entity.industries || null,
    topics: entity.topics || null,
    skin_type: entity.skinType || null,
    pet_context: entity.petContext || null,
    children_context: entity.childrenContext || null,
    preferred_content: entity.preferredContent || null,
    equipment: entity.equipment || null,
    rate_text: entity.rateText || null,
    reach_text: entity.reachText || null,
    total_reach: entity.totalReach || 0,
    profile_quality_score: entity.quality || 0,
    source_priority: entity.sources.some((source) => source.source === 'tally_sheet') ? 20 : 10,
    submitted_at: entity.submittedAt,
  });

  if (entity.email || entity.phone || entity.contactText) {
    contacts.push({
      creator_id: id,
      email: entity.email,
      phone: entity.phone,
      contact_text: entity.contactText,
      project_notifications_enabled: false,
      newsletter_enabled: Boolean(entity.newsletter?.yes && !entity.newsletter?.no),
    });
  }

  entity.socials.forEach((url, index) => socials.push({
    creator_id: id,
    platform: platformForUrl(url),
    handle: handleForUrl(url),
    url,
    is_primary: index === 0,
    source: 'sheet_import',
  }));

  entity.portfolio.forEach((url, index) => portfolioItems.push({
    creator_id: id,
    kind: index === 0 ? 'portfolio' : 'work_sample',
    url,
    sort_order: index,
    source: 'sheet_import',
  }));

  for (const sourceRecord of entity.sources) {
    const importStatus = sourceRecord.status === 'quarantined'
      ? 'quarantined'
      : entity.sources.length > 1 ? 'merged' : 'imported';
    sourceRecords.push({
      creator_id: id,
      source: sourceRecord.source,
      source_row: sourceRecord.sourceRow,
      source_record_id: sourceRecord.sourceRecordId,
      source_submitted_at: sourceRecord.sourceSubmittedAt,
      source_fingerprint: sourceRecord.sourceFingerprint,
      import_status: importStatus,
    });

    const occurredAt = sourceRecord.sourceSubmittedAt || new Date().toISOString();
    if (sourceRecord.privacy?.answered && !sourceRecord.privacy.ambiguous) {
      consentEvents.push({
        creator_id: id,
        purpose: 'platform',
        granted: sourceRecord.privacy.yes && !sourceRecord.privacy.no,
        text_version: 'tally-privacy-before-2026-07-16',
        source: sourceRecord.source,
        source_reference: sourceRecord.sourceRecordId,
        occurred_at: occurredAt,
      });
    }
    if (sourceRecord.newsletter?.answered && !sourceRecord.newsletter.ambiguous) {
      consentEvents.push({
        creator_id: id,
        purpose: 'newsletter',
        granted: sourceRecord.newsletter.yes && !sourceRecord.newsletter.no,
        text_version: 'tally-newsletter-before-2026-07-16',
        source: sourceRecord.source,
        source_reference: sourceRecord.sourceRecordId,
        occurred_at: occurredAt,
      });
    }

    if (sourceRecord.isSuspicious) reviews.push({
      creator_id: id,
      source: sourceRecord.source,
      source_row: sourceRecord.sourceRow,
      issue_type: 'suspicious_or_test_record',
      details: { reason: 'Automatische Plausibilitätsprüfung; manuell prüfen.' },
    });
    if (sourceRecord.privacy?.ambiguous) reviews.push({
      creator_id: id,
      source: sourceRecord.source,
      source_row: sourceRecord.sourceRow,
      issue_type: 'ambiguous_platform_consent',
      details: { reason: 'Ja und Nein wurden gleichzeitig gewählt.' },
    });
    if (sourceRecord.newsletter?.ambiguous) reviews.push({
      creator_id: id,
      source: sourceRecord.source,
      source_row: sourceRecord.sourceRow,
      issue_type: 'ambiguous_newsletter_consent',
      details: { reason: 'Ja und Nein wurden gleichzeitig gewählt.' },
    });
  }
}

const sql = neon(connectionString);
const [batch] = await sql.query(
  `INSERT INTO import_batches (source_label) VALUES ($1) RETURNING id`,
  ['Google Sheets creator migration 2026-07-16'],
);

await sql.query(`
  INSERT INTO creator_profiles (
    id, public_id, import_key, status, display_name, legal_name, stage_name, birth_year,
    gender, height_cm, special_traits, experience_since, industries, topics, skin_type,
    pet_context, children_context, preferred_content, equipment, rate_text, reach_text,
    total_reach, profile_quality_score, source_priority, submitted_at
  )
  SELECT
    x.id, x.public_id, x.import_key, x.status, x.display_name, x.legal_name, x.stage_name,
    x.birth_year, x.gender, x.height_cm, x.special_traits, x.experience_since, x.industries,
    x.topics, x.skin_type, x.pet_context, x.children_context, x.preferred_content,
    x.equipment, x.rate_text, x.reach_text, x.total_reach, x.profile_quality_score,
    x.source_priority, x.submitted_at
  FROM jsonb_to_recordset($1::jsonb) AS x(
    id uuid, public_id text, import_key text, status text, display_name text, legal_name text,
    stage_name text, birth_year smallint, gender text, height_cm smallint, special_traits text,
    experience_since text, industries text, topics text, skin_type text, pet_context text,
    children_context text, preferred_content text, equipment text, rate_text text,
    reach_text text, total_reach integer, profile_quality_score smallint,
    source_priority smallint, submitted_at timestamptz
  )
  ON CONFLICT (id) DO UPDATE SET
    public_id = EXCLUDED.public_id,
    import_key = EXCLUDED.import_key,
    status = EXCLUDED.status,
    display_name = EXCLUDED.display_name,
    legal_name = EXCLUDED.legal_name,
    stage_name = EXCLUDED.stage_name,
    birth_year = EXCLUDED.birth_year,
    gender = EXCLUDED.gender,
    height_cm = EXCLUDED.height_cm,
    special_traits = EXCLUDED.special_traits,
    experience_since = EXCLUDED.experience_since,
    industries = EXCLUDED.industries,
    topics = EXCLUDED.topics,
    skin_type = EXCLUDED.skin_type,
    pet_context = EXCLUDED.pet_context,
    children_context = EXCLUDED.children_context,
    preferred_content = EXCLUDED.preferred_content,
    equipment = EXCLUDED.equipment,
    rate_text = EXCLUDED.rate_text,
    reach_text = EXCLUDED.reach_text,
    total_reach = EXCLUDED.total_reach,
    profile_quality_score = EXCLUDED.profile_quality_score,
    source_priority = EXCLUDED.source_priority,
    submitted_at = EXCLUDED.submitted_at,
    updated_at = now()
`, [JSON.stringify(profiles)]);

if (contacts.length) await sql.query(`
  INSERT INTO creator_private_contacts (
    creator_id, email, phone, contact_text, project_notifications_enabled, newsletter_enabled
  )
  SELECT creator_id, email, phone, contact_text, project_notifications_enabled, newsletter_enabled
  FROM jsonb_to_recordset($1::jsonb) AS x(
    creator_id uuid, email text, phone text, contact_text text,
    project_notifications_enabled boolean, newsletter_enabled boolean
  )
  ON CONFLICT (creator_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    contact_text = EXCLUDED.contact_text,
    project_notifications_enabled = EXCLUDED.project_notifications_enabled,
    newsletter_enabled = EXCLUDED.newsletter_enabled,
    updated_at = now()
`, [JSON.stringify(contacts)]);

if (socials.length) await sql.query(`
  INSERT INTO creator_social_accounts (creator_id, platform, handle, url, is_primary, source)
  SELECT creator_id, platform, handle, url, is_primary, source
  FROM jsonb_to_recordset($1::jsonb) AS x(
    creator_id uuid, platform text, handle text, url text, is_primary boolean, source text
  )
  ON CONFLICT (creator_id, url) DO UPDATE SET
    platform = EXCLUDED.platform,
    handle = EXCLUDED.handle,
    is_primary = EXCLUDED.is_primary
`, [JSON.stringify(socials)]);

if (portfolioItems.length) await sql.query(`
  INSERT INTO creator_portfolio_items (creator_id, kind, url, sort_order, source)
  SELECT creator_id, kind, url, sort_order, source
  FROM jsonb_to_recordset($1::jsonb) AS x(
    creator_id uuid, kind text, url text, sort_order smallint, source text
  )
  ON CONFLICT (creator_id, url) DO UPDATE SET
    kind = EXCLUDED.kind,
    sort_order = EXCLUDED.sort_order
`, [JSON.stringify(portfolioItems)]);

if (consentEvents.length) await sql.query(`
  INSERT INTO consent_events (
    creator_id, purpose, granted, text_version, source, source_reference, occurred_at
  )
  SELECT creator_id, purpose, granted, text_version, source, source_reference, occurred_at
  FROM jsonb_to_recordset($1::jsonb) AS x(
    creator_id uuid, purpose text, granted boolean, text_version text,
    source text, source_reference text, occurred_at timestamptz
  )
  ON CONFLICT (source, source_reference, purpose) DO UPDATE SET
    creator_id = EXCLUDED.creator_id,
    granted = EXCLUDED.granted,
    text_version = EXCLUDED.text_version,
    occurred_at = EXCLUDED.occurred_at
`, [JSON.stringify(consentEvents)]);

if (sourceRecords.length) await sql.query(`
  INSERT INTO creator_source_records (
    creator_id, import_batch_id, source, source_row, source_record_id,
    source_submitted_at, source_fingerprint, import_status
  )
  SELECT creator_id, $2::uuid, source, source_row, source_record_id,
    source_submitted_at, source_fingerprint, import_status
  FROM jsonb_to_recordset($1::jsonb) AS x(
    creator_id uuid, source text, source_row integer, source_record_id text,
    source_submitted_at timestamptz, source_fingerprint text, import_status text
  )
  ON CONFLICT (source, source_row) DO UPDATE SET
    creator_id = EXCLUDED.creator_id,
    import_batch_id = EXCLUDED.import_batch_id,
    source_record_id = EXCLUDED.source_record_id,
    source_submitted_at = EXCLUDED.source_submitted_at,
    source_fingerprint = EXCLUDED.source_fingerprint,
    import_status = EXCLUDED.import_status,
    imported_at = now()
`, [JSON.stringify(sourceRecords), batch.id]);

if (reviews.length) await sql.query(`
  INSERT INTO creator_import_review (creator_id, source, source_row, issue_type, details)
  SELECT creator_id, source, source_row, issue_type, details
  FROM jsonb_to_recordset($1::jsonb) AS x(
    creator_id uuid, source text, source_row integer, issue_type text, details jsonb
  )
  ON CONFLICT (source, source_row, issue_type) DO UPDATE SET
    creator_id = EXCLUDED.creator_id,
    details = EXCLUDED.details
`, [JSON.stringify(reviews)]);

const stats = {
  sheet_rows: current.length + legacy.length,
  current_rows: current.length,
  legacy_rows: legacy.length,
  creators: profiles.length,
  active: profiles.filter((profile) => profile.status === 'active').length,
  quarantined: profiles.filter((profile) => profile.status === 'quarantined').length,
  private_contacts: contacts.length,
  unique_emails: new Set(contacts.map((contact) => contact.email).filter(Boolean)).size,
  newsletter_opt_ins: contacts.filter((contact) => contact.newsletter_enabled).length,
  social_accounts: socials.length,
  portfolio_items: portfolioItems.length,
  consent_events: consentEvents.length,
  review_items: reviews.length,
};

await sql.query(
  `UPDATE import_batches SET completed_at = now(), stats = $2::jsonb WHERE id = $1`,
  [batch.id, JSON.stringify(stats)],
);

const [verification] = await sql.query(`
  SELECT
    count(*)::int AS creators,
    count(*) FILTER (WHERE status = 'active')::int AS active,
    count(*) FILTER (WHERE status = 'quarantined')::int AS quarantined
  FROM creator_profiles
`);

console.log(JSON.stringify({ batch_id: batch.id, imported: stats, database: verification }));
