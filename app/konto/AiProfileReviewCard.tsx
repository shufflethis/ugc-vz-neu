'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Mic, RefreshCw, Sparkles, Square, Wand2, X } from 'lucide-react';
import type { CreatorAiProfileRecord } from '../lib/creator-social-analyzer';

const MAX_RECORDING_SECONDS = 60;

function pickSupportedAudioMime(): string {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') return '';
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/ogg',
  ];
  for (const mime of candidates) {
    if (typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }
  return '';
}

function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function AiProfileReviewCard({
  initialAiProfile,
}: {
  initialAiProfile: CreatorAiProfileRecord | null;
}) {
  const [aiProfile, setAiProfile] = useState<CreatorAiProfileRecord | null>(initialAiProfile);
  const [summaryText, setSummaryText] = useState(
    initialAiProfile?.draftSummary || initialAiProfile?.approvedSummary || '',
  );
  const [niches, setNiches] = useState<string[]>(
    initialAiProfile?.inferredNiches?.length
      ? initialAiProfile.inferredNiches
      : initialAiProfile?.approvedNiches || [],
  );
  const [newNicheInput, setNewNicheInput] = useState('');
  const [instructionText, setInstructionText] = useState('');
  const [transcript, setTranscript] = useState(initialAiProfile?.creatorVoiceTranscript || '');
  const [changesNote, setChangesNote] = useState('');

  const [analyzing, setAnalyzing] = useState(false);
  const [refining, setRefining] = useState(false);
  const [approving, setApproving] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [canRecordAudio, setCanRecordAudio] = useState(false);

  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelFlagRef = useRef(false);

  useEffect(() => {
    setCanRecordAudio(
      typeof window !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      Boolean(navigator.mediaDevices?.getUserMedia) &&
      typeof MediaRecorder !== 'undefined',
    );
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const stopRecordingTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const cleanupStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setErrorMessage('');
    setStatusMessage('');
    try {
      const response = await fetch('/api/creator/ai-profile/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Analyse konnte nicht durchgeführt werden.');
      }
      if (result.aiProfile) {
        setAiProfile(result.aiProfile);
        setSummaryText(result.aiProfile.draftSummary || result.aiProfile.approvedSummary || '');
        setNiches(
          result.aiProfile.inferredNiches?.length
            ? result.aiProfile.inferredNiches
            : result.aiProfile.approvedNiches || [],
        );
      }
      setStatusMessage(result.message || 'Entwurf erstellt. Prüfe den Text und gib ihn unten frei.');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Analyse fehlgeschlagen.');
    } finally {
      setAnalyzing(false);
    }
  };

  const submitVoiceOrText = async (payload: { audioBlob?: Blob; instruction?: string }) => {
    setRefining(true);
    setErrorMessage('');
    setStatusMessage('');
    setChangesNote('');
    try {
      let response: Response;
      if (payload.audioBlob) {
        const formData = new FormData();
        const ext = payload.audioBlob.type.includes('mp4')
          ? 'm4a'
          : payload.audioBlob.type.includes('ogg')
            ? 'ogg'
            : 'webm';
        formData.append('audio', payload.audioBlob, `voice-note.${ext}`);
        formData.append('currentSummary', summaryText);
        formData.append('currentNiches', niches.join(', '));
        response = await fetch('/api/creator/ai-profile/voice', {
          method: 'POST',
          body: formData,
        });
      } else {
        response = await fetch('/api/creator/ai-profile/voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instruction: payload.instruction,
            currentSummary: summaryText,
            currentNiches: niches,
          }),
        });
      }

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Ergänzung konnte nicht verarbeitet werden.');
      }
      if (typeof result.updatedSummary === 'string') setSummaryText(result.updatedSummary);
      if (Array.isArray(result.updatedNiches)) setNiches(result.updatedNiches);
      if (typeof result.transcript === 'string' && result.transcript) setTranscript(result.transcript);
      if (typeof result.changesSummary === 'string' && result.changesSummary) setChangesNote(result.changesSummary);
      setInstructionText('');
      setStatusMessage('Entwurf aktualisiert. Prüfe den Text kurz und klicke dann auf „Für die Suche freigeben“.');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Verarbeitung fehlgeschlagen.');
    } finally {
      setRefining(false);
    }
  };

  const startVoiceRecording = async () => {
    setErrorMessage('');
    setStatusMessage('');
    if (!canRecordAudio) {
      setErrorMessage('Dein Browser unterstützt keine direkte Audioaufnahme. Nutze einfach das Textfeld darunter.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      cancelFlagRef.current = false;

      const mimeType = pickSupportedAudioMime();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        stopRecordingTimer();
        setRecording(false);
        const recordedMime = recorder.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: recordedMime });
        chunksRef.current = [];
        cleanupStream();
        if (!cancelFlagRef.current && blob.size > 0) {
          void submitVoiceOrText({ audioBlob: blob });
        }
      };

      recorder.start();
      setRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          const next = prev + 1;
          if (next >= MAX_RECORDING_SECONDS) {
            if (recorderRef.current && recorderRef.current.state === 'recording') {
              recorderRef.current.stop();
            }
          }
          return next;
        });
      }, 1_000);
    } catch {
      cleanupStream();
      setRecording(false);
      setErrorMessage('Kein Mikrofon-Zugriff möglich. Bitte erlaube das Mikrofon im Browser oder tippe deine Ergänzung unten ein.');
    }
  };

  const stopVoiceRecording = (cancel = false) => {
    cancelFlagRef.current = cancel;
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.stop();
    } else {
      stopRecordingTimer();
      cleanupStream();
      setRecording(false);
    }
  };

  const handleAddNiche = () => {
    const cleaned = newNicheInput.trim().slice(0, 60);
    if (!cleaned) return;
    if (!niches.some((n) => n.toLowerCase() === cleaned.toLowerCase()) && niches.length < 15) {
      setNiches((prev) => [...prev, cleaned]);
    }
    setNewNicheInput('');
  };

  const handleRemoveNiche = (target: string) => {
    setNiches((prev) => prev.filter((item) => item !== target));
  };

  const handleApprove = async () => {
    setApproving(true);
    setErrorMessage('');
    setStatusMessage('');
    try {
      const response = await fetch('/api/creator/ai-profile/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: summaryText,
          niches,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Freigabe fehlgeschlagen.');
      }
      if (result.aiProfile) setAiProfile(result.aiProfile);
      setStatusMessage(result.message || 'Profilzusammenfassung freigegeben und in der Suche aktiv.');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Freigabe fehlgeschlagen.');
    } finally {
      setApproving(false);
    }
  };

  const statusBadge =
    aiProfile?.status === 'approved'
      ? { label: 'Freigegeben & aktiv in der Suche', className: 'bg-[#edf5e5] text-[#2e4d1b] border-[#b7d89c]' }
      : aiProfile?.status === 'draft_ready'
        ? { label: 'Entwurf bereit zur Prüfung', className: 'bg-geo-violet/10 text-geo-violet border-geo-violet/30' }
        : aiProfile?.status === 'analyzing' || aiProfile?.status === 'pending'
          ? { label: 'Analyse vorgemerkt', className: 'bg-amber-50 text-amber-900 border-amber-200' }
          : { label: 'Noch nicht erstellt', className: 'bg-surface text-ink-soft border-hairline' };

  return (
    <section
      id="ai-profile"
      className="mb-8 rounded-3xl border border-geo-violet/30 bg-white p-6 sm:p-8 shadow-[0_20px_60px_rgba(91,70,240,0.08)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.15em] text-geo-violet">
            <Sparkles size={14} /> KI-Profil-Steckbrief für die Suche
          </p>
          <h2 className="mt-1 text-2xl font-bold text-ink">
            Wofür dich Brands wirklich finden sollen
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
            Unsere KI wertet deine verlinkten Kanäle, Bilder und Profilangaben aus und erstellt einen konkreten Steckbrief.
            Du kannst ihn hier jederzeit lesen, per Sprachnachricht oder Text korrigieren und erst nach deiner Freigabe für die Brand-Suche aktivieren.
          </p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusBadge.className}`}>
          {statusBadge.label}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={analyzing || recording || refining}
          className="inline-flex items-center gap-2 rounded-xl border border-geo-violet/40 bg-geo-violet/5 px-4 py-2.5 text-sm font-semibold text-geo-violet transition hover:bg-geo-violet/10 disabled:opacity-50"
        >
          <RefreshCw size={15} className={analyzing ? 'animate-spin' : ''} />
          {analyzing
            ? 'Kanäle werden analysiert …'
            : summaryText
              ? 'Kanäle neu analysieren'
              : 'Jetzt Kanäle automatisch analysieren'}
        </button>

        {aiProfile?.sourceSnapshot?.imagesAnalyzed ? (
          <span className="text-xs text-ink-soft">
            Zuletzt ausgewertet: {aiProfile.sourceSnapshot.channelsChecked?.length || 0} Kanal-Quellen · {aiProfile.sourceSnapshot.imagesAnalyzed} Bilder
          </span>
        ) : null}
      </div>

      {/* Visual signals detected from channels */}
      {aiProfile?.visualSignals && aiProfile.visualSignals.length > 0 && (
        <div className="mt-5 rounded-2xl border border-hairline bg-surface p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-soft">
            Erkannte Kanal- &amp; Bildsignale
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {aiProfile.visualSignals.map((sig, idx) => (
              <span
                key={`${sig.signal}-${idx}`}
                title={sig.evidence}
                className="rounded-xl border border-hairline bg-white px-3 py-1.5 text-xs text-ink"
              >
                <strong className="font-semibold">{sig.signal}</strong>
                {sig.evidence ? <span className="text-ink-soft"> · {sig.evidence}</span> : null}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Voice & Text refinement bar (MediaRecorder — works on iOS Safari, Android & Desktop) */}
      <div className="mt-6 rounded-2xl border border-hairline bg-surface/70 p-4 sm:p-5">
        <p className="text-sm font-semibold text-ink">
          Per Sprache oder Kurznachricht ergänzen &amp; korrigieren
        </p>
        <p className="mt-1 text-xs leading-5 text-ink-soft">
          Beispiel: „Ergänze bitte, dass ich an meinem BMW E36 schraube, einen Golden Retriever habe und lieber Tech- als Beauty-Videos mache.“
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          {!recording ? (
            <button
              type="button"
              onClick={startVoiceRecording}
              disabled={refining || analyzing}
              className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-geo-violet disabled:opacity-50"
            >
              <Mic size={16} /> Sprachnachricht aufnehmen (max. 60s)
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => stopVoiceRecording(false)}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                <Square size={14} /> Aufnahme stoppen &amp; übernehmen ({formatTimer(recordingSeconds)} / 01:00)
              </button>
              <button
                type="button"
                onClick={() => stopVoiceRecording(true)}
                className="inline-flex items-center gap-1 rounded-xl border border-hairline bg-white px-3 py-2.5 text-xs font-semibold text-ink-soft hover:bg-surface"
              >
                <X size={14} /> Abbrechen
              </button>
            </div>
          )}
          {refining && (
            <span className="text-xs font-medium text-geo-violet">
              KI arbeitet deine Ergänzung ein …
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={instructionText}
            onChange={(e) => setInstructionText(e.target.value)}
            maxLength={1000}
            disabled={refining || recording}
            placeholder="Oder tippe hier kurz deine Ergänzung / Korrektur ein …"
            className="flex-1 rounded-xl border border-hairline bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-geo-violet focus:ring-4 focus:ring-geo-violet/10"
          />
          <button
            type="button"
            disabled={!instructionText.trim() || refining || recording}
            onClick={() => void submitVoiceOrText({ instruction: instructionText.trim() })}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-hairline bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-geo-violet hover:text-geo-violet disabled:opacity-50"
          >
            <Wand2 size={15} /> Mit KI einarbeiten
          </button>
        </div>

        {transcript && (
          <p className="mt-3 rounded-xl bg-white px-3 py-2 text-xs leading-5 text-ink-soft">
            <strong className="text-ink">Letzte Ergänzung:</strong> „{transcript}“
            {changesNote ? <span className="block mt-1 text-geo-violet">{changesNote}</span> : null}
          </p>
        )}
      </div>

      {/* Editable summary + niche chips */}
      <div className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-ink">
            Deine Profilzusammenfassung (direkt bearbeitbar)
          </span>
          <textarea
            value={summaryText}
            onChange={(e) => setSummaryText(e.target.value)}
            rows={5}
            maxLength={1500}
            placeholder="Klicke oben auf „Jetzt Kanäle automatisch analysieren“ oder beschreibe per Sprache/Text kurz, welche Themen, Produkte, Settings und Stärken dich auszeichnen …"
            className="w-full rounded-xl border border-hairline bg-white px-4 py-3 text-sm leading-6 text-ink outline-none transition focus:border-geo-violet focus:ring-4 focus:ring-geo-violet/10"
          />
        </label>

        <div>
          <span className="mb-2 block text-sm font-semibold text-ink">
            Erkannte &amp; bestätigte Nischen-Tags
          </span>
          <div className="flex flex-wrap gap-2">
            {niches.map((niche) => (
              <span
                key={niche}
                className="inline-flex items-center gap-1.5 rounded-full border border-geo-violet/30 bg-geo-violet/5 px-3 py-1 text-xs font-semibold text-geo-violet"
              >
                {niche}
                <button
                  type="button"
                  aria-label={`${niche} entfernen`}
                  onClick={() => handleRemoveNiche(niche)}
                  className="rounded-full p-0.5 hover:bg-geo-violet/15"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
          <div className="mt-2.5 flex gap-2">
            <input
              type="text"
              value={newNicheInput}
              onChange={(e) => setNewNicheInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddNiche();
                }
              }}
              maxLength={60}
              placeholder="Nische hinzufügen (z. B. Autopflege, Oldtimer, Camping) …"
              className="flex-1 rounded-xl border border-hairline bg-white px-3.5 py-2 text-sm text-ink outline-none focus:border-geo-violet"
            />
            <button
              type="button"
              onClick={handleAddNiche}
              className="rounded-xl border border-hairline bg-surface px-4 py-2 text-xs font-semibold text-ink hover:border-geo-violet"
            >
              + Hinzufügen
            </button>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {errorMessage}
        </div>
      )}
      {statusMessage && (
        <div className="mt-4 rounded-xl border border-geo-green/60 bg-geo-green/15 px-4 py-3 text-sm text-ink" role="status">
          {statusMessage}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-hairline pt-5">
        <p className="text-xs leading-5 text-ink-soft">
          Nur deine freigegebene Fassung wird in der Brand-Suche genutzt. Du kannst sie jederzeit anpassen.
        </p>
        <button
          type="button"
          onClick={handleApprove}
          disabled={approving || summaryText.trim().length < 20}
          className="inline-flex items-center gap-2 rounded-xl bg-geo-violet px-5 py-3 text-sm font-semibold text-white transition hover:bg-geo-violet-soft disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Check size={16} />
          {approving ? 'Wird freigegeben …' : 'Für die Suche übernehmen & freigeben'}
        </button>
      </div>
    </section>
  );
}
