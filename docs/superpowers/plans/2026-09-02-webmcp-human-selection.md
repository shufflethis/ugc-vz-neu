# WebMCP `get_human_selection` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Der Agent kann im Browser lesen, welche Creator-Cards der Mensch auf der Seite per Klick markiert hat. Damit wird der Shared Screen bidirektional: Agent → Seite (search, select) gab es, Seite → Agent (was der Mensch markiert hat) kommt dazu.

**Architecture:** Ein siebtes WebMCP-Tool `get_human_selection` (read-only, nur im Browser, nicht in der Registry) fragt per CustomEvent-Handshake die gemountete SearchBox nach `selectedCreators` aus `useSearch` und liefert die markierten Creator mit den sichtbaren Card-Daten zurück. `select_creators` bleibt additiv und meldet zusätzlich die Gesamtauswahl nach dem Merge. Keine neue UI, kein neuer State: die Klick-Markierung auf den Cards existiert bereits (`SearchBox.tsx:421-422`, `useSearch.ts:80`).

**Tech Stack:** Next.js App Router, React Client Components, CustomEvents auf `window`, `document.modelContext` / `navigator.modelContext` (W3C WebMCP Proposal), tsx-Validation-Script.

**Spec:** Kein separates Spec-Dokument. Die Anforderung stammt aus dem Gespräch vom 2026-09-02 (Devpost WebMCP Challenge, Deadline 2026-09-03 22:00 CEST). Hintergrund und Einreichungstext: `docs/WEBMCP-CHALLENGE-SUBMISSION.md`.

## Global Constraints

- Kein lokaler Build auf dem VPS (earlyoom killt `tsc`, `next build`, headless Chrome, `vercel deploy`). Verifikation ausschließlich über den Vercel-Build nach `git push`. Siehe Memory `vps-kein-lokaler-build-moeglich`.
- Deploy via `git push origin main` (Projekt ist git-verknüpft, Push startet Production-Build). Nicht `vercel --prod`.
- `request_outreach` darf im Browser NIE registriert werden. Die Assertion in `scripts/validate-agent-layer.ts:129-132` bleibt bestehen.
- Tool-Beschreibungen zweisprachig: Englisch zuerst, dann `[DE]` und Deutsch (Konvention aus Commit `bbcad1f`).
- Umlaute in Code-Kommentaren und Tool-Texten als `ae/oe/ue` schreiben (bestehende Konvention in `WebMcpProvider.tsx`).
- Tool-Zahl im Browser wird 6 → 7. Alle Stellen, die "6 Tools" nennen, müssen mitgezogen werden (Task 3), sonst widersprechen sich Video, Devpost-Text und README.
- Reihenfolge: Task 1, 2 und 3 (Doku) werden gemeinsam in EINEM Push deployt (Task 4). `app/developers/page.tsx` und `app/llms.txt/route.ts` sind Code und lösen einen Build aus; getrennte Pushes wären ein versteckter dritter Roundtrip und zeigten kurzzeitig 7 Tools im Bundle neben "6 Tools" auf /developers.
- Timebox: Maximal zwei Vercel-Roundtrips. Ist der zweite nicht grün oder der Test im ChatGPT-Browser schlägt fehl, `git revert` und mit dem 6-Tool-Stand einreichen.
- Es gibt kein Unit-Test-Framework im Repo (kein jest/vitest). Das "Test first" der Tasks 1 und 2 ist das Validation-Script; die UI-Logik wird per Vercel-Build (Typen) und Live-Test im ChatGPT-Desktop-Browser verifiziert (Task 5, nur der Mensch kann das).

---

## File Structure

