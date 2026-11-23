import React, { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  Headphones,
  Loader2,
  Mic,
  MicOff,
  Send,
  Square,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useWorkspaceIntelligence } from '../../context/WorkspaceIntelligenceContext';
import { resolveSemanticVoiceCommand } from '../../utils/semanticNavigation';
import type { LanguageCode, NavSectionId } from '../../types/domain';

interface BrowserSpeechRecognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

const SPEECH_LOCALE: Record<LanguageCode, string> = {
  en: 'en-US',
  uz: 'uz-UZ',
  ru: 'ru-RU',
  ja: 'ja-JP',
  zh: 'zh-CN',
  de: 'de-DE',
};

const SECTION_TUTORIALS: Record<NavSectionId, { title: string; guide: string }> = {
  dashboard: {
    title: 'Dashboard Overview',
    guide:
      'Your central academic overview showing saved universities, readiness progress, upcoming deadlines, and quick shortcuts into World Explorer, Akademik yo\'lim, Routine, To-Do List, and AI Maslahatchi.',
  },
  'world-explorer': {
    title: '3D World Explorer',
    guide:
      'Rotate or search the interactive 3D globe to inspect countries and universities worldwide. Use Voice Navigator commands such as "Show Uzbekistan on the map" or "Locate MIT" to jump directly to any region.',
  },
  'explore-by-city': {
    title: 'Explore by City',
    guide:
      'Compare global student cities by housing, food, transit benchmarks, and local universities.',
  },
  countries: {
    title: 'Countries Intelligence',
    guide:
      'Inspect national higher-education systems, admission frameworks, language requirements, and typical tuition ranges.',
  },
  universities: {
    title: 'Verified University Directory',
    guide:
      'Filter verified universities by country, discipline, language, and tuition. Save top targets to My Universities or add them to side-by-side comparison.',
  },
  'academic-programs': {
    title: 'Academic Programs',
    guide:
      'Browse degree programs across Bachelor, Master, and Doctoral levels with duration, language, and tuition data.',
  },
  scholarships: {
    title: 'Scholarships & Grants',
    guide:
      'Explore verified international scholarships including MEXT, DAAD, Chevening, GKS, and Fulbright, then save matching grants to your tracker.',
  },
  'global-rankings': {
    title: 'Global Rankings',
    guide:
      'Review transparent ranking benchmarks alongside official institutional data rather than relying on a single metric.',
  },
  'admission-intelligence': {
    title: 'Admission Intelligence',
    guide:
      'Track entry requirements, language thresholds, and required application documents for each target institution.',
  },
  'university-comparison': {
    title: 'University Comparison',
    guide:
      'Compare up to 2–6 shortlisted universities side by side across tuition, language, strengths, and admission criteria.',
  },
  'my-universities': {
    title: 'My Universities',
    guide:
      'Manage your personal Reach, Target, and Safety university shortlist along with application statuses and private notes.',
  },
  goals: {
    title: 'Maqsadlar — Global Goals & Certificates',
    guide:
      'Discover international certificates, simulate their country-by-country value across universities, careers, and scholarships, track personal goals across 5 measurement types, and build AI-powered preparation plans synced to your Routine, To-Do List, and Habits Tracker.',
  },
  'my-academic-journey': {
    title: "Akademik yo'lim — Navigation Map",
    guide:
      'Interactive multi-route academic navigation map. Switch between Direct, Transfer, and Scholarship tracks, click any station to inspect requirements and evidence tags, or generate tailored routes with the Academic Cartographer Agent.',
  },
  routine: {
    title: 'Smart Routine Planner',
    guide:
      'Organize balanced Daily, Weekly, Monthly, and Yearly schedules. Lock your custom time blocks so the Smart Routine Architect Agent never overwrites them when generating new plans.',
  },
  'todo-list': {
    title: 'To-Do List',
    guide:
      'Review AI-recommended tasks in Area A (Accept, Edit, or Dismiss) and manage your personal tasks in Area B with priority, deadlines, and Overdue/Upcoming filters.',
  },
  'paper-journal': {
    title: 'Habits Tracker',
    guide:
      'Build daily study consistency with streak analytics, bento progress tracking, and an optional physical notebook archive.',
  },
  'financial-planner': {
    title: 'Financial Planner',
    guide:
      'Calculate net annual study budgets across tuition, housing, food, transit, insurance, and scholarships with live currency conversion.',
  },
  'ai-advisor': {
    title: 'AI Maslahatchi — 10-Agent Hub',
    guide:
      'Consult our 10 specialized AI agents across 3 teams. Ask questions in your chosen language, inspect which agents are active, and approve proposed workspace actions.',
  },
  'research-library': {
    title: 'Research Library',
    guide:
      'Organize PDFs, notes, and web references in folders, run AI document analysis, and build study schedules from your saved research materials.',
  },
  'account-settings': {
    title: 'Account & Settings',
    guide:
      'Update your academic profile, preferred language, Light/Dark/Monochrome theme, and export your personal workspace data.',
  },
  subscriptions: {
    title: 'Plans & Billing',
    guide:
      'Compare Free Explorer, Scholar Plus, and Global Elite Pro tiers, inspect your real daily AI usage quotas, and review payment gateway status.',
  },
  about: {
    title: 'About & Creator',
    guide:
      'Learn about Global University Intelligence, its 10-agent ecosystem, data integrity standards, and creator profile.',
  },
};

