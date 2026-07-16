export {};

const fail = (message: string): never => {
  throw new Error(message);
};

const main = async () => {
  process.env.SHEET_PRIVATE_EXPORT_TOKEN = 'local-private-export-test-token';

  const { GET } = await import('../app/api/creators/private-export.csv/route');

  const unauthorized = await GET(
    new Request('https://ugc-vz.de/api/creators/private-export.csv?token=wrong'),
  );
  if (unauthorized.status !== 401) {
    fail(`Expected an invalid token to return 401, received ${unauthorized.status}.`);
  }

  const authorized = await GET(
    new Request('https://ugc-vz.de/api/creators/private-export.csv?token=local-private-export-test-token'),
  );
  if (authorized.status !== 200) {
    fail(`Expected a valid token to return 200, received ${authorized.status}.`);
  }

  const csv = await authorized.text();
  const header = csv.replace(/^\uFEFF/, '').split('\r\n', 1)[0];
  const expectedHeader = [
    'UGC-ID',
    'Name',
    'Künstlername',
    'Geburtsjahr',
    'E-Mail',
    'Telefon',
    'Sonstiger Kontakt',
    'E-Mail verifiziert am',
    'Plattform-Einwilligung',
    'Projekt-E-Mails',
    'Newsletter',
    'Profilstatus',
    'Letzte Aktualisierung',
  ].map(value => `"${value}"`).join(',');

  if (header !== expectedHeader) fail('The internal export headers changed unexpectedly.');
  if (/(Geburtsdatum|Anschrift|Straße|Adresse)/i.test(header)) {
    fail('The internal working export contains an unnecessary high-risk field.');
  }

  const profileCount = (csv.match(/"UGC-[A-Z0-9]+",/g) || [])
    .filter(value => value !== '"UGC-ID",').length;
  if (profileCount !== 435) fail(`Expected 435 profiles, received ${profileCount}.`);

  const emailCount = (csv.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []).length;
  if (emailCount < 250) fail(`Expected at least 250 contact emails, received ${emailCount}.`);

  if (/(^|,)"[=+\-@]/m.test(csv)) {
    fail('The internal export contains a non-neutralized spreadsheet formula prefix.');
  }

  console.log(JSON.stringify({
    invalidTokenStatus: unauthorized.status,
    validTokenStatus: authorized.status,
    profileCount,
    contactEmailCountAtLeast250: true,
    highRiskHeaderLeak: false,
    formulaInjectionPrefix: false,
  }));
};

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