| Datei | Verantwortung | Änderung |
| --- | --- | --- |
| `app/components/WebMcpProvider.tsx` | Registriert Tools auf `modelContext`, UI-Handshake via `askUi` | Neues Event-Paar, neue Konstante `WEBMCP_BROWSER_ONLY_TOOLS`, neues Tool `get_human_selection`, `select_creators`-Result erweitert |
| `app/components/SearchBox.tsx` | Such-UI, hält `creators` und `selectedCreators`, beantwortet Agent-Events | Neuer Handler `onAgentGetSelection`, `onAgentSelect` meldet `all_selected` |
| `scripts/validate-agent-layer.ts` | Statische Invarianten des Agent-Layers | Prüft Browser-only-Toolliste, Gesamtzahl 7, kein `request_outreach` |
| `README.md`, `PROTOCOLS.md`, `app/developers/page.tsx`, `app/llms.txt/route.ts`, `docs/WEBMCP-CHALLENGE-SUBMISSION.md` | Doku und Einreichungstext | Tool-Zahl und Tool-Liste, neue Demo-Szene |

---

### Task 1: Validation-Script kennt die Browser-only-Tools (failing test first)

**Files:**
- Modify: `scripts/validate-agent-layer.ts:112-135`
- Modify: `app/components/WebMcpProvider.tsx` (nur Export der Konstante)

**Interfaces:**
- Produces: `export const WEBMCP_BROWSER_ONLY_TOOLS = ['select_creators', 'get_last_outreach', 'get_human_selection'] as const;` in `WebMcpProvider.tsx`. Task 2 registriert genau diese Namen.
- Produces: `export const WEBMCP_TOOL_COUNT = 7;` in `WebMcpProvider.tsx`. Task 3 zitiert diese Zahl in der Doku.

- [ ] **Step 1: Assertions ins Validation-Script schreiben (schlagen erst fehl)**

In `scripts/validate-agent-layer.ts` den Import in Zeile 6 erweitern und nach Zeile 132 (vor `if (webmcpErrors.length)`) einfügen:

```ts
// Zeile 6 ersetzen durch:
import { WEBMCP_REGISTRY_TOOLS } from '../app/components/WebMcpAgentLayer';
import { WEBMCP_BROWSER_ONLY_TOOLS, WEBMCP_TOOL_COUNT } from '../app/components/WebMcpProvider';
```

```ts
// Nach der request_outreach-Assertion (Zeile ~132) einfuegen:
// Browser-only-Tools: existieren NICHT in der Registry (steuern die Seiten-UI
// oder lesen Browser-Session-State) und duerfen sich nicht mit ihr ueberlappen.
for (const name of WEBMCP_BROWSER_ONLY_TOOLS) {
  checkWebmcp(!registryNames.has(name), `Browser-only-Tool "${name}" kollidiert mit einem Registry-Tool`);
}
checkWebmcp(
  !(WEBMCP_BROWSER_ONLY_TOOLS as readonly string[]).includes('request_outreach'),
  'request_outreach darf auch nicht als Browser-only-Tool registriert werden',
);
checkWebmcp(
  (WEBMCP_BROWSER_ONLY_TOOLS as readonly string[]).includes('get_human_selection'),
  'get_human_selection fehlt in WEBMCP_BROWSER_ONLY_TOOLS (Mensch -> Agent Rueckkanal)',
);
checkWebmcp(
  WEBMCP_REGISTRY_TOOLS.length + WEBMCP_BROWSER_ONLY_TOOLS.length === WEBMCP_TOOL_COUNT,
  `WEBMCP_TOOL_COUNT (${WEBMCP_TOOL_COUNT}) != Registry-Teilmenge (${WEBMCP_REGISTRY_TOOLS.length}) + Browser-only (${WEBMCP_BROWSER_ONLY_TOOLS.length})`,
);
```

Und die Erfolgsmeldung in Zeile 135 anpassen:

```ts
console.log(`OK: webmcp layer (${WEBMCP_TOOL_COUNT} Tools: Registry-Teilmenge + Browser-only, ohne request_outreach)`);
```

- [ ] **Step 2: Script laufen lassen, Fehlschlag bestätigen**

Run: `cd /home/autoblogger/ugc-vz-neu && npm run validate:agent-layer 2>&1 | tail -5`
Expected: Abbruch mit TypeScript-/Import-Fehler, weil `WEBMCP_BROWSER_ONLY_TOOLS` und `WEBMCP_TOOL_COUNT` noch nicht exportiert werden. Wird der Prozess mit Exit 143 gekillt (earlyoom), diesen Step als "nicht lokal prüfbar" notieren und weitergehen; der Vercel-Build in Task 4 übernimmt die Typprüfung.