export const AudioGuideControl: React.FC = () => {
  const { activeSection, language, catalog, t, profile } = useApp();
  const {
    executeSemanticAction,
    tutorialSection,
    setTutorialSection,
    getAuthHeaders,
    showToast,
  } = useWorkspaceIntelligence();

  const [panelOpen, setPanelOpen] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [commandInput, setCommandInput] = useState('');
  const [lastTranscript, setLastTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);

  const speechSupported =
    typeof window !== 'undefined' &&
    Boolean(
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
        .SpeechRecognition ||
        (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
          .webkitSpeechRecognition
    );

  const ttsSupported =
    typeof window !== 'undefined' && typeof window.speechSynthesis !== 'undefined';

  const stopSpeaking = () => {
    if (ttsSupported) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const speakText = (text: string) => {
    if (!audioEnabled || !ttsSupported || !text.trim()) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = SPEECH_LOCALE[language] || 'en-US';
      utterance.rate = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSpeaking(false);
    }
  };

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
        if (typeof window !== 'undefined' && window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
      } catch {
        // ignore cleanup errors
      }
    };
  }, []);

  const processCommand = async (rawText: string) => {
    const query = rawText.trim();
    if (!query) return;
    setVoiceError(null);
    setLastTranscript(query);
    setIsProcessing(true);

    try {
      const lookupUnis = catalog.universities.map((u) => ({
        slug: u.slug,
        name: u.name,
        shortName: u.shortName,
        countryCode: u.countryCode,
      }));
      const match = resolveSemanticVoiceCommand(query, lookupUnis, activeSection);

      if (match.matched && match.actions.length > 0) {
        const confirmations: string[] = [];
        for (const action of match.actions) {
          const msg = await executeSemanticAction(action);
          confirmations.push(msg);
        }
        const reply = match.spokenReply || confirmations.join('. ');
        setLastResponse(reply);
        speakText(reply);
        setIsProcessing(false);
        return;
      }

      // Fall back to real Voice Guide & Platform Navigator AI Agent on server
      const headers = await getAuthHeaders();
      const res = await fetch('/api/ai/advisor', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: query,
          language,
          preferredAgentId: 'voice_navigator',
          userContext: {
            activeSection,
            country: profile.country,
            targetDegree: profile.targetDegree,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Voice Guide could not process that request.');
      }
      const replyText = String(data.reply || '').slice(0, 600);
      setLastResponse(replyText);
      speakText(replyText);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to process voice command.';
      setVoiceError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleMicrophone = () => {
    setVoiceError(null);
    if (!speechSupported) {
      setVoiceError(
        'Browser speech recognition is unavailable in this browser. Type your command below instead.'
      );
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
      return;
    }

    try {
      const SpeechCtor =
        (
          window as unknown as {
            SpeechRecognition?: new () => BrowserSpeechRecognition;
            webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
          }
        ).SpeechRecognition ||
        (
          window as unknown as {
            webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
          }
        ).webkitSpeechRecognition;
      if (!SpeechCtor) return;

      const recognition = new SpeechCtor();
      recognition.lang = SPEECH_LOCALE[language] || 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        setIsListening(false);
        if (transcript.trim()) {
          setCommandInput(transcript.trim());
          void processCommand(transcript.trim());
        }
      };
      recognition.onerror = (ev) => {
        setIsListening(false);
        if (ev.error === 'not-allowed') {
          setVoiceError(
            'Microphone permission was denied. Allow microphone access or type your command below.'
          );
        } else {
          setVoiceError(`Voice recognition stopped (${ev.error}). You can type your command below.`);
        }
      };
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      setIsListening(true);
      recognition.start();
    } catch {
      setIsListening(false);
      setVoiceError('Could not start microphone capture. Please type your command below.');
    }
  };

  const runPageTutorial = () => {
    const info = SECTION_TUTORIALS[activeSection] || SECTION_TUTORIALS.dashboard;
    setTutorialSection(activeSection);
    setLastResponse(`${info.title}: ${info.guide}`);
    speakText(`${info.title}. ${info.guide}`);
    showToast(`Contextual guide opened for ${info.title}`, 'info');
  };

  const activeTutorialInfo = tutorialSection
    ? SECTION_TUTORIALS[tutorialSection] || SECTION_TUTORIALS.dashboard
    : null;

  return (
    <div className="relative">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setPanelOpen((o) => !o)}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium border transition-colors ${
            panelOpen || isListening || isSpeaking
              ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/12 text-[var(--accent-primary)]'
              : 'border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]/60'
          }`}
          aria-expanded={panelOpen}
          aria-label={t.nav.audioGuide}
          data-testid="audio-guide-trigger"
        >
          <Headphones className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">{t.nav.audioGuide}</span>
        </button>

        {isSpeaking && (
          <button
            type="button"
            onClick={stopSpeaking}
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium border border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400"
            title="Stop speaking"
          >
            <Square className="w-3 h-3 fill-current" />
            <span className="hidden md:inline">Stop</span>
          </button>
        )}
      </div>

      {panelOpen && (
        <div
          className="absolute right-0 mt-2 w-[330px] sm:w-[370px] rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-solid-surface)] text-[var(--text-primary)] shadow-xl p-4 z-50 space-y-3"
          data-testid="audio-guide-popover"
        >
          <div className="flex items-center justify-between gap-2 border-b border-[var(--border-hairline)] pb-2.5">
            <div className="flex items-center gap-2">
              <Headphones className="w-4 h-4 text-[var(--accent-primary)]" />
              <div>
                <p className="text-xs font-semibold leading-tight">{t.nav.audioGuide}</p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Voice Navigator · {language.toUpperCase()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  if (audioEnabled) stopSpeaking();
                  setAudioEnabled((v) => !v);
                }}
                className={`px-2 py-1 rounded-md text-[11px] font-medium border flex items-center gap-1 ${
                  audioEnabled
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : 'border-[var(--border-hairline)] text-[var(--text-muted)]'
                }`}
                title="Toggle spoken audio output"
              >
                {audioEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                {audioEnabled ? 'ON' : 'OFF'}
              </button>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                aria-label="Close Audio Guide"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Primary Controls: Mic + Contextual Page Guide + Stop */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMicrophone}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                isListening
                  ? 'bg-rose-600 text-white'
                  : 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] hover:opacity-95'
              }`}
              data-testid="audio-guide-mic-btn"
            >
              {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              {isListening ? 'Listening… Tap to Stop' : 'Push to Speak'}
            </button>
            <button
              type="button"
              onClick={runPageTutorial}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium border border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:border-[var(--accent-primary)]/60"
              data-testid="audio-guide-tutorial-btn"
            >
              <BookOpen className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              Page Guide
            </button>
          </div>

          {/* Semantic Text Command Input (always available as precision fallback) */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!commandInput.trim() || isProcessing) return;
              const q = commandInput;
              setCommandInput('');
              void processCommand(q);
            }}
            className="flex items-center gap-1.5"
          >
            <input
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              placeholder='Try: "Show Uzbekistan on map" or "Open Routine"'
              className="flex-1 rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
              data-testid="audio-guide-input"
            />
            <button
              type="submit"
              disabled={isProcessing || !commandInput.trim()}
              className="rounded-xl p-2 bg-[var(--accent-primary)] text-[var(--accent-contrast)] disabled:opacity-40"
              aria-label="Execute voice command"
              data-testid="audio-guide-submit"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>

          {/* Quick Semantic Commands */}
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Quick Semantic Commands
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'Uzbekistan on Map', cmd: 'Show Uzbekistan on the world map' },
                { label: 'Locate UTokyo', cmd: 'Locate University of Tokyo' },
                { label: "Akademik yo'lim", cmd: "Open Akademik yo'lim" },
                { label: 'Routine', cmd: 'Open Routine' },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => void processCommand(item.cmd)}
                  className="text-[11px] px-2 py-1 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)]/50"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {voiceError && (
            <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-800 dark:text-amber-200">
              {voiceError}
            </div>
          )}

          {lastTranscript && (
            <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-2.5 space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                Command
              </p>
              <p className="text-xs font-medium">{lastTranscript}</p>
              {lastResponse && (
                <>
                  <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] pt-1">
                    Navigator Response
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                    {lastResponse}
                  </p>
                </>
              )}
            </div>
          )}

          {activeTutorialInfo && (
            <div className="rounded-xl border border-[var(--accent-primary)]/35 bg-[var(--accent-primary)]/8 p-3 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-[var(--accent-primary)]">
                  {activeTutorialInfo.title}
                </p>
                <button
                  type="button"
                  onClick={() => setTutorialSection(null)}
                  className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  Dismiss
                </button>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {activeTutorialInfo.guide}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
