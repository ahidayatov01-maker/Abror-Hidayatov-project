import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Bot,
  Check,
  CheckCircle2,
  Copy,
  Globe2,
  GraduationCap,
  History,
  Loader2,
  Lock,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useWorkspaceIntelligence } from '../context/WorkspaceIntelligenceContext';
import {
  AGENT_TEAMS,
  AI_AGENTS,
  type AgentId,
  type AgentTeamId,
  type ProposedAgentAction,
} from '../utils/aiAgentsRegistry';
import { canAccessAgent } from '../utils/entitlements';
import { formatCleanUniversityName, getUniversalMicroCopy } from '../utils/displayCopy';
import type { NavSectionId } from '../types/domain';

interface AdvisorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  activeAgents?: Array<{ id: AgentId; name: string; teamId: AgentTeamId; shortRole: string }>;
  lockedAgentNotices?: Array<{ id: AgentId; name: string; minimumTier: string }>;
  matchedUniversities?: Array<{
    slug: string;
    name: string;
    shortName: string;
    countryCode: string;
    tuition: string;
  }>;
  matchedScholarships?: Array<{
    slug: string;
    name: string;
    deadline: string;
    coverage: string;
  }>;
  proposedActions?: ProposedAgentAction[];
  executionSteps?: string[];
  error?: boolean;
}