- [ ] **Step 3: Konstanten in WebMcpProvider.tsx exportieren**

In `app/components/WebMcpProvider.tsx` direkt nach dem `AGENT_UI_EVENTS`-Block (nach Zeile 34) einfügen:

```ts
// Tools, die es NUR im Browser gibt (nicht in app/lib/agent-tools.ts):
// sie steuern die Seiten-UI oder lesen Browser-Session-State. Wird von
// scripts/validate-agent-layer.ts gegen die Registry geprueft.
export const WEBMCP_BROWSER_ONLY_TOOLS = ['select_creators', 'get_last_outreach', 'get_human_selection'] as const;

// Gesamtzahl der im Browser registrierten Tools (Registry-Teilmenge aus
// WebMcpAgentLayer + Browser-only). Doku und Devpost-Text zitieren diese Zahl.
export const WEBMCP_TOOL_COUNT = 7;
```

- [ ] **Step 4: Script erneut laufen lassen**

Run: `cd /home/autoblogger/ugc-vz-neu && npm run validate:agent-layer 2>&1 | tail -5`
Expected: `OK: webmcp layer (7 Tools: ...)` neben den anderen OK-Zeilen. (Das Script prüft nur Konstanten, nicht die Registrierung selbst; die kommt in Task 2.)

- [ ] **Step 5: Commit**

```bash
cd /home/autoblogger/ugc-vz-neu
git add scripts/validate-agent-layer.ts app/components/WebMcpProvider.tsx
git commit -m "test(webmcp): Validation kennt Browser-only-Tools und erwartet 7 Tools inkl. get_human_selection

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015oJqzkYUKiJMrSJwogs6GS"
```

---

### Task 2: Tool `get_human_selection` und UI-Handshake

**Files:**
- Modify: `app/components/WebMcpProvider.tsx:28-34` (Events), `:96-108` (Beschreibungen), `:198-236` (Tools)
- Modify: `app/components/SearchBox.tsx:76-112` (Agent-Effect)

**Interfaces:**
- Consumes: `WEBMCP_BROWSER_ONLY_TOOLS` aus Task 1 (Namen müssen exakt übereinstimmen).
- Consumes: `askUi(eventName, resultName, detail, timeoutMs): Promise<Record<string, unknown>>` (bereits vorhanden, `WebMcpProvider.tsx:66-90`).
- Produces: Events `ugcvz:agent-get-selection` (Request: `{ requestId }`) und `ugcvz:agent-get-selection-result` (Response: `{ requestId, selected: SelectedCard[], visible_total: number }`), mit `SelectedCard = { id, name, reach, price_range, networks }` (gleiche Felder wie im `searchResult`-Event, `SearchBox.tsx:127-133`).
- Produces: `select_creators`-Result erhält zusätzlich `all_selected: string[]` (Gesamtauswahl nach Merge).

- [ ] **Step 1: Event-Namen ergänzen**

In `app/components/WebMcpProvider.tsx` den `AGENT_UI_EVENTS`-Block (Zeile 28-34) ersetzen:

```ts
export const AGENT_UI_EVENTS = {
  search: 'ugcvz:agent-search',
  searchResult: 'ugcvz:agent-search-result',
  select: 'ugcvz:agent-select',
  selectResult: 'ugcvz:agent-select-result',
  getSelection: 'ugcvz:agent-get-selection',
  getSelectionResult: 'ugcvz:agent-get-selection-result',
  outreachSubmitted: 'ugcvz:outreach-submitted',
} as const;
```

- [ ] **Step 2: Tool-Beschreibung anlegen**

Nach `GET_LAST_OUTREACH_DESCRIPTION` (nach Zeile 108) einfügen:

