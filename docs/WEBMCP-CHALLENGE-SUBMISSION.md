# WebMCP Challenge — Devpost submission material

Draft for the Devpost submission form (deadline Sep 3, 2026, 1 p.m. PT).
The four required points from the submission rules are covered in order.

## Project name

UGC VZ — agent-native creator search with a human-in-the-loop

## Text description (paste into Devpost)

**Why this use case is a strong fit for WebMCP.**
UGC VZ is a live, free directory of real, verified UGC creators in the
German-speaking market. Booking a creator is a trust decision: a brand wants
to *see* faces, portfolios and prices before contacting anyone — while the
tedious part (translating a campaign brief into search filters, comparing
candidates, tracking the request) is exactly what an agent is good at.
WebMCP is the only protocol where both happen on the same page at the same
time: the agent operates the site's real search UI and the human watches the
result cards appear, instead of the agent describing creators the human
cannot see.

**How it creates a better user experience.**
The agent's `search_creators` call runs through the same pipeline as a human
search and renders the results on screen. The human sees exactly what the
agent found, says "the first and third one", and `select_creators` marks
those cards and opens the contact form pre-filled. And it works the other
way round too: the human clicks two cards they like, says "find one more like
these", and the agent reads that selection off the page with
`get_human_selection` — no IDs typed, no screenshots pasted. What used to be
a copy-paste relay between a chat window and a website becomes one shared
screen. And the step with real-world consequences is protected by design:
there is deliberately **no** outreach tool in the browser — sending the
request (a real e-mail to real people) stays a human click. Afterwards
`get_last_outreach` hands the request ID back to the agent so it can track
status. That is a complete human–agent division of labor: the agent does
the searching and shortlisting, the human does the seeing and deciding.

**What people and agents can do together that was difficult or impossible
before.**
Before: the agent could query our MCP server or REST API, but the human saw
none of it — trust in "I found 3 creators for you" required blind faith, and
if the agent could also *send* the outreach, a hallucinated brief would
e-mail real people. Now the agent's work is visible and inspectable on the
page as it happens, the human corrects course mid-flow ("more Berlin, less
beauty"), and the irreversible step is physically reserved for the human.
This shared-screen collaboration with a built-in consent gate did not exist
in any of our four existing agent interfaces (MCP, REST, A2A, UCP).

**How we implemented WebMCP.**
A client-side provider (`app/components/WebMcpProvider.tsx`) registers 7
tools on `document.modelContext` (ChatGPT site tools) or
`navigator.modelContext` (Chromium prototype), supporting both
`registerTool` and `provideContext`, with a retry loop for APIs injected
after page load. Tool names, descriptions and JSON schemas come from the
same registry (`app/lib/agent-tools.ts`) that powers our existing MCP
server, REST API and A2A endpoint — WebMCP is a fourth protocol binding of
one source of truth, not a fork. `search_creators` and `select_creators`
drive the real page UI via CustomEvents with request-ID handshakes into the
existing React search component; `get_human_selection` uses the same
handshake in the opposite direction and returns what the human clicked;
read-only tools carry
`annotations.readOnlyHint` for the browser's safety review. A validation
script asserts the WebMCP tool set stays a strict subset of the registry —
and that `request_outreach` is never registered in the browser. Everything
is verified against production in the ChatGPT desktop browser.

## Testing instructions (for the form)

Open https://ugc-vz.de in the ChatGPT desktop app's built-in browser (GPT-5.6
Sol or Terra; site tools are disabled on Luna) or Chrome 149+ with
`chrome://flags/#enable-webmcp-testing`. The address bar shows "Site tools"
with 7 tools. Say: "Find me three beauty creators for TikTok product
videos" — result cards appear on the page. Then: "Select the first two" —
the cards get marked and the contact form opens; sending it stays with you
(submitting sends a real e-mail, so only submit if you mean it). Or click two
cards yourself and say "find one more like the ones I marked" — the agent
reads your clicks via get_human_selection. No login
required. Site UI is German; the tools work fine from an English
conversation.

## Video script (< 3 minutes, English audio, screen recording)

Record the ChatGPT desktop app with ugc-vz.de open in the built-in browser.
One take, no cuts needed except trimming waits.

1. **0:00–0:20 — Problem.** Screen: ugc-vz.de homepage. Voice: "This is
   UGC VZ, a live directory of verified UGC creators in the German-speaking
   market. Brands want to *see* who they book — but turning a campaign brief
   into the right search, comparing candidates, tracking the request: that's
   agent work. With WebMCP, both happen on the same screen."
2. **0:20–0:40 — Discovery.** Click the "Site tools" entry in the address
   bar, expand "Available site tools". Voice: "The page registers seven tools
   via document.modelContext — same names, descriptions and schemas as our
   MCP server and REST API. One registry, four protocols."
3. **0:40–1:30 — Shared search.** Type: "Find me three beauty creators for
   TikTok product videos, budget around 300 euros." Voice while cards render:
   "The agent calls search_creators — and it runs through the page's real
   search pipeline. I see exactly what the agent found. I can steer it
   mid-flow." Optionally: "more Berlin-based please" for a second search.
4. **1:30–2:15 — Both directions, and the human gate.** Click two cards
   yourself. Type: "Compare the two I marked and find one more like them."
   Voice: "I didn't type an ID. The agent reads my clicks off the page with
   get_human_selection, compares them, searches, and adds a third with
   select_creators. The contact form opens pre-filled. And here's the
   design decision: there is no outreach tool in the browser. Sending this —
   a real e-mail to real people — is my click, not the agent's." Fill in
   name/e-mail, click send.
5. **2:15–2:45 — Closing the loop.** Type: "What's the status of my
   request?" Voice: "After my submit, get_last_outreach hands the request ID
   back to the agent — it can track status from here, in this tab or through
   our public API. Agent does the searching, human does the deciding.
   That's the web we want: built for people and their agents."
6. **2:45–2:58 — Facts.** Voice over repo/README: "Built during the
   challenge window on a live product — commit history documents exactly
   what's new. Code is MIT-licensed on GitHub."

Upload public on YouTube, paste the link in the form.
