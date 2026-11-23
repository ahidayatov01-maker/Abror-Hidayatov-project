import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  Compass,
  Globe2,
  Target,
} from 'lucide-react';
import { GlassCard, GlassButton } from '../glass';
import { useApp } from '../../context/AppContext';
import { useWorkspaceIntelligence } from '../../context/WorkspaceIntelligenceContext';
import { getGoalsTranslations } from '../../i18n/goalsTranslations';
import { getUniversalMicroCopy } from '../../utils/displayCopy';
import {
  computeGoalsAnalytics,
  countActiveGoals,
  hasDuplicateCertificateGoal,
  type GoalRecord,
} from '../../utils/goalsEngine';
import { checkActiveGoalQuota } from '../../utils/entitlements';
import type { CertificateRecord } from '../../data/certificatesCatalog';
import { GoalsOverviewTab } from './GoalsOverviewTab';
import { CertificateExplorerTab } from './CertificateExplorerTab';
import { CountrySimulatorTab } from './CountrySimulatorTab';
import { PersonalGoalsTab } from './PersonalGoalsTab';
import { GoalsAnalyticsTab } from './GoalsAnalyticsTab';
import { GoalFormModal } from './GoalFormModal';
import { GoalStrategistModal } from './GoalStrategistModal';

type MaqsadlarTabId = 'overview' | 'certificates' | 'simulator' | 'my-goals' | 'analytics';

