import React, { useEffect } from 'react';
import { AnimatePresence, MotionConfig } from 'motion/react';
import { AppProvider, useApp } from './context/AppContext';
import { WorkspaceIntelligenceProvider } from './context/WorkspaceIntelligenceContext';
import { AuthWelcomeScreen } from './components/AuthWelcomeScreen';
import { AppShell } from './components/TopBarAndNav';
import { LiquidGlassController } from './motion/LiquidGlassController';
import { MotionPageStage } from './motion/MotionPrimitives';
import { DashboardView } from './components/DashboardView';
import { WorldExplorerView } from './components/WorldExplorerView';
import { ExploreByCityView } from './components/ExploreByCityView';
import { CountriesView } from './components/CountriesView';
import { UniversitiesView } from './components/UniversitiesView';
import { AcademicProgramsView } from './components/AcademicProgramsView';
import { ScholarshipsView } from './components/ScholarshipsView';
import { GlobalRankingsView } from './components/GlobalRankingsView';
import { AdmissionIntelligenceView } from './components/AdmissionIntelligenceView';
import { UniversityComparisonView } from './components/UniversityComparisonView';
import {
  MyAcademicJourneyView,
  MyUniversitiesView,
  ResearchLibraryView,
} from './components/PersonalWorkspaceViews';
import { FinancialPlannerView } from './components/FinancialPlannerView';
import { AIAdvisorView } from './components/AIAdvisorView';
import {
  AccountSettingsView,
  SubscriptionsAndPaymentsView,
} from './components/AccountAndBillingViews';
import { PaperJournalStudio } from './components/paper/PaperJournalStudio';
import { RoutineView } from './components/productivity/RoutineView';
import { TodoListView } from './components/productivity/TodoListView';
import { AboutPlatformView } from './components/AboutPlatformView';
import { MaqsadlarView } from './components/goals/MaqsadlarView';

const AppContent: React.FC = () => {
  const {
    authReady,
    isAuthenticatedOrGuest,
    needsOnboarding,
    activeSection,
    catalogLoading,
    catalogError,
    t,
  } = useApp();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [activeSection]);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex items-center justify-center p-6">
        <p className="font-display text-2xl text-[var(--text-secondary)]">
          {t.common.loading}
        </p>
      </div>
    );
  }

  if (!isAuthenticatedOrGuest || needsOnboarding) {
    return <AuthWelcomeScreen />;
  }

  const renderSection = () => {
    if (catalogLoading) {
      return (
        <div className="surface-card rounded-2xl p-12 text-center">
          <p className="font-display text-2xl text-[var(--text-secondary)]">
            {t.common.loading}
          </p>
        </div>
      );
    }

    if (catalogError) {
      return (
        <div role="alert" className="surface-card rounded-2xl p-8 space-y-2 border-red-400">
          <h2 className="font-display text-2xl font-semibold">Catalog Connection Error</h2>
          <p className="text-sm text-[var(--text-secondary)]">{catalogError}</p>
        </div>
      );
    }

    switch (activeSection) {
      case 'dashboard':
        return <DashboardView />;
      case 'world-explorer':
        return <WorldExplorerView />;
      case 'explore-by-city':
        return <ExploreByCityView />;
      case 'countries':
        return <CountriesView />;
      case 'universities':
        return <UniversitiesView />;
      case 'academic-programs':
        return <AcademicProgramsView />;
      case 'scholarships':
        return <ScholarshipsView />;
      case 'global-rankings':
        return <GlobalRankingsView />;
      case 'admission-intelligence':
        return <AdmissionIntelligenceView />;
      case 'university-comparison':
        return <UniversityComparisonView />;
      case 'my-universities':
        return <MyUniversitiesView />;
      case 'goals':
        return <MaqsadlarView />;
      case 'my-academic-journey':
        return <MyAcademicJourneyView />;
      case 'routine':
        return <RoutineView />;
      case 'todo-list':
        return <TodoListView />;
      case 'financial-planner':
        return <FinancialPlannerView />;
      case 'ai-advisor':
        return <AIAdvisorView />;
      case 'research-library':
        return <ResearchLibraryView />;
      case 'paper-journal':
        return <PaperJournalStudio />;
      case 'account-settings':
        return <AccountSettingsView />;
      case 'subscriptions':
        return <SubscriptionsAndPaymentsView />;
      case 'about':
        return <AboutPlatformView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <AppShell>
      <AnimatePresence mode="wait" initial={false}>
        <MotionPageStage key={activeSection} section={activeSection}>
          {renderSection()}
        </MotionPageStage>
      </AnimatePresence>
    </AppShell>
  );
};

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <LiquidGlassController />
      <AppProvider>
        <WorkspaceIntelligenceProvider>
          <AppContent />
        </WorkspaceIntelligenceProvider>
      </AppProvider>
    </MotionConfig>
  );
}
