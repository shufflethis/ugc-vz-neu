// Auswahl-Liste fuer MCP-Apps-Hosts (ChatGPT u. a.): rendert das Ergebnis von
// search_creators als Liste mit Checkboxen und loest die Kontaktanfrage per
// request_outreach aus. Bewusst ein einzelner HTML-String ohne Build-Schritt und
// ohne externe Ressourcen (keine Bilder/Fonts) -- so braucht es keine CSP-Freigaben.
//
// Die URI ist beim Host ein Cache-Key: bei jeder Aenderung am HTML hochzaehlen.
export const CREATOR_LIST_WIDGET_URI = 'ui://ugc-vz/creator-list-v1.html';

export const CREATOR_LIST_WIDGET_DESCRIPTION =
  'Shows the found creators as a selectable list with a contact-request form (brand name, e-mail, message). '
  + 'The user picks creators and sends the request directly in the list - do not repeat the full list as text.';

export const CREATOR_LIST_WIDGET_HTML = `
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 12px; font: 14px/1.45 system-ui, sans-serif; color: CanvasText; background: transparent; }
  h1 { font-size: 15px; margin: 0 0 8px; }
  ul { list-style: none; margin: 0 0 12px; padding: 0; }
  li { border: 1px solid color-mix(in srgb, CanvasText 18%, transparent); border-radius: 10px; margin-bottom: 6px; }
  li label { display: flex; gap: 10px; padding: 10px; cursor: pointer; }
  li input { margin-top: 3px; flex: none; }
  .name { font-weight: 600; }
  .meta, .hint { opacity: .75; font-size: 13px; }
  .links a { margin-right: 10px; font-size: 13px; }
  form { display: grid; gap: 8px; }
  form input, form textarea { width: 100%; padding: 8px; font: inherit; border-radius: 8px;
    border: 1px solid color-mix(in srgb, CanvasText 30%, transparent); background: Canvas; color: CanvasText; }
  button { padding: 10px; font: inherit; font-weight: 600; border: 0; border-radius: 8px; cursor: pointer;
    background: #6d3bd8; color: #fff; }
  button:disabled { opacity: .5; cursor: default; }
  #status { margin-top: 8px; }
  #status.error { color: #c0392b; }
</style>
<h1 id="title"></h1>
<ul id="list"></ul>
<form id="form" hidden>
  <input id="brand" required maxlength="100" autocomplete="organization">
  <input id="email" type="email" required maxlength="120" autocomplete="email">
  <textarea id="message" rows="3" maxlength="1000"></textarea>
  <button id="send" type="submit"></button>
  <div class="hint" id="note"></div>
</form>
<div id="status" role="status"></div>
<script>
(() => {
  const de = (navigator.language || '').toLowerCase().startsWith('de');
  const T = de ? {
    title: (n) => n + ' Creator gefunden – wählen Sie aus, wen Sie anfragen möchten',
    none: 'Keine Creator gefunden.',
    brand: 'Ihre Marke / Firma', email: 'Ihre E-Mail-Adresse',
    message: 'Nachricht an die Creator (optional). [Name] wird je Creator ersetzt.',
    send: (n) => n ? n + ' Creator anfragen' : 'Creator auswählen',
    note: 'Kostenlos, ohne Provision. Sie erhalten die Kontaktdaten per E-Mail; die Creator bekommen Ihre Anfrage.',
    sending: 'Anfrage wird gesendet …',
    done: (id, mail) => 'Anfrage ' + id + ' gesendet. Die Kontaktdaten kommen per E-Mail an ' + mail + '.',
    failed: 'Die Anfrage konnte nicht gesendet werden.',
    portfolio: 'Portfolio vorhanden',
  } : {
    title: (n) => n + ' creators found – pick who you want to contact',
    none: 'No creators found.',
    brand: 'Your brand / company', email: 'Your e-mail address',
    message: 'Message to the creators (optional). [Name] is replaced per creator.',
    send: (n) => n ? 'Request ' + n + ' creator' + (n > 1 ? 's' : '') : 'Select creators',
    note: 'Free, no commission. You receive the contact details by e-mail; the creators receive your request.',
    sending: 'Sending request …',
    done: (id, mail) => 'Request ' + id + ' sent. The contact details will arrive by e-mail at ' + mail + '.',
    failed: 'The request could not be sent.',
    portfolio: 'portfolio available',
  };

  const $ = (id) => document.getElementById(id);
  const pending = new Map();
  let nextId = 1;
  let data = null;

  const post = (message) => window.parent.postMessage({ jsonrpc: '2.0', ...message }, '*');
  const request = (method, params) => new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    post({ id, method, params });
  });
  const resized = () => post({
    method: 'ui/notifications/size-changed',
    params: { height: document.documentElement.scrollHeight },
  });

  const selected = () => [...document.querySelectorAll('#list input:checked')].map((box) => box.value);
  const updateButton = () => {
    const n = selected().length;
    $('send').textContent = T.send(n);
    $('send').disabled = n === 0;
  };

  function render(result) {
    if (!result || !Array.isArray(result.creators)) return;
    data = result;
    const list = $('list');
    list.textContent = '';
    for (const creator of result.creators) {
      const item = document.createElement('li');
      const label = document.createElement('label');
      const box = document.createElement('input');
      box.type = 'checkbox';
      box.value = creator.id;
      box.onchange = updateButton;
      const body = document.createElement('div');
      const name = document.createElement('div');
      name.className = 'name';
      name.textContent = creator.name || 'UGC Creator';
      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.textContent = [
        creator.city,
        creator.priceRange,
        creator.humanVerification && creator.humanVerification.level >= 1 ? T.portfolio : '',
      ].filter(Boolean).join(' · ');
      const links = document.createElement('div');
      links.className = 'links';
      for (const url of creator.networks || []) {
        if (!/^https:\\/\\//i.test(url)) continue;
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = new URL(url).hostname.replace(/^www\\./, '');
        links.append(link);
      }
      body.append(name, meta, links);
      label.append(box, body);
      item.append(label);
      list.append(item);
    }
    $('title').textContent = result.creators.length ? T.title(result.creators.length) : T.none;
    $('form').hidden = result.creators.length === 0;
    updateButton();
    resized();
  }

  $('brand').placeholder = T.brand;
  $('email').placeholder = T.email;
  $('message').placeholder = T.message;
  $('note').textContent = T.note;

  $('form').onsubmit = async (event) => {
    event.preventDefault();
    const status = $('status');
    const email = $('email').value.trim();
    status.className = '';
    status.textContent = T.sending;
    $('send').disabled = true;
    try {
      const args = {
        name: $('brand').value.trim(),
        email,
        creator_public_ids: selected(),
        search_query: String((data && data.query) || '').slice(0, 500) || undefined,
        message: $('message').value.trim() || undefined,
      };
      const result = window.openai && window.openai.callTool
        ? await window.openai.callTool('request_outreach', args)
        : await request('tools/call', { name: 'request_outreach', arguments: args });
      const text = result && result.content && result.content[0] && result.content[0].text;
      if (!result || result.isError) throw new Error(text || T.failed);
      const requestId = (result.structuredContent && result.structuredContent.requestId) || '';
      status.textContent = T.done(requestId, email);
      $('form').hidden = true;
    } catch (error) {
      status.className = 'error';
      status.textContent = String((error && error.message) || T.failed).replace(/^Fehler bei request_outreach: /, '');
      updateButton();
    }
    resized();
  };

  window.addEventListener('message', (event) => {
    if (event.source !== window.parent) return;
    const message = event.data;
    if (!message || message.jsonrpc !== '2.0') return;
    if (message.id !== undefined && pending.has(message.id)) {
      const entry = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) entry.reject(message.error); else entry.resolve(message.result);
      return;
    }
    if (message.method === 'ui/notifications/tool-result') render(message.params && message.params.structuredContent);
  });

  // ChatGPT-Kompatibilitaet: Ergebnis liegt ggf. schon in window.openai.toolOutput.
  const fromGlobals = () => render(window.openai && window.openai.toolOutput);
  window.addEventListener('openai:set_globals', fromGlobals);
  fromGlobals();

  // MCP-Apps-Handshake; der Host schickt danach tool-result.
  request('ui/initialize', {
    protocolVersion: '2026-01-26',
    appInfo: { name: 'ugc-vz-creator-list', version: '1' },
    appCapabilities: {},
  }).then(() => post({ method: 'ui/notifications/initialized' })).catch(() => {});
})();
</script>
`.trim();
