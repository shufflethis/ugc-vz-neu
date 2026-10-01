export default function CreatorWorkflow() {
  return <section className="bg-surface px-5 py-14 sm:px-8 sm:py-20" aria-labelledby="creator-workflow-title">
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:mb-10 sm:flex-row sm:items-end">
        <div><p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">So funktioniert UGC VZ</p><h2 id="creator-workflow-title" className="text-3xl font-semibold tracking-tight sm:text-4xl">Vom Briefing zur Zusammenarbeit.</h2></div>
        <p className="max-w-sm text-sm leading-6 text-ink-soft">Du prüfst die Profile. Du wählst aus.<br />Den Rest vereinbart ihr direkt.</p>
      </div>
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Beschreib dein Produkt.', 'Nenne Produkt, Zielgruppe und Videoformat. Oder nutze eines unserer Beispiel-Briefings.'],
          ['Schau genauer hin.', 'Vergleiche Themen, Preisvorstellungen und Arbeitsproben in den Creator-Profilen.'],
          ['Stell deine Auswahl zusammen.', 'Wähle deine Favoriten und erhalte die verfügbaren Kontaktinfos per E-Mail.'],
          ['Macht es konkret.', 'Kontaktiere die Creator und kläre Verfügbarkeit, Honorar und Nutzungsrechte direkt.'],
        ].map(([title, description], index) => <li key={title} className="rounded-2xl border border-hairline bg-white p-6"><span className="mb-7 inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface text-sm font-semibold text-ink-soft">0{index + 1}</span><h3 className="text-lg font-semibold tracking-tight text-ink">{title}</h3><p className="mt-3 text-sm leading-6 text-ink-soft">{description}</p></li>)}
      </ol>
    </div>
  </section>;
}