```ts
const GET_HUMAN_SELECTION_DESCRIPTION = [
  'Returns the creators the human has marked by clicking result cards on the page in this browser',
  'session, with the card data visible to them (id, name, reach, price range, networks). This is',
  'the human -> agent channel of the shared screen: call it when the human says things like',
  '"compare the ones I picked", "find one more like these" or "which ones did I mark?". Requires',
  'the homepage with a visible search_creators result. Read-only; does not change the selection.',
  'Use select_creators to add creators to the same selection. [DE]',
  'Liefert die Creator, die der Mensch in dieser Browser-Sitzung per Klick auf Ergebnis-Cards',
  'markiert hat, mit den fuer ihn sichtbaren Card-Daten (id, name, reach, price_range, networks).',
  'Das ist der Rueckkanal Mensch -> Agent des gemeinsamen Bildschirms: aufrufen, wenn der Mensch',
  'sagt "vergleich die, die ich markiert habe", "such mir noch einen wie diese" oder "welche habe',
  'ich markiert?". Nur auf der Startseite mit sichtbarem search_creators-Ergebnis. Nur lesend;',
  'aendert die Auswahl nicht. select_creators ergaenzt dieselbe Auswahl.',
].join(' ');
```

- [ ] **Step 3: Tool registrieren und select_creators-Hinweis erweitern**

In `buildToolDefinitions` direkt vor `return definitions;` (Zeile ~236) einfügen:

```ts
    register(
      'get_human_selection',
      GET_HUMAN_SELECTION_DESCRIPTION,
      { type: 'object', properties: {} },
      async () => {
        if (!window.__ugcvzAgentUiReady) {
          return textResult(
            'get_human_selection ist nur auf der Startseite mit sichtbarer Suche verfuegbar. Zuerst dorthin navigieren und search_creators aufrufen.',
            true,
          );
        }
        const result = await askUi(AGENT_UI_EVENTS.getSelection, AGENT_UI_EVENTS.getSelectionResult, {}, 5_000);
        const selected = Array.isArray(result.selected) ? result.selected : [];
        return textResult({
          source: 'ui',
          hinweis:
            selected.length === 0
              ? 'Der Mensch hat auf der Seite noch nichts markiert. Er kann Ergebnis-Cards anklicken; select_creators markiert alternativ per ID.'
              : 'Vom Menschen auf der Seite markiert. select_creators ergaenzt diese Auswahl, ohne sie zu ersetzen.',
          ...result,
        });
      },
      true,
    );
```

Im `select_creators`-Handler den Hinweis-Text (Zeile ~222) ersetzen:

```ts
        return textResult({
          hinweis: 'Das Anfrage-Formular ist geoeffnet. Die Auswahl ist additiv zu dem, was der Mensch selbst markiert hat (all_selected). Der Mensch prueft und sendet selbst ab. Danach get_last_outreach aufrufen.',
          ...result,
        });
```

Der Wert `requestId` aus dem Event-Detail wird wie bei den anderen Tools mit durchgereicht; das ist bestehendes Verhalten und in Ordnung.

- [ ] **Step 4: SearchBox beantwortet das Event**

In `app/components/SearchBox.tsx` im Agent-Effect (Zeile 76-112) den `onAgentSelect`-Handler so erweitern, dass er `all_selected` mitliefert, und `onAgentGetSelection` hinzufügen. Den Block von `const onAgentSelect` bis zum `return () => {...}` ersetzen durch:

```ts
    // Card-Daten, die der Mensch auf der Seite sieht -- gleiche Felder wie im
    // searchResult-Event, damit der Agent beide Ergebnisse gleich lesen kann.
    const toCard = (id: string) => {
      const c = creators.find((creator) => creator.id === id);
      return c
        ? { id: c.id, name: c.name, reach: c.reach, price_range: c.priceRange, networks: c.networks }
        : { id };
    };

    const onAgentSelect = (event: Event) => {
      const { creator_ids, requestId } = (event as CustomEvent).detail || {};
      const ids: string[] = Array.isArray(creator_ids) ? creator_ids.map(String) : [];
      const known = new Set(creators.map((c) => c.id));
      const selected: string[] = [];
      const notFound: string[] = [];
      for (const id of ids) {
        if (!known.has(id)) {
          notFound.push(id);
          continue;
        }
        // Idempotent auswaehlen: bereits markierte Creator nicht wieder abwaehlen.
        if (!selectedCreators.includes(id)) toggleCreatorSelection(id);
        selected.push(id);
      }
      // Gesamtauswahl nach dem Merge: was der Mensch markiert hatte plus die neuen.
      const allSelected = Array.from(new Set([...selectedCreators, ...selected]));
      window.dispatchEvent(
        new CustomEvent(AGENT_UI_EVENTS.selectResult, {
          detail: { requestId, selected, not_found: notFound, all_selected: allSelected },
        }),
      );
    };

    // Rueckkanal Mensch -> Agent: welche Cards hat der Mensch angeklickt?
    const onAgentGetSelection = (event: Event) => {
      const { requestId } = (event as CustomEvent).detail || {};
      window.dispatchEvent(
        new CustomEvent(AGENT_UI_EVENTS.getSelectionResult, {
          detail: {
            requestId,
            selected: selectedCreators.map(toCard),
            visible_total: creators.length,
          },
        }),
      );
    };

    window.addEventListener(AGENT_UI_EVENTS.search, onAgentSearch);
    window.addEventListener(AGENT_UI_EVENTS.select, onAgentSelect);
    window.addEventListener(AGENT_UI_EVENTS.getSelection, onAgentGetSelection);
    return () => {
      delete window.__ugcvzAgentUiReady;
      window.removeEventListener(AGENT_UI_EVENTS.search, onAgentSearch);
      window.removeEventListener(AGENT_UI_EVENTS.select, onAgentSelect);
      window.removeEventListener(AGENT_UI_EVENTS.getSelection, onAgentGetSelection);
    };
```

Die Zeilen `// eslint-disable-next-line react-hooks/exhaustive-deps` und `}, [creators, selectedCreators]);` direkt nach dem ersetzten Block bleiben unverändert, damit die Handler immer den aktuellen State sehen.

- [ ] **Step 5: Lokale Plausibilitätsprüfung ohne Build**

Run:
```bash
cd /home/autoblogger/ugc-vz-neu
grep -c "get_human_selection" app/components/WebMcpProvider.tsx   # erwartet: >= 3 (Konstante, register, Beschreibung nicht, also 2-3)
grep -n "getSelection" app/components/SearchBox.tsx app/components/WebMcpProvider.tsx
npm run validate:agent-layer 2>&1 | tail -3
```
Expected: `getSelection` taucht in beiden Dateien auf (Event + Handler + Listener + Cleanup in SearchBox; Event + askUi in Provider). Validation meldet `OK: webmcp layer (7 Tools ...)`. Kein `tsc` lokal.

- [ ] **Step 6: Commit**

```bash
cd /home/autoblogger/ugc-vz-neu
git add app/components/WebMcpProvider.tsx app/components/SearchBox.tsx
git commit -m "feat(webmcp): get_human_selection - Agent liest, welche Cards der Mensch markiert hat

Rueckkanal Mensch -> Agent fuer den Shared Screen. Read-only, nur im
Browser, nutzt die bestehende Klick-Markierung aus useSearch.
select_creators meldet zusaetzlich all_selected nach dem Merge.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015oJqzkYUKiJMrSJwogs6GS"
```

---

### Task 3: Doku, Developers-Seite, llms.txt und Devpost-Text auf 7 Tools

**Files:**
- Modify: `README.md:100-116`
- Modify: `PROTOCOLS.md:37`
- Modify: `app/developers/page.tsx:96-101`
- Modify: `app/llms.txt/route.ts:71`
- Modify: `docs/WEBMCP-CHALLENGE-SUBMISSION.md` (Abschnitte "How it creates a better user experience", "How we implemented WebMCP", "Testing instructions", Video-Script Szene 4)

**Interfaces:**
- Consumes: Tool-Name `get_human_selection`, Zahl 7 (`WEBMCP_TOOL_COUNT`). Läuft VOR dem Push (Task 4), damit Code und Texte in einem Deploy landen.

- [ ] **Step 1: README**

In `README.md` Zeile 100 `**6 tools**` → `**7 tools**`. In der Tabelle nach der Zeile `get_last_outreach` (Zeile ~115) einfügen:

```markdown
| `get_human_selection` | Returns the creators **the human** has marked by clicking result cards on the page, with the card data they see (read-only). The human → agent channel of the shared screen: "compare the ones I picked", "find one more like these". |
```

Den Absatz "Human-in-the-loop by design" (Zeile ~117) um einen Satz ergänzen, nach "Read-only tools carry `annotations.readOnlyHint` for the browser's safety review.":

```markdown
The shared screen works in both directions: `search_creators` and
`select_creators` let the agent act on the page, `get_human_selection` lets
the agent read what the human clicked, so "find one more like the two I
marked" needs no IDs typed by anyone.
```

- [ ] **Step 2: PROTOCOLS.md**

In Zeile 37 `6 Tools – Registry-Teilmenge ohne` → `7 Tools – Registry-Teilmenge ohne` und nach `` `select_creators` steuert die echte Such-UI. `` ergänzen: `` `get_human_selection` liest die Klick-Markierung des Menschen (Rückkanal Mensch → Agent). ``

- [ ] **Step 3: Developers-Seite**

In `app/developers/page.tsx` Zeile 96 `registriert 6 Tools` → `registriert 7 Tools`. In der Tool-Aufzählung (Zeile 98-100) `<code>get_last_outreach</code>,{' '}` ersetzen durch `<code>get_last_outreach</code>, <code>get_human_selection</code>,{' '}`. Den Satz "Der Agent sucht und markiert Treffer direkt in der Seiten-UI — Mensch und Agent sehen denselben Bildschirm." ersetzen durch: "Der Agent sucht und markiert Treffer direkt in der Seiten-UI, und er liest, welche Cards der Mensch selbst angeklickt hat — Mensch und Agent arbeiten auf demselben Bildschirm in beide Richtungen."

- [ ] **Step 4: llms.txt**

In `app/llms.txt/route.ts` Zeile 71 die Klammer-Liste `(search_creators, get_creator, get_vocab, get_outreach_status, select_creators, get_last_outreach)` ersetzen durch `(search_creators, get_creator, get_vocab, get_outreach_status, select_creators, get_last_outreach, get_human_selection)`.

- [ ] **Step 5: Devpost-Text und Video-Script**

In `docs/WEBMCP-CHALLENGE-SUBMISSION.md`:

a) Im Absatz "How it creates a better user experience" nach dem Satz, der mit "opens the contact form pre-filled." endet, einfügen:

```
And it works the other way round too: the human clicks two cards they like,
says "find one more like these", and the agent reads that selection off the
page with `get_human_selection` — no IDs typed, no screenshots pasted.
```

b) Im Absatz "How we implemented WebMCP": `registers 6 tools` → `registers 7 tools`; nach "drive the real page UI via CustomEvents with request-ID handshakes into the existing React search component;" einfügen: "`get_human_selection` uses the same handshake in the opposite direction and returns what the human clicked;". Den Schlusssatz "Everything is verified by an end-to-end test in a real Chromium against production." ersetzen durch "Everything is verified against production in the ChatGPT desktop browser." (Der siebte Tool-Pfad wird nur dort getestet, Task 5. Eine unbelegte Behauptung kostet bei Juroren mehr als eine ehrliche.)

c) "Testing instructions": nach `with 6 tools` → `with 7 tools`. Nach dem Satz "Then: "Select the first two" — the cards get marked and the contact form opens;" einfügen: `Or click two cards yourself and say "find one more like the ones I marked" — the agent reads your clicks via get_human_selection.`

d) Video-Script: Szene 4 (1:30–2:10) ersetzen durch:

```
4. **1:30–2:15 — Both directions, and the human gate.** Click two cards
   yourself. Type: "Compare the two I marked and find one more like them."
   Voice: "I didn't type an ID. The agent reads my clicks off the page with
   get_human_selection, compares them, searches, and adds a third with
   select_creators. The contact form opens pre-filled. And here's the
   design decision: there is no outreach tool in the browser. Sending this —
   a real e-mail to real people — is my click, not the agent's." Fill in
   name/e-mail, click send.
```

