'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, Mic, RefreshCw, Sparkles, Square, Trash2, Wand2, X } from 'lucide-react';
import type { CreatorAiProfileRecord } from '../lib/creator-social-analyzer';
import {
  CREATOR_TAXONOMY,
  MAX_CATEGORIES_PER_CREATOR,
  getCategoryLabel,
  type CreatorCategoryId,
} from '../lib/creator-taxonomy';

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
  const [previousSummary, setPreviousSummary] = useState('');
  const [niches, setNiches] = useState<string[]>(
    initialAiProfile?.inferredNiches?.length
      ? initialAiProfile.inferredNiches
      : initialAiProfile?.approvedNiches || [],
  );
  const [newNicheInput, setNewNicheInput] = useState('');
  const [instructionText, setInstructionText] = useState('');
  const [transcript, setTranscript] = useState(initialAiProfile?.creatorVoiceTranscript || '');
  const [changesNote, setChangesNote] = useState('');

  // Explizite Opt-in-Checkbox (Spec 8.6: NICHT vorausgewaehlt!)
  const [consentChecked, setConsentChecked] = useState(false);
  const [manualMode, setManualMode] = useState(false);

  // 20er-Kategorien-Taxonomie (max. 3, 1 Pflicht-Hauptkategorie)
  const [primaryCategory, setPrimaryCategory] = useState<CreatorCategoryId | ''>('');
  const [secondaryCategories, setSecondaryCategories] = useState<CreatorCategoryId[]>([]);
  const [suggestedCategories, setSuggestedCategories] = useState<Array<{ id: CreatorCategoryId; label: string; isPrimary: boolean }>>([]);
  const [categoriesConfirmed, setCategoriesConfirmed] = useState(false);
  const [savingCategories, setSavingCategories] = useState(false);

  const [analyzing, setAnalyzing] = useState(false);
  const [refining, setRefining] = useState(false);
  const [approving, setApproving] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
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

  const hasConsent = Boolean(aiProfile?.consentAt && aiProfile.status !== 'withdrawn');
  const hasDraftOrApproved = Boolean(summaryText.trim()) || aiProfile?.status === 'draft_ready' || aiProfile?.status === 'approved';
  const showOptInCard = !hasConsent && !hasDraftOrApproved && !manualMode;

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

  // Lade gespeicherte oder vorgeschlagene 20er-Kategorien
  useEffect(() => {
    let cancelled = false;
    fetch('/api/creator/categories', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.success) return;
        if (data.primaryCategory) {
          setPrimaryCategory(data.primaryCategory);
          setSecondaryCategories(Array.isArray(data.secondaryCategories) ? data.secondaryCategories : []);
          setCategoriesConfirmed(Boolean(data.confirmedAt));
        } else if (Array.isArray(data.suggestedCategories) && data.suggestedCategories.length > 0) {
          setSuggestedCategories(data.suggestedCategories);
          const first = data.suggestedCategories[0]?.id;
          const rest = data.suggestedCategories.slice(1, MAX_CATEGORIES_PER_CREATOR).map((c: any) => c.id);
          if (first) setPrimaryCategory(first);
          setSecondaryCategories(rest);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
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

  const handleToggleCategory = (id: CreatorCategoryId) => {
    if (primaryCategory === id) {
      // Promote first secondary to primary or clear
      const [nextPrimary, ...rest] = secondaryCategories;
      setPrimaryCategory(nextPrimary || '');
      setSecondaryCategories(rest);
      return;
    }
    if (secondaryCategories.includes(id)) {
      setSecondaryCategories((prev) => prev.filter((item) => item !== id));
      return;
    }
    if (!primaryCategory) {
      setPrimaryCategory(id);
      return;
    }
    if (1 + secondaryCategories.length >= MAX_CATEGORIES_PER_CREATOR) {
      setErrorMessage(`Du kannst höchstens ${MAX_CATEGORIES_PER_CREATOR} Kategorien wählen (1 Hauptkategorie + max. 2 weitere).`);
      return;
    }
    setErrorMessage('');
    setSecondaryCategories((prev) => [...prev, id]);
  };

  const handleSaveCategories = async () => {
    if (!primaryCategory) {
      setErrorMessage('Bitte wähle mindestens eine Hauptkategorie aus.');
      return;
    }
    setSavingCategories(true);
    setErrorMessage('');
    setStatusMessage('');
    try {
      const response = await fetch('/api/creator/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ primaryCategory, secondaryCategories }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Kategorien konnten nicht gespeichert werden.');
      setCategoriesConfirmed(true);
      setSuggestedCategories([]);
      setStatusMessage(result.message || 'Kategorien gespeichert.');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Kategorien konnten nicht gespeichert werden.');
    } finally {
      setSavingCategories(false);
    }
  };

  const handleAnalyze = async (withExplicitConsent = false) => {
    if (!hasConsent && !withExplicitConsent) {
      setErrorMessage('Bitte setze zuerst das Häkchen zur Einwilligung.');
      return;
    }
    setAnalyzing(true);
    setErrorMessage('');
    setStatusMessage('Wir schauen uns gerade deine Videos an. Das kann ein paar Minuten dauern. Du kannst die Seite schließen, wir schicken dir eine Mail.');
    try {
      const response = await fetch('/api/creator/ai-profile/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consent: withExplicitConsent || hasConsent }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
            'Wir kommen gerade nicht an deine Videos. Ist dein Profil öffentlich? Versuch es später noch mal oder schreib deinen Text selbst.',
        );
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
      setStatusMessage(result.message || 'So würden wir dich beschreiben. Stimmt das?');
    } catch (err) {
      setStatusMessage('');
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Wir kommen gerade nicht an deine Videos. Ist dein Profil öffentlich? Versuch es später noch mal oder schreib deinen Text selbst.',
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const submitVoiceOrText = async (payload: { audioBlob?: Blob; instruction?: string }) => {
    setRefining(true);
    setErrorMessage('');
    setStatusMessage('');
    setChangesNote('');
    const snapshotBefore = summaryText;
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
      if (typeof result.updatedSummary === 'string') {
        if (snapshotBefore && snapshotBefore !== result.updatedSummary) {
          setPreviousSummary(snapshotBefore);
        }
        setSummaryText(result.updatedSummary);
      }
      if (Array.isArray(result.updatedNiches)) setNiches(result.updatedNiches);
      if (typeof result.transcript === 'string' && result.transcript) setTranscript(result.transcript);
      if (typeof result.changesSummary === 'string') setChangesNote(result.changesSummary);
      if (result.aiProfile) setAiProfile(result.aiProfile);
      setInstructionText('');
      setStatusMessage('Entwurf aktualisiert. Prüfe vorher und nachher und gib ihn unten frei.');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Ergänzung fehlgeschlagen.');
    } finally {
      setRefining(false);
    }
  };

  const startVoiceRecording = async () => {
    setErrorMessage('');
    setStatusMessage('');
    if (!canRecordAudio) {
      setErrorMessage('Dein Browser unterstützt keine Sprachaufnahme. Nutze einfach das Textfeld darunter.');
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
        const canceled = cancelFlagRef.current;
        const blobType = recorder.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: blobType });
        chunksRef.current = [];
        cleanupStream();
        if (!canceled && blob.size > 0) {
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
            recorder.stop();
          }
          return next;
        });
      }, 1000);
    } catch {
      cleanupStream();
      setErrorMessage('Mikrofon-Zugriff wurde abgelehnt oder ist nicht verfügbar. Tippe deine Ergänzung einfach als Text ein.');
    }
  };

  const stopVoiceRecording = (cancel = false) => {
    cancelFlagRef.current = cancel;
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
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
          ...(primaryCategory ? { primaryCategory, secondaryCategories } : {}),
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Freigabe fehlgeschlagen.');
      }
      if (result.aiProfile) setAiProfile(result.aiProfile);
      if (primaryCategory) setCategoriesConfirmed(true);
      setPreviousSummary('');
      setStatusMessage(result.message || 'Fertig. Deine Profilzusammenfassung ist jetzt freigegeben.');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Freigabe fehlgeschlagen.');
    } finally {
      setApproving(false);
    }
  };

  const handleWithdraw = async () => {
    setWithdrawing(true);
    setErrorMessage('');
    setStatusMessage('');
    try {
      const response = await fetch('/api/creator/ai-profile/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Widerruf fehlgeschlagen.');
      }
      setAiProfile(result.aiProfile || null);
      setSummaryText('');
      setPreviousSummary('');
      setNiches([]);
      setTranscript('');
      setChangesNote('');
      setConsentChecked(false);
      setManualMode(false);
      setStatusMessage(result.message || 'Einwilligung widerrufen. KI-Text und Rohdaten wurden sofort gelöscht.');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Widerruf fehlgeschlagen.');
    } finally {
      setWithdrawing(false);
    }
  };

  const selectedCategoryIds = primaryCategory ? [primaryCategory, ...secondaryCategories] : [];

  return (
    <section
      id="ai-profile"
      className="mb-8 space-y-6 rounded-[20px] border border-[#DCE2EA] bg-white p-6 shadow-[0_1px_2px_rgba(18,18,18,.06),0_8px_24px_rgba(18,18,18,.06)] sm:p-8"
    >
      {/* 20er-Kategorien-Auswahl (Spec 8.6: max 3, 1 Hauptkategorie) */}
      <div className="rounded-2xl border border-[#DCE2EA] bg-[#F5F7FA] p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-sm font-bold text-[#202124]">
              Deine Kategorien (max. {MAX_CATEGORIES_PER_CREATOR}, erste ist Hauptkategorie)
            </p>
            <p className="mt-1 text-xs leading-5 text-[#5C6470]">
              {!categoriesConfirmed && suggestedCategories.length > 0
                ? 'Wir haben deine bisherigen Themen auf unsere festen Kategorien zugeordnet. Prüfe sie kurz und bestätige deine Auswahl.'
                : 'Marken filtern nach diesen 20 festen Kategorien. Wähle zuerst deine wichtigste Hauptkategorie.'}
            </p>
          </div>
          {categoriesConfirmed && (
            <span className="rounded-full bg-[#EBF2FA] px-2.5 py-0.5 text-xs font-bold text-[#202124]">
              Bestätigt
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {CREATOR_TAXONOMY.map((cat) => {
            const isPrimary = primaryCategory === cat.id;
            const isSecondary = secondaryCategories.includes(cat.id);
            const active = isPrimary || isSecondary;
            return (
              <button
                key={cat.id}
                type="button"
                aria-pressed={active}
                onClick={() => handleToggleCategory(cat.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  isPrimary
                    ? 'border-[#06458F] bg-[#06458F] text-white'
                    : isSecondary
                      ? 'border-[#06458F] bg-[#EBF2FA] text-[#202124]'
                      : 'border-[#DCE2EA] bg-white text-[#202124] hover:border-[#06458F]'
                }`}
              >
                {cat.label}
                {isPrimary ? ' (Hauptthema)' : ''}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-[#5C6470]">
            Ausgewählt ({selectedCategoryIds.length}/{MAX_CATEGORIES_PER_CREATOR}):{' '}
            <strong className="text-[#202124]">
              {selectedCategoryIds.length ? selectedCategoryIds.map(getCategoryLabel).join(', ') : 'noch keine'}
            </strong>
          </span>
          <button
            type="button"
            disabled={!primaryCategory || savingCategories}
            onClick={handleSaveCategories}
            className="inline-flex min-h-[40px] items-center rounded-xl bg-[#06458F] px-4 text-xs font-semibold text-[#F5F7FA] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {savingCategories ? 'Wird gespeichert ...' : 'Kategorien bestätigen'}
          </button>
        </div>
      </div>

      {/* Schritt 1: Explizites Opt-in (Checkbox NICHT vorausgewaehlt) */}
      {showOptInCard ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#06458F]">
            <Sparkles size={15} aria-hidden="true" />
            <span>KI-Profiltext (optional)</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#202124]">
            Soll unsere KI dein Profil schreiben?
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-[#5C6470]">
            Wir schauen uns deine letzten öffentlichen Videos an und machen daraus einen kurzen Profiltext. Du liest ihn, änderst, was nicht passt, und gibst ihn frei. Erst dann sehen Marken ihn.
          </p>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#DCE2EA] bg-[#F5F7FA] p-4">
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => {
                setConsentChecked(e.target.checked);
                if (errorMessage) setErrorMessage('');
              }}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#DCE2EA] accent-[#06458F]"
            />
            <span className="text-xs leading-5 text-[#202124]">
              Ja, UGC VZ darf meine öffentlich verlinkten Videos und Profilangaben automatisiert auswerten und einen Entwurf für mein Profil erstellen. Keine Gesichtserkennung, keine Schätzung sensibler Merkmale.
            </span>
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={!consentChecked || analyzing}
              onClick={() => void handleAnalyze(true)}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#06458F] px-5 text-sm font-semibold text-white hover:bg-[#053673] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {analyzing ? 'Videos werden analysiert ...' : 'Ja, mach mal'}
            </button>
            <button
              type="button"
              onClick={() => setManualMode(true)}
              className="inline-flex min-h-[48px] items-center rounded-xl border border-[#DCE2EA] bg-white px-5 text-sm font-semibold text-[#202124] transition-colors hover:border-[#06458F]"
            >
              Lieber selbst schreiben
            </button>
          </div>

          <p className="text-xs leading-5 text-[#5C6470]">
            Wir nutzen nur deine öffentlichen Inhalte. Du kannst das jederzeit in den Einstellungen widerrufen. Mehr in der{' '}
            <Link href="/datenschutz" className="font-semibold text-[#202124] underline underline-offset-2">
              Datenschutzerklärung
            </Link>.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#06458F]">
                <Sparkles size={14} aria-hidden="true" />
                <span>Von KI vorgeschlagen, von dir geprüft</span>
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#202124]">
                So würden wir dich beschreiben. Stimmt das?
              </h2>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                aiProfile?.status === 'approved'
                  ? 'bg-[#EBF2FA] text-[#202124]'
                  : 'bg-[#EBF2FA] text-[#06458F]'
              }`}
            >
              {aiProfile?.status === 'approved' ? 'Freigegeben & aktiv in der Suche' : 'Entwurf (noch nicht öffentlich)'}
            </span>
          </div>

          {hasConsent && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void handleAnalyze(true)}
                disabled={analyzing || recording || refining}
                className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-[#DCE2EA] bg-[#F5F7FA] px-4 text-xs font-semibold text-[#202124] transition-colors hover:border-[#06458F] disabled:opacity-50"
              >
                <RefreshCw size={14} className={analyzing ? 'animate-spin' : ''} aria-hidden="true" />
                {analyzing ? 'Videos werden analysiert ...' : 'Kanäle neu analysieren'}
              </button>
              <button
                type="button"
                onClick={() => void handleWithdraw()}
                disabled={withdrawing || analyzing || approving}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#D93025]/30 bg-white px-4 text-xs font-semibold text-[#D93025] transition-colors hover:bg-[#FEF2F2] disabled:opacity-50"
              >
                <Trash2 size={14} aria-hidden="true" />
                {withdrawing ? 'Wird gelöscht ...' : 'Einwilligung widerrufen & KI-Daten löschen'}
              </button>
            </div>
          )}

          {/* Vorher / Nachher Diff nach Sprach- oder Text-Aenderung */}
          {previousSummary && previousSummary !== summaryText && (
            <div className="grid gap-3 rounded-2xl border border-[#DCE2EA] bg-[#F5F7FA] p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold text-[#5C6470]">Vorher</p>
                <p className="mt-1 text-xs leading-5 text-[#5C6470] line-through">{previousSummary}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#1F9D55]">Nachher (Entwurf)</p>
                <p className="mt-1 text-xs leading-5 text-[#202124]">{summaryText}</p>
              </div>
            </div>
          )}

          {/* Sprachnachricht & Text-Korrektur */}
          <div className="rounded-2xl border border-[#DCE2EA] bg-[#F5F7FA] p-4 sm:p-5">
            <p className="text-sm font-semibold text-[#202124]">Per Sprachnachricht ergänzen oder Text ändern</p>
            <p className="mt-1 text-xs leading-5 text-[#5C6470]">
              Sag einfach, was fehlt. Zum Beispiel: „Ich mache auch viel mit Autos und Werkzeug.“
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              {!recording ? (
                <button
                  type="button"
                  onClick={startVoiceRecording}
                  disabled={refining || analyzing}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#06458F] px-4 text-sm font-semibold text-white hover:bg-[#053673] transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  <Mic size={16} aria-hidden="true" /> Per Sprachnachricht ergänzen
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => stopVoiceRecording(false)}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#D93025] px-4 text-sm font-semibold text-white"
                  >
                    <Square size={14} aria-hidden="true" /> Stoppen & übernehmen ({formatTimer(recordingSeconds)})
                  </button>
                  <button
                    type="button"
                    onClick={() => stopVoiceRecording(true)}
                    className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-[#DCE2EA] bg-white px-3 text-xs font-semibold text-[#5C6470]"
                  >
                    <X size={14} aria-hidden="true" /> Abbrechen
                  </button>
                </div>
              )}
              {refining && <span className="text-xs font-medium text-[#06458F]">Änderung wird eingearbeitet ...</span>}
            </div>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={instructionText}
                onChange={(e) => setInstructionText(e.target.value)}
                maxLength={1000}
                disabled={refining || recording}
                placeholder="Oder tippe hier, was ergänzt oder geändert werden soll ..."
                className="min-h-[44px] flex-1 rounded-xl border border-[#DCE2EA] bg-white px-4 text-sm text-[#202124] outline-none focus:border-[#06458F]"
              />
              <button
                type="button"
                disabled={!instructionText.trim() || refining || recording}
                onClick={() => void submitVoiceOrText({ instruction: instructionText.trim() })}
                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-[#DCE2EA] bg-white px-4 text-sm font-semibold text-[#202124] transition-colors hover:border-[#06458F] disabled:opacity-50"
              >
                <Wand2 size={15} aria-hidden="true" /> Text ändern
              </button>
            </div>

            {transcript && (
              <p className="mt-3 rounded-xl bg-white px-3 py-2 text-xs leading-5 text-[#5C6470]">
                <strong className="text-[#202124]">Letzte Ergänzung:</strong> „{transcript}“
                {changesNote ? <span className="mt-1 block text-[#06458F]">{changesNote}</span> : null}
              </p>
            )}
          </div>

          {/* Bearbeitbarer Profiltext + Tags */}
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-[#202124]">
                Dein Profiltext (60 bis 90 Wörter empfohlen, direkt bearbeitbar)
              </span>
              <textarea
                value={summaryText}
                onChange={(e) => setSummaryText(e.target.value)}
                rows={4}
                maxLength={1500}
                placeholder="Beschreibe kurz deine Schwerpunkte, Formate und Produkte, für die du Content drehst ..."
                className="w-full rounded-xl border border-[#DCE2EA] bg-white px-4 py-3 text-sm leading-6 text-[#202124] outline-none focus:border-[#06458F] focus:ring-4 focus:ring-[#06458F]/15"
              />
            </label>

            <div>
              <span className="mb-2 block text-sm font-semibold text-[#202124]">Schlagwörter & Unterthemen</span>
              <div className="flex flex-wrap gap-2">
                {niches.map((niche) => (
                  <span
                    key={niche}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#EBF2FA] px-3 py-1 text-xs font-semibold text-[#202124]"
                  >
                    {niche}
                    <button
                      type="button"
                      aria-label={`${niche} entfernen`}
                      onClick={() => handleRemoveNiche(niche)}
                      className="rounded-full p-0.5 hover:bg-[#06458F]/15"
                    >
                      <X size={12} aria-hidden="true" />
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
                  placeholder="Schlagwort hinzufügen (z. B. Autopflege, Camping) ..."
                  className="min-h-[42px] flex-1 rounded-xl border border-[#DCE2EA] bg-white px-3.5 text-sm text-[#202124] outline-none focus:border-[#06458F]"
                />
                <button
                  type="button"
                  onClick={handleAddNiche}
                  className="min-h-[42px] rounded-xl border border-[#DCE2EA] bg-[#F5F7FA] px-4 text-xs font-semibold text-[#202124] hover:border-[#06458F]"
                >
                  Hinzufügen
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#DCE2EA] pt-5">
            <p className="text-xs leading-5 text-[#5C6470]">
              Nichts geht ohne deine Freigabe online. Du kannst Text und Einwilligung jederzeit ändern oder löschen.
            </p>
            <button
              type="button"
              onClick={handleApprove}
              disabled={approving || summaryText.trim().length < 20}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#06458F] px-6 text-sm font-semibold text-white hover:bg-[#053673] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Check size={16} aria-hidden="true" />
              {approving ? 'Wird freigegeben ...' : 'Passt, freigeben'}
            </button>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl border border-[#D93025]/25 bg-[#FEF2F2] px-4 py-3 text-sm text-[#B42318]" role="alert">
          {errorMessage}
        </div>
      )}
      {statusMessage && (
        <div className="rounded-xl border border-[#1F9D55]/30 bg-[#edf5e5] px-4 py-3 text-sm text-[#202124]" role="status">
          {statusMessage}
        </div>
      )}
    </section>
  );
}
