import { useId, useRef, useState } from 'react';
import { askAssistant } from '../api';
import { SUPPORTED_LANGUAGES } from '../../shared/i18n';
import type {
  FanContext,
  LanguageCode,
  Stadium,
  Zone,
} from '../../shared/types';

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  meta?: string;
}

interface ConciergeProps {
  stadium: Stadium | null;
  onGenaiStatus: (enabled: boolean) => void;
}

const SUGGESTIONS = [
  'How do I get to section 300?',
  'Where is the nearest restroom?',
  'How do I get to the rail station?',
  '¿Dónde está la comida?',
  'Itinéraire sans escaliers vers 300s',
];

let messageCounter = 0;
function nextId(): string {
  messageCounter += 1;
  return `m${messageCounter}`;
}

/** Fan-facing conversational concierge with context-aware controls. */
export function Concierge({ stadium, onGenaiStatus }: ConciergeProps) {
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [currentZoneId, setCurrentZoneId] = useState<string>('');
  const [accessibleRoute, setAccessibleRoute] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const langId = useId();
  const zoneId = useId();

  const gateZones: Zone[] =
    stadium?.zones.filter((z) => z.kind === 'gate' || z.kind === 'transport') ??
    [];

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setError(null);
    setBusy(true);
    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: 'user', text: trimmed },
    ]);
    setInput('');

    const context: FanContext = {
      language,
      accessibleRoute,
      ...(currentZoneId ? { currentZoneId } : {}),
    };

    try {
      const { answer, genaiEnabled } = await askAssistant(trimmed, context);
      onGenaiStatus(genaiEnabled);
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: 'bot',
          text: answer.text,
          meta: `${answer.generative ? 'Gemini' : 'Verified answer'} · ${answer.intent}`,
        },
      ]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Something went wrong. Try again.',
      );
    } finally {
      setBusy(false);
      requestAnimationFrame(() => {
        if (logRef.current)
          logRef.current.scrollTop = logRef.current.scrollHeight;
      });
    }
  }

  return (
    <div className="grid grid--sidebar">
      <aside className="card" aria-label="Your details">
        <h2>Your details</h2>
        <p className="card__hint muted">
          The assistant tailors answers to your language, location, and access
          needs.
        </p>

        <div className="field">
          <label htmlFor={langId}>Language</label>
          <select
            id={langId}
            value={language}
            onChange={(e) => setLanguage(e.target.value as LanguageCode)}
          >
            {SUPPORTED_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor={zoneId}>Where are you now?</label>
          <select
            id={zoneId}
            value={currentZoneId}
            onChange={(e) => setCurrentZoneId(e.target.value)}
          >
            <option value="">Not sure / not set</option>
            {gateZones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="check">
            <input
              type="checkbox"
              checked={accessibleRoute}
              onChange={(e) => setAccessibleRoute(e.target.checked)}
            />
            Step-free / accessible routes only
          </label>
        </div>
      </aside>

      <section className="card chat" aria-label="Concierge chat">
        <h2 id="chat-heading">Ask the concierge</h2>
        <div
          className="chat__log"
          ref={logRef}
          role="log"
          aria-live="polite"
          aria-relevant="additions"
        >
          {messages.length === 0 ? (
            <p className="muted">
              Ask about directions, amenities, transport, accessibility, or the
              match schedule.
            </p>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`msg ${m.role === 'user' ? 'msg--user' : 'msg--bot'}`}
              >
                {m.text}
                {m.meta ? <div className="msg__meta">{m.meta}</div> : null}
              </div>
            ))
          )}
        </div>

        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}

        <form
          className="chat__form"
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
        >
          <label htmlFor="chat-input" className="visually-hidden">
            Type your question
          </label>
          <input
            id="chat-input"
            type="text"
            value={input}
            placeholder="e.g. How do I get to Gate C?"
            onChange={(e) => setInput(e.target.value)}
            disabled={busy}
          />
          <button
            type="submit"
            className="btn btn--primary"
            disabled={busy || input.trim().length === 0}
          >
            {busy ? 'Thinking…' : 'Send'}
          </button>
        </form>

        <div className="suggestions" aria-label="Example questions">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              className="chip"
              onClick={() => void send(s)}
              disabled={busy}
            >
              {s}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