export const MaqsadlarView: React.FC = () => {
  const { language } = useApp();
  const { goalsState, setGoalsState, entitlementStatus, showToast } = useWorkspaceIntelligence();

  const t = useMemo(() => getGoalsTranslations(language), [language]);
  const micro = useMemo(() => getUniversalMicroCopy(language), [language]);
  const [activeTab, setActiveTab] = useState<MaqsadlarTabId>('overview');

  // Shared modals across tabs
  const [formOpen, setFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalRecord | null>(null);
  const [prefillCert, setPrefillCert] = useState<CertificateRecord | null>(null);
  const [strategistGoalId, setStrategistGoalId] = useState<string | null>(null);

  const analytics = useMemo(() => computeGoalsAnalytics(goalsState.goals), [goalsState.goals]);
  const activeCount = useMemo(() => countActiveGoals(goalsState.goals), [goalsState.goals]);
  const quota = useMemo(
    () => checkActiveGoalQuota(entitlementStatus.tier, activeCount, entitlementStatus.isOwner),
    [entitlementStatus.tier, activeCount, entitlementStatus.isOwner]
  );

  const strategistGoal = useMemo(
    () => goalsState.goals.find((g) => g.id === strategistGoalId) || null,
    [goalsState.goals, strategistGoalId]
  );

  const handleOpenCreateGoal = () => {
    if (!quota.allowed && !entitlementStatus.isOwner) {
      showToast(t.goalsWorkspace.quotaReachedBanner, 'info');
      return;
    }
    setEditingGoal(null);
    setPrefillCert(null);
    setFormOpen(true);
  };

  const handleAddCertificateAsGoal = (cert: CertificateRecord) => {
    if (hasDuplicateCertificateGoal(goalsState.goals, cert.id)) {
      showToast(`${cert.officialName}: ${t.certExplorer.alreadyInGoals}`, 'info');
      return;
    }
    if (!quota.allowed && !entitlementStatus.isOwner) {
      showToast(t.goalsWorkspace.quotaReachedBanner, 'info');
      return;
    }
    setEditingGoal(null);
    setPrefillCert(cert);
    setFormOpen(true);
  };

  const handleSaveGoal = (record: GoalRecord, isNew: boolean) => {
    setGoalsState((prev) => {
      const nextGoals = isNew
        ? [record, ...prev.goals]
        : prev.goals.map((g) => (g.id === record.id ? record : g));
      return {
        ...prev,
        goals: nextGoals,
        updatedAt: new Date().toISOString(),
      };
    });
    showToast(isNew ? `Goal created: ${record.title}` : `Goal updated: ${record.title}`, 'success');
    if (isNew && activeTab === 'certificates') {
      setActiveTab('my-goals');
    }
  };

  const tabs: Array<{ id: MaqsadlarTabId; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'overview', label: t.tabs.overview, icon: Compass },
    { id: 'certificates', label: t.tabs.certificates, icon: BookOpen },
    { id: 'simulator', label: t.tabs.simulator, icon: Globe2 },
    { id: 'my-goals', label: t.tabs.myGoals, icon: Target },
    { id: 'analytics', label: t.tabs.analytics, icon: BarChart3 },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
          {t.pageTitle}
        </h1>

        <div className="flex items-center gap-2.5">
          <GlassButton
            variant="primary"
            onClick={handleOpenCreateGoal}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
          >
            {micro.addGoal}
          </GlassButton>
        </div>
      </div>

      {/* Concise 4-KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <GlassCard className="p-4 flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
              {t.kpis.activeGoals}
            </p>
            <p className="text-xl font-semibold tabular-nums text-[var(--text-primary)] mt-0.5">
              {analytics.activeGoals}
            </p>
          </div>
          <span className="text-[11px] tabular-nums text-[var(--text-muted)]">
            {entitlementStatus.isOwner
              ? t.kpis.unlimited
              : `${quota.remaining}/${quota.limit}`}
          </span>
        </GlassCard>

        <GlassCard className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
            {t.kpis.achievedGoals}
          </p>
          <p className="text-xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
            {analytics.achievedGoals}
          </p>
        </GlassCard>

        <GlassCard className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
            {t.kpis.averageProgress}
          </p>
          <p className="text-xl font-semibold tabular-nums text-[var(--accent-primary)] mt-0.5">
            {analytics.averageComputableProgress !== null
              ? `${analytics.averageComputableProgress}%`
              : '—'}
          </p>
        </GlassCard>

        <GlassCard className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
            {t.kpis.nearestDeadline}
          </p>
          <p className="text-sm font-semibold tabular-nums text-[var(--text-primary)] truncate mt-1">
            {analytics.nearestDeadline
              ? `${analytics.nearestDeadline.remainingDays} ${t.kpis.daysLeft} · ${analytics.nearestDeadline.goalTitle}`
              : t.kpis.noDeadline}
          </p>
        </GlassCard>
      </div>

      {/* 5 Internal Section Tabs */}
      <nav
        aria-label="Maqsadlar sections"
        className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[var(--border-hairline)]"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 px-3.5 py-2.5 rounded-t-xl text-xs font-semibold inline-flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
                isActive
                  ? 'border-[var(--accent-primary)] text-[var(--accent-primary)] bg-[var(--bg-surface)]'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Active Tab Content */}
      {activeTab === 'overview' && (
        <GoalsOverviewTab
          t={t}
          onCreateGoal={handleOpenCreateGoal}
          onOpenCertificates={() => setActiveTab('certificates')}
          onOpenSimulator={() => setActiveTab('simulator')}
          onOpenMyGoals={() => setActiveTab('my-goals')}
          onOpenStrategist={(g) => setStrategistGoalId(g.id)}
        />
      )}

      {activeTab === 'certificates' && (
        <CertificateExplorerTab
          t={t}
          onAddCertificateAsGoal={handleAddCertificateAsGoal}
        />
      )}

      {activeTab === 'simulator' && <CountrySimulatorTab t={t} />}

      {activeTab === 'my-goals' && (
        <PersonalGoalsTab
          t={t}
          onCreateGoal={handleOpenCreateGoal}
          onEditGoal={(g) => {
            setEditingGoal(g);
            setPrefillCert(null);
            setFormOpen(true);
          }}
          onOpenStrategist={(g) => setStrategistGoalId(g.id)}
        />
      )}

      {activeTab === 'analytics' && <GoalsAnalyticsTab t={t} />}

      {/* Shared Create/Edit Goal Modal */}
      <GoalFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        t={t}
        editingGoal={editingGoal}
        prefillCertificate={prefillCert}
        onSave={handleSaveGoal}
      />

      {/* Shared AI Goal Strategist & Ecosystem Sync Modal */}
      <GoalStrategistModal
        open={Boolean(strategistGoal)}
        onClose={() => setStrategistGoalId(null)}
        goal={strategistGoal}
        t={t}
      />
    </div>
  );
};