Szene 2: `registers six tools` → `registers seven tools`. Szene 5 auf `2:15–2:45`, Szene 6 auf `2:45–2:58` verschieben.

- [ ] **Step 6: Konsistenz prüfen**

Run:
```bash
cd /home/autoblogger/ugc-vz-neu
grep -rn "6 tools\|6 Tools\|six tools\|sechs Tools" README.md PROTOCOLS.md app/developers/page.tsx app/llms.txt/route.ts docs/WEBMCP-CHALLENGE-SUBMISSION.md
```
Expected: keine Treffer. Jeder Treffer ist eine vergessene Stelle.

- [ ] **Step 7: Commit (noch nicht pushen, das macht Task 4)**

```bash
cd /home/autoblogger/ugc-vz-neu
git add README.md PROTOCOLS.md app/developers/page.tsx app/llms.txt/route.ts docs/WEBMCP-CHALLENGE-SUBMISSION.md
git commit -m "docs(webmcp): 7 Tools - get_human_selection in README, PROTOCOLS, /developers, llms.txt und Devpost-Text

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015oJqzkYUKiJMrSJwogs6GS"
```

---

### Task 4: Vercel-Build als Typprüfung (Roundtrip 1)

**Files:**
- Keine Code-Änderung. Verifikation.

**Interfaces:**
- Consumes: Die drei Commits aus Task 1, 2 und 3 auf `main` (ein Push).
- Produces: SHAs der drei Commits, notiert für den Revert-Pfad: `git log --oneline -3` VOR dem Push ausführen und die drei SHAs in der Task-Notiz festhalten.

- [ ] **Step 1: Pushen**

Run: `cd /home/autoblogger/ugc-vz-neu && git push origin main`
Expected: Push akzeptiert. Vercel startet den Production-Build serverseitig.

- [ ] **Step 2: Build-Status abfragen (nicht `vercel inspect`, das stirbt am OOM-Killer)**

Run:
```bash
TOKEN=$(python3 -c "import json;print(json.load(open('/home/autoblogger/.local/share/com.vercel.cli/auth.json'))['token'])")
curl -s -H "Authorization: Bearer $TOKEN" "https://api.vercel.com/v6/deployments?projectId=prj_d4YrytJihggA0nwOTlzDwB3GphEp&teamId=team_qEAR4clr473i64mzqkUeNveQ&target=production&limit=1" | python3 -c "import sys,json;d=json.load(sys.stdin)['deployments'][0];print(d['uid'],d['state'],d.get('meta',{}).get('githubCommitSha','')[:7])"
```
Expected: `READY` und der SHA des Task-2-Commits. Bei `BUILDING` alle 60 s wiederholen (Monitor-Tool oder Schleife), maximal 10 Minuten. Bei `ERROR`:
```bash
curl -s -H "Authorization: Bearer $TOKEN" "https://api.vercel.com/v3/deployments/<uid>/events?builds=1&limit=300" | python3 -c "import sys,json;[print(e.get('text','')) for e in json.load(sys.stdin) if 'error' in e.get('text','').lower() or 'TS' in e.get('text','')]"
```
Den TypeScript-Fehler beheben, committen, erneut pushen. Das ist Roundtrip 2. Schlägt auch der fehl: alle drei Commits explizit per SHA reverten, neueste zuerst: `git revert --no-edit <task3-sha> <task2-sha> <task1-sha>`, dann pushen und mit 6 Tools einreichen. NICHT `git revert HEAD~1..HEAD` (der Bereich trifft nur HEAD).

- [ ] **Step 3: Live prüfen, dass der Tool-Name im Client-Bundle ist**

Run:
```bash
cd /home/autoblogger/ugc-vz-neu
for f in $(curl -s https://ugc-vz.de/ | grep -o '/_next/static/chunks/[^"]*\.js' | sort -u); do
  curl -s "https://ugc-vz.de$f" | grep -q "get_human_selection" && echo "FOUND in $f"
done
```
Expected: mindestens eine `FOUND`-Zeile (WebMcpProvider hängt im Root-Layout und kann in einem geteilten Chunk liegen, daher alle Chunks prüfen; String-Literale überleben die Minifizierung). Fehlt sie, ist der Build noch nicht aliast (40 s warten, wiederholen) oder das Tool ist nicht im Bundle (dann Task 2 prüfen).

