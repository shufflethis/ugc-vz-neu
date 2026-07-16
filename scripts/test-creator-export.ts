const fail = (message: string): never => {
  throw new Error(message);
};

const main = async () => {
  process.env.SHEET_EXPORT_TOKEN = 'local-export-test-token';

  const { GET } = await import('../app/api/creators/export.csv/route');

  const unauthorized = await GET(
    new Request('https://ugc-vz.de/api/creators/export.csv?token=wrong'),
  );

  if (unauthorized.status !== 401) {
    fail(`Expected an invalid token to return 401, received ${unauthorized.status}.`);
  }

  const authorized = await GET(
    new Request('https://ugc-vz.de/api/creators/export.csv?token=local-export-test-token'),
  );

  if (authorized.status !== 200) {
    fail(`Expected a valid token to return 200, received ${authorized.status}.`);
  }

  if (!authorized.headers.get('content-type')?.includes('text/csv')) {
    fail('Expected a CSV content type.');
  }

  if (!authorized.headers.get('x-robots-tag')?.includes('noindex')) {
    fail('Expected the export to be excluded from search indexing.');
  }

  const csv = await authorized.text();
  const header = csv.replace(/^\uFEFF/, '').split('\r\n', 1)[0];
  const expectedHeader = [
    'UGC-ID',
    'Name',
    'Künstlername',
    'Geburtsjahr',
    'Geschlecht',
    'Stadt / Region',
    'Themen',
    'Branchen',
    'Content-Formate',
    'Preisvorstellung',
    'Reichweite',
    'Netzwerke',
    'Social-Links',
    'Portfolio',
    'Besondere Merkmale',
    'Erfahrung seit',
    'Profilqualität',
  ].map(value => `"${value}"`).join(',');

  if (header !== expectedHeader) fail('The public export headers changed unexpectedly.');

  const forbiddenHeaderTerms = ['email', 'e-mail', 'telefon', 'consent', 'einwilligung', 'geburtsdatum'];
  if (forbiddenHeaderTerms.some(term => header.toLowerCase().includes(term))) {
    fail('The public export contains a private-field header.');
  }

  const profileCount = (csv.match(/"UGC-[A-Z0-9]+",/g) || [])
    .filter(value => value !== '"UGC-ID",').length;
  if (profileCount < 400) fail(`Expected at least 400 active profiles, received ${profileCount}.`);

  if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(csv)) {
    fail('The public export appears to contain an email address.');
  }

  console.log(JSON.stringify({
    invalidTokenStatus: unauthorized.status,
    validTokenStatus: authorized.status,
    profileCount,
    privateHeaderLeak: false,
    emailLeak: false,
  }));
};

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