export const AIAdvisorView: React.FC = () => {
  const {
    profile,
    isGuest,
    language,
    savedUniversities,
    compareSlugs,
    saveUniversity,
    toggleCompareSlug,
    addJourneyTask,
    openUniversityProfile,
    setActiveSection,
    t,
  } = useApp();

  const {
    entitlementStatus,
    refreshEntitlementStatus,
    agentLogs,
    addAgentLog,
    requestMapFocus,
    roadmapState,
    getAuthHeaders,
    showToast,
  } = useWorkspaceIntelligence();

  const [selectedTeamFilter, setSelectedTeamFilter] = useState<'all' | AgentTeamId>('all');
  const [focusedAgentId, setFocusedAgentId] = useState<AgentId | null>(null);
  const [messages, setMessages] = useState<AdvisorMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [runningAgentIds, setRunningAgentIds] = useState<AgentId[]>([]);
  const [lastUsedAgentIds, setLastUsedAgentIds] = useState<AgentId[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pendingConfirmActionKey, setPendingConfirmActionKey] = useState<string | null>(null);
  const [executedActionKeys, setExecutedActionKeys] = useState<Record<string, string>>({});
  const [showLogs, setShowLogs] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const visibleAgents = useMemo(
    () =>
      selectedTeamFilter === 'all'
        ? AI_AGENTS
        : AI_AGENTS.filter((a) => a.teamId === selectedTeamFilter),
    [selectedTeamFilter]
  );

  const micro = useMemo(() => getUniversalMicroCopy(language), [language]);
  const localizedGuestName =
    language === 'uz' ? 'Talaba' : language === 'ru' ? 'Студент' : 'Explorer';
  const rawDisplayName = profile.displayName?.trim() || '';
  const isDefaultGuestLabel =
    isGuest || rawDisplayName.toLowerCase() === 'free explorer' || !rawDisplayName;
  const userGreetingName =
    profile.firstName?.trim() ||
    (!isDefaultGuestLabel ? rawDisplayName.split(/\s+/)[0] : localizedGuestName);
  const inputPlaceholder =
    language === 'uz'
      ? 'Universitet, grant yoki reja haqida so‘rang...'
      : language === 'ru'
      ? 'Спросите о вузах, грантах или плане...'
      : 'Ask about universities, grants, or roadmaps...';

  const quotaUsed = entitlementStatus.usage.aiMessagesToday;
  const quotaLimit = entitlementStatus.entitlements.dailyAiMessages;
  const quotaPct = Math.min(100, Math.round((quotaUsed / Math.max(1, quotaLimit)) * 100));

  const scrollToBottom = () => {
    window.setTimeout(() => {
      const container = messagesContainerRef.current;
      if (container) {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      }
    }, 60);
  };

  const handleSendMessage = async (overrideText?: string) => {
    const query = (overrideText ?? input).trim();
    if (!query || sending) return;

    const userMsg: AdvisorMessage = {
      id: `msg-u-${Date.now()}`,
      role: 'user',
      content: query,
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    if (!overrideText) setInput('');
    setSending(true);
    setRunningAgentIds(focusedAgentId ? [focusedAgentId] : ['university_scout']);
    scrollToBottom();

    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/ai/advisor', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: query,
          language,
          preferredAgentId: focusedAgentId,
          preferredTeamId: selectedTeamFilter === 'all' ? null : selectedTeamFilter,
          history: nextHistory.slice(-6).map((m) => ({ role: m.role, content: m.content })),
          userContext: {
            displayName: profile.displayName,
            country: profile.country,
            currentEducationLevel: profile.currentEducationLevel,
            targetDegree: profile.targetDegree,
            targetDisciplines: profile.targetDisciplines,
            savedUniversities: savedUniversities.map((u) => u.universitySlug),
            targetUniversityName: roadmapState.targetUniversityName,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'AI Maslahatchi could not complete this request.');
      }

      const activeAgents = Array.isArray(data.activeAgents) ? data.activeAgents : [];
      const activeIds: AgentId[] = activeAgents.map((a: { id: AgentId }) => a.id);
      setLastUsedAgentIds(activeIds);

      const assistantMsg: AdvisorMessage = {
        id: `msg-a-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'No advisory response returned.',
        activeAgents,
        lockedAgentNotices: Array.isArray(data.lockedAgentNotices) ? data.lockedAgentNotices : [],
        matchedUniversities: Array.isArray(data.matchedUniversities) ? data.matchedUniversities : [],
        matchedScholarships: Array.isArray(data.matchedScholarships) ? data.matchedScholarships : [],
        proposedActions: Array.isArray(data.proposedActions) ? data.proposedActions : [],
        executionSteps: Array.isArray(data.executionSteps) ? data.executionSteps : [],
      };

      setMessages((prev) => [...prev, assistantMsg]);
      addAgentLog({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        query: query.slice(0, 120),
        activeAgentIds: activeIds.length > 0 ? activeIds : ['university_scout'],
        summary: (data.reply || '').slice(0, 140),
        status: 'completed',
        executedActions: [],
      });

      await refreshEntitlementStatus();
      scrollToBottom();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Network error contacting AI Maslahatchi.';
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          role: 'assistant',
          content: errMsg,
          error: true,
        },
      ]);
      scrollToBottom();
    } finally {
      setSending(false);
      setRunningAgentIds([]);
    }
  };

  const executeApprovedAction = async (msgId: string, action: ProposedAgentAction) => {
    const actionKey = `${msgId}:${action.id}`;
    try {
      switch (action.type) {
        case 'save_university': {
          const slug = String(action.payload.universitySlug || '');
          if (!slug) throw new Error('Missing university slug.');
          await saveUniversity({ universitySlug: slug });
          setExecutedActionKeys((prev) => ({ ...prev, [actionKey]: 'Saved to My Universities' }));
          showToast(`Saved ${String(action.payload.universityName || slug)} to My Universities.`, 'success');
          break;
        }
        case 'add_comparison': {
          const slugs = Array.isArray(action.payload.slugs) ? (action.payload.slugs as string[]) : [];
          for (const slug of slugs) {
            if (!compareSlugs.includes(slug)) toggleCompareSlug(slug);
          }
          setExecutedActionKeys((prev) => ({ ...prev, [actionKey]: 'Added to Comparison' }));
          setActiveSection('university-comparison');
          showToast('Opened side-by-side university comparison.', 'info');
          break;
        }
        case 'locate_map_university': {
          const slug = String(action.payload.universitySlug || '');
          const countryCode = String(action.payload.countryCode || '');
          setActiveSection('world-explorer');
          requestMapFocus({ countryCode, universitySlug: slug });
          setExecutedActionKeys((prev) => ({ ...prev, [actionKey]: 'Focused on 3D Globe' }));
          showToast(`Located ${String(action.payload.universityName || slug)} on World Explorer.`, 'info');
          break;
        }
        case 'create_task': {
          const title = String(action.payload.title || '').trim();
          if (!title) throw new Error('Missing task title.');
          const catRaw = String(action.payload.category || 'Admissions');
          const taskCategory = catRaw === 'Scholarships' ? 'Scholarships' : 'Admissions';
          await addJourneyTask({
            title,
            category: taskCategory,
            targetUniversitySlug: action.payload.targetUniversitySlug
              ? String(action.payload.targetUniversitySlug)
              : null,
            dueDate: null,
            status: 'pending',
            notes: 'Created from AI Maslahatchi approved recommendation',
          });
          setExecutedActionKeys((prev) => ({ ...prev, [actionKey]: 'Added to To-Do List' }));
          showToast(`Added "${title}" to Mening vazifalarim (To-Do List).`, 'success');
          break;
        }
        case 'create_habit': {
          setActiveSection('paper-journal');
          setExecutedActionKeys((prev) => ({ ...prev, [actionKey]: 'Opened Habits Tracker' }));
          showToast('Opened Habits Tracker to configure your study habit.', 'info');
          break;
        }
        case 'open_roadmap_generator': {
          setActiveSection('my-academic-journey');
          setExecutedActionKeys((prev) => ({ ...prev, [actionKey]: "Opened Akademik yo'lim" }));
          break;
        }
        case 'open_routine_generator': {
          setActiveSection('routine');
          setExecutedActionKeys((prev) => ({ ...prev, [actionKey]: 'Opened Routine Planner' }));
          break;
        }
        case 'navigate_section': {
          const sec = action.payload.section as NavSectionId;
          if (sec) setActiveSection(sec);
          setExecutedActionKeys((prev) => ({ ...prev, [actionKey]: 'Navigated' }));
          break;
        }
      }
      setPendingConfirmActionKey(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Action could not be completed.', 'error');
    }
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1600);
    } catch {
      // ignore clipboard error
    }
  };

  return (
    <div className="space-y-6" data-testid="ai-advisor-view">
      {/* Compact Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[var(--border-hairline)] pb-5">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold">
          {t.nav.aiAdvisor}
        </h1>

        <div className="flex flex-wrap items-center gap-3">
          {/* Live Server Quota Indicator */}
          <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-3.5 py-2 min-w-[210px]">
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span className="font-semibold">
                {entitlementStatus.isOwner
                  ? 'Global Elite Pro · Owner'
                  : entitlementStatus.entitlements.name}
              </span>
              <span className="font-mono-tabular text-[var(--text-muted)]">
                {entitlementStatus.unlimitedQuotas
                  ? `${quotaUsed} · Unlimited`
                  : `${quotaUsed}/${quotaLimit} today`}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[var(--border-hairline)] mt-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  entitlementStatus.isOwner
                    ? 'bg-emerald-500'
                    : 'bg-[var(--accent-primary)]'
                }`}
                style={{ width: entitlementStatus.unlimitedQuotas ? '100%' : `${quotaPct}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowLogs((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium border border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <History className="w-4 h-4" />
            Logs ({agentLogs.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setMessages([]);
              setFocusedAgentId(null);
              setExecutedActionKeys({});
            }}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium border border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <RotateCcw className="w-4 h-4" />
            New Consultation
          </button>
        </div>
      </div>

      {/* Main Two-Column Hub: Left = 10-Agent Directory, Right = Consultation Stream */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left: 3 Teams & 10 Specialized Agent Cards */}
        <aside
          className="xl:col-span-5 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-4 space-y-4"
          data-testid="ai-agents-directory"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">{micro.about.agentsHeading}</h2>
            {focusedAgentId && (
              <button
                type="button"
                onClick={() => setFocusedAgentId(null)}
                className="text-[11px] font-medium text-[var(--accent-primary)] hover:underline"
              >
                Auto-route
              </button>
            )}
          </div>

          {/* 3-Team Filter Tabs */}
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedTeamFilter('all')}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                selectedTeamFilter === 'all'
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)]'
                  : 'border border-[var(--border-hairline)] text-[var(--text-secondary)]'
              }`}
            >
              All 10 Agents
            </button>
            {AGENT_TEAMS.map((team) => (
              <button
                key={team.id}
                type="button"
                onClick={() => setSelectedTeamFilter(team.id)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  selectedTeamFilter === team.id
                    ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)]'
                    : 'border border-[var(--border-hairline)] text-[var(--text-secondary)]'
                }`}
              >
                {team.shortName}
              </button>
            ))}
          </div>

          {/* 10 Agent Cards */}
          <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
            {visibleAgents.map((agent) => {
              const unlocked = canAccessAgent(
                entitlementStatus.tier,
                agent.id,
                entitlementStatus.isOwner
              );
              const isFocused = focusedAgentId === agent.id;
              const isRunning = runningAgentIds.includes(agent.id);
              const wasUsed = lastUsedAgentIds.includes(agent.id);

              return (
                <div
                  key={agent.id}
                  className={`rounded-xl border p-3 transition-all ${
                    isFocused
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/8'
                      : 'border-[var(--border-hairline)] bg-[var(--bg-surface)]'
                  }`}
                  data-testid={`agent-card-${agent.id}`}
                >
                  <div
                    title={agent.description}
                    className="flex items-start justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Bot className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0" />
                        <p className="text-xs font-semibold truncate">{agent.name}</p>
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate">
                        {agent.shortRole}
                      </p>
                    </div>

                    {!unlocked ? (
                      <button
                        type="button"
                        onClick={() => setActiveSection('subscriptions')}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300 shrink-0 hover:underline"
                      >
                        <Lock className="w-3 h-3" />
                        {agent.minimumTier === 'premium' ? 'Elite Pro' : 'Scholar Plus'}
                      </button>
                    ) : isRunning ? (
                      <span className="text-[10px] font-semibold text-[var(--accent-primary)] shrink-0">
                        Running…
                      </span>
                    ) : wasUsed ? (
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                        Active
                      </span>
                    ) : (
                      <span className="text-[10px] text-[var(--text-muted)] shrink-0">Ready</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-[var(--border-hairline)]">
                    <button
                      type="button"
                      disabled={!unlocked}
                      onClick={() => setFocusedAgentId(isFocused ? null : agent.id)}
                      className="text-[11px] font-semibold text-[var(--accent-primary)] disabled:opacity-45 hover:underline"
                    >
                      {isFocused ? 'Targeted ✓' : 'Target Agent'}
                    </button>
                    <button
                      type="button"
                      disabled={!unlocked || sending}
                      onClick={() => {
                        setFocusedAgentId(agent.id);
                        setInput(agent.samplePrompt);
                      }}
                      className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-40"
                    >
                      Load prompt
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent Execution Logs */}
          {showLogs && (
            <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Recent Orchestrator Runs
              </p>
              {agentLogs.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)]">No consultations logged yet.</p>
              ) : (
                agentLogs.slice(0, 5).map((log) => (
                  <div
                    key={log.id}
                    className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-2 text-[11px]"
                  >
                    <p className="font-medium truncate">{log.query}</p>
                    <p className="text-[var(--text-muted)] mt-0.5">
                      Agents: {log.activeAgentIds.join(', ')} ·{' '}
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </aside>

        {/* Right: Central Consultation Stream */}
        <section className="xl:col-span-7 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] flex flex-col min-h-[600px] max-h-[760px]">
          {/* Messages Container */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4 space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-[var(--accent-primary)]/12 text-[var(--accent-primary)] flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h2
                  data-testid="ai-advisor-greeting"
                  className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text-primary)] max-w-md"
                >
                  {micro.advisorGreeting(userGreetingName)}
                </h2>

                <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-xl">
                  {micro.advisorChips.map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => void handleSendMessage(chip.prompt)}
                      className="rounded-full border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 py-2 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors cursor-pointer"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[92%] rounded-2xl p-4 space-y-3 ${
                      msg.role === 'user'
                        ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)]'
                        : msg.error
                        ? 'border border-rose-500/35 bg-rose-500/10 text-rose-800 dark:text-rose-200'
                        : 'border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-primary)]'
                    }`}
                  >
                    {/* Active Agent Attribution */}
                    {msg.role === 'assistant' && msg.activeAgents && msg.activeAgents.length > 0 && (
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-hairline)] pb-2 text-[11px]">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                          <span className="font-semibold text-[var(--accent-primary)]">
                            {msg.activeAgents.map((a) => a.name).join(' · ')}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleCopy(msg.id, msg.content)}
                          className="inline-flex items-center gap-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" /> Copy
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {msg.error && (
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>Consultation Error</span>
                      </div>
                    )}

                    <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </div>

                    {/* Tier Notice if user asked for a locked agent */}
                    {msg.lockedAgentNotices && msg.lockedAgentNotices.length > 0 && (
                      <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-800 dark:text-amber-200 flex items-center justify-between gap-2">
                        <span>
                          Specialized agent{' '}
                          <strong>{msg.lockedAgentNotices.map((l) => l.name).join(', ')}</strong>{' '}
                          requires an upgraded tier.
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveSection('subscriptions')}
                          className="font-semibold underline shrink-0"
                        >
                          View Plans
                        </button>
                      </div>
                    )}

                    {/* Grounded Matched Universities */}
                    {msg.matchedUniversities && msg.matchedUniversities.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {msg.matchedUniversities.map((u) => (
                          <div
                            key={u.slug}
                            className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-2.5 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-semibold truncate">
                                {formatCleanUniversityName(u.name)}
                              </p>
                              <p className="text-[11px] text-[var(--text-muted)] truncate">
                                {u.countryCode} · {u.tuition}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => openUniversityProfile(u.slug)}
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium border border-[var(--border-hairline)] hover:border-[var(--accent-primary)] shrink-0"
                            >
                              <GraduationCap className="w-3 h-3" />
                              Open
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Permission-Gated Workspace Actions */}
                    {msg.proposedActions && msg.proposedActions.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-[var(--border-hairline)]">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                          Proposed Workspace Actions
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {msg.proposedActions.map((act) => {
                            const key = `${msg.id}:${act.id}`;
                            const doneLabel = executedActionKeys[key];
                            const awaitingConfirm = pendingConfirmActionKey === key;

                            if (doneLabel) {
                              return (
                                <span
                                  key={act.id}
                                  className="inline-flex items-center gap-1 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  {doneLabel}
                                </span>
                              );
                            }

                            if (awaitingConfirm) {
                              return (
                                <div
                                  key={act.id}
                                  className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--accent-primary)] bg-[var(--bg-elevated)] px-2.5 py-1 text-xs"
                                >
                                  <span className="font-medium">Confirm {act.label}?</span>
                                  <button
                                    type="button"
                                    onClick={() => void executeApprovedAction(msg.id, act)}
                                    className="rounded-lg px-2 py-0.5 text-[11px] font-semibold bg-emerald-600 text-white"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setPendingConfirmActionKey(null)}
                                    className="text-[11px] text-[var(--text-muted)] px-1"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              );
                            }

                            return (
                              <button
                                key={act.id}
                                type="button"
                                onClick={() => {
                                  if (act.requiresApproval) {
                                    setPendingConfirmActionKey(key);
                                  } else {
                                    void executeApprovedAction(msg.id, act);
                                  }
                                }}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
                              >
                                {act.type === 'locate_map_university' && (
                                  <Globe2 className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                                )}
                                <span>{act.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {sending && (
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] px-2">
                <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-primary)]" />
                <span>Orchestrator coordinating specialized agents and verified catalog…</span>
              </div>
            )}
          </div>

          {/* Input Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSendMessage();
            }}
            className="border-t border-[var(--border-hairline)] p-3.5 bg-[var(--bg-surface)] rounded-b-2xl space-y-2"
          >
            {focusedAgentId && (
              <div className="flex items-center justify-between text-[11px] text-[var(--accent-primary)] px-1">
                <span>
                  Directing query to:{' '}
                  <strong>{AI_AGENTS.find((a) => a.id === focusedAgentId)?.name}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setFocusedAgentId(null)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  Clear target
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={inputPlaceholder}
                className="flex-1 rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
                data-testid="ai-advisor-input"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold bg-[var(--accent-primary)] text-[var(--accent-contrast)] hover:opacity-95 disabled:opacity-40"
                data-testid="ai-advisor-send-btn"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Send</span>
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};