- [ ] **Step 4: Doku live prüfen**

Run:
```bash
curl -s https://ugc-vz.de/developers | grep -o "registriert 7 Tools"
curl -s https://ugc-vz.de/llms.txt | grep -c get_human_selection
```
Expected: `registriert 7 Tools` und `1`.

---

### Task 5: Live-Test im ChatGPT-Desktop-Browser (nur der Mensch)

**Files:**
- Keine. Manuelle Verifikation durch den Nutzer; der Agent bereitet die Checkliste vor und wertet aus.

**Interfaces:**
- Consumes: Production-Deploy aus Task 4 und die drei Commit-SHAs aus Task 4.

- [ ] **Step 1: Checkliste an den Nutzer geben**

Der ausführende Agent gibt dem Nutzer exakt diese Liste (der Test ist auf dem VPS nicht möglich):

1. ChatGPT-Desktop-App, eingebauter Browser, `https://ugc-vz.de` öffnen (Modell Sol oder Terra, nicht Luna). Cache leeren oder hart neu laden.
2. Adressleiste "Site tools": Zähler muss **7** zeigen, `get_human_selection` in der Liste.
3. Eingabe: "Find me three beauty creators for TikTok product videos." Cards erscheinen.
4. Zwei Cards selbst anklicken (werden markiert, Popup öffnet).
5. Eingabe: "Compare the two I marked and find one more like them."
6. Erwartet: Agent ruft `get_human_selection` (im Tool-Log sichtbar), nennt die beiden angeklickten Namen, sucht, ruft `select_creators` mit einer dritten ID. Popup zeigt jetzt drei Creator.
7. Nicht absenden, außer gewollt (echte E-Mail).

- [ ] **Step 2: Ergebnis auswerten**

Grün: alle sieben Punkte. Video aufnehmen (Script in `docs/WEBMCP-CHALLENGE-SUBMISSION.md`), Devpost-Formular aktualisieren.

Rot bei Punkt 2 (Tool fehlt): Cache-Problem oder Bundle nicht aliast, Task 4 Step 3 wiederholen.
Rot bei Punkt 6 (Tool wird aufgerufen, aber leere Auswahl): Handshake-Problem in SearchBox. In der Browser-Konsole `window.dispatchEvent(new CustomEvent('ugcvz:agent-get-selection',{detail:{requestId:'x'}}))` mit einem Listener auf `ugcvz:agent-get-selection-result` testen. Ist das nicht innerhalb der Timebox lösbar: `git revert --no-edit <task3-sha> <task2-sha> <task1-sha>` (neueste zuerst, SHAs aus Task 4), pushen, mit 6 Tools und dem alten Video-Script einreichen.

---

## Self-Review

**Spec coverage:** Rückkanal Mensch → Agent (Task 2), read-only mit `readOnlyHint` (Task 2 Step 3, letzter Parameter `true`), kein `request_outreach` im Browser (Task 1 Assertion), Konsistenz 7 Tools in allen Texten (Task 3 Step 6), Timebox und Revert-Pfad (Global Constraints, Task 4, Task 5). Verzichtet wurde bewusst auf eine "abgelehnt"-Liste und auf `select_creators` ohne `creator_ids`: beides YAGNI, die additive Semantik deckt den Demo-Satz ab.

**Placeholder scan:** Keine TBD/TODO. Jeder Code-Step enthält den Code.

**Type consistency:** `WEBMCP_BROWSER_ONLY_TOOLS` (Task 1) enthält exakt die drei Namen, die in Task 2 per `register(...)` registriert werden (`select_creators`, `get_last_outreach`, `get_human_selection`). Event-Namen `getSelection`/`getSelectionResult` sind in Task 2 Step 1, 3 und 4 identisch. Response-Felder `selected`, `visible_total`, `all_selected` stimmen zwischen SearchBox (Sender) und Provider (Leser: `result.selected`) überein.
