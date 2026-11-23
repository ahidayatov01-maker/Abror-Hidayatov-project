import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarPlus,
  ExternalLink,
  FileText,
  FolderOpen,
  FolderPlus,
  Globe,
  Image as ImageIcon,
  Layers,
  Loader2,
  Pencil,
  Presentation,
  Search,
  Sparkles,
  Star,
  StickyNote,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type {
  FolderAccentVariant,
  LibraryFolderRecord,
  LibraryMaterialRecord,
  MaterialStudyStatus,
  MaterialType,
} from '../../types/domain';
import {
  computeFolderMetrics,
  FOLDER_ACCENT_VARIANTS,
} from '../../utils/researchLibraryEngine';
import { AddMaterialModal } from './AddMaterialModal';
import { AIPlannerWorkspace } from './AIPlannerWorkspace';
import { GlassFolder3D } from './GlassFolder3D';
import { GlassPlusButton } from './GlassPlusButton';
import { getLibraryStrings } from './libraryStrings';
import { MaterialPreviewModal } from './MaterialPreviewModal';

type HubMode = 'folders' | 'all_files' | 'planner';
type FolderSortKey = 'updated' | 'name' | 'progress' | 'count';

export const ResearchLibraryStudio: React.FC = () => {
  const {
    language,
    libraryWorkspace,
    createLibraryFolder,
    renameLibraryFolder,
    deleteLibraryFolder,
    toggleFavoriteFolder,
    updateLibraryMaterial,
    analyzeLibraryMaterial,
    addMaterialToPlan,
  } = useApp();

  const strings = getLibraryStrings(language);

  const [hubMode, setHubMode] = useState<HubMode>('folders');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState<FolderSortKey>('updated');
  const [typeFilter, setTypeFilter] = useState<'all' | MaterialType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | MaterialStudyStatus>('all');

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [previewMaterial, setPreviewMaterial] = useState<LibraryMaterialRecord | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  // Create / Rename folder modal state
  const [folderDialog, setFolderDialog] = useState<{
    mode: 'create' | 'rename';
    folder?: LibraryFolderRecord;
    name: string;
    description: string;
    accentVariant: FolderAccentVariant;
  } | null>(null);

  const [confirmDeleteFolderObj, setConfirmDeleteFolderObj] =
    useState<LibraryFolderRecord | null>(null);

  const selectedFolder = useMemo(
    () => libraryWorkspace.folders.find((f) => f.id === selectedFolderId) || null,
    [libraryWorkspace.folders, selectedFolderId]
  );

  // Aggregate summary telemetry
  const summaryStats = useMemo(() => {
    const totalFolders = libraryWorkspace.folders.length;
    const totalMaterials = libraryWorkspace.materials.length;
    const analyzed = libraryWorkspace.materials.filter((m) => Boolean(m.analysis)).length;
    const completed = libraryWorkspace.materials.filter(
      (m) => m.studyStatus === 'completed'
    ).length;
    const masteryPct =
      totalMaterials > 0 ? Math.round((completed / totalMaterials) * 100) : 0;
    return { totalFolders, totalMaterials, analyzed, masteryPct };
  }, [libraryWorkspace.folders, libraryWorkspace.materials]);

  // Filtered & sorted 3D folders
  const visibleFolders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = libraryWorkspace.folders
      .map((folder) => {
        const items = libraryWorkspace.materials.filter((m) => m.folderId === folder.id);
        const metrics = computeFolderMetrics(folder, libraryWorkspace.materials);
        return { folder, items, metrics };
      })
      .filter(({ folder, items }) => {
        if (favoritesOnly && !folder.isFavorite) return false;
        if (q) {
          const hay = `${folder.name} ${folder.description} ${items
            .map((i) => `${i.title} ${i.tags.join(' ')}`)
            .join(' ')}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });

    list.sort((a, b) => {
      if (sortBy === 'name') return a.folder.name.localeCompare(b.folder.name);
      if (sortBy === 'progress') return b.metrics.progressPct - a.metrics.progressPct;
      if (sortBy === 'count') return b.metrics.materialCount - a.metrics.materialCount;
      return b.metrics.lastUpdated.localeCompare(a.metrics.lastUpdated);
    });

    return list;
  }, [libraryWorkspace.folders, libraryWorkspace.materials, favoritesOnly, searchQuery, sortBy]);

  // Filtered materials for Open Folder or All Materials view
  const visibleMaterials = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return libraryWorkspace.materials.filter((m) => {
      if (hubMode === 'folders' && selectedFolder && m.folderId !== selectedFolder.id) {
        return false;
      }
      if (typeFilter !== 'all' && m.materialType !== typeFilter) return false;
      if (statusFilter !== 'all' && m.studyStatus !== statusFilter) return false;
      if (q) {
        const hay = `${m.title} ${m.fileName || ''} ${m.notes} ${m.tags.join(' ')} ${
          m.analysis?.mainSubject || ''
        }`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    libraryWorkspace.materials,
    hubMode,
    selectedFolder,
    typeFilter,
    statusFilter,
    searchQuery,
  ]);

  const foldersById = useMemo(
    () => new Map(libraryWorkspace.folders.map((f) => [f.id, f])),
    [libraryWorkspace.folders]
  );

  const handleFolderDialogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderDialog || !folderDialog.name.trim()) return;
    if (folderDialog.mode === 'create') {
      createLibraryFolder({
        name: folderDialog.name,
        description: folderDialog.description,
        accentVariant: folderDialog.accentVariant,
      });
    } else if (folderDialog.folder) {
      renameLibraryFolder(folderDialog.folder.id, {
        name: folderDialog.name,
        description: folderDialog.description,
        accentVariant: folderDialog.accentVariant,
      });
    }
    setFolderDialog(null);
  };

  const handleAnalyzeMaterial = async (materialId: string) => {
    setAnalyzingId(materialId);
    await analyzeLibraryMaterial(materialId);
    setAnalyzingId(null);
  };

  const renderMaterialCard = (mat: LibraryMaterialRecord) => {
    const parentFolder = foldersById.get(mat.folderId);
    return (
      <div
        key={mat.id}
        data-testid={`library-material-card-${mat.id}`}
        className="rounded-2xl border border-emerald-400/20 bg-[#05150e]/85 hover:border-emerald-300/45 p-4 transition-colors flex flex-col justify-between gap-3"
      >
        <div className="space-y-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-mono uppercase tracking-wider text-emerald-300/80 flex items-center gap-1.5">
                {mat.materialType === 'pdf' && <FileText className="w-3.5 h-3.5" />}
                {mat.materialType === 'presentation' && <Presentation className="w-3.5 h-3.5" />}
                {mat.materialType === 'image' && <ImageIcon className="w-3.5 h-3.5" />}
                {mat.materialType === 'link' && <Globe className="w-3.5 h-3.5" />}
                {(mat.materialType === 'word' ||
                  mat.materialType === 'note' ||
                  mat.materialType === 'study_doc' ||
                  mat.materialType === 'other') && <StickyNote className="w-3.5 h-3.5" />}
                <span>{strings.typeLabels[mat.materialType]}</span>
                {hubMode === 'all_files' && parentFolder && (
                  <span className="text-emerald-200/55">· {parentFolder.name}</span>
                )}
              </p>

              <button
                type="button"
                onClick={() => setPreviewMaterial(mat)}
                className="text-left font-display text-lg sm:text-xl font-semibold text-white hover:text-emerald-200 transition-colors mt-1 line-clamp-2 cursor-pointer"
              >
                {mat.title}
              </button>
            </div>

            <select
              aria-label={`Status for ${mat.title}`}
              value={mat.studyStatus}
              onChange={(e) =>
                updateLibraryMaterial(mat.id, {
                  studyStatus: e.target.value as MaterialStudyStatus,
                })
              }
              className="rounded-xl border border-emerald-400/25 bg-[#030d09] px-2.5 py-1 text-[11px] text-emerald-100 shrink-0"
            >
              {(Object.keys(strings.statusLabels) as MaterialStudyStatus[]).map((st) => (
                <option key={st} value={st}>
                  {strings.statusLabels[st]}
                </option>
              ))}
            </select>
          </div>

          {mat.analysis ? (
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-950/40 p-3 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-emerald-300">
                <span>{mat.analysis.mainSubject}</span>
                <span>
                  {mat.analysis.difficultyLevel} · {mat.analysis.estimatedMinutes} min
                </span>
              </div>
              <p className="text-xs text-emerald-50/85 line-clamp-2">
                {mat.analysis.conciseSummary}
              </p>
            </div>
          ) : mat.contentAccess === 'unreadable' ? (
            <div className="rounded-xl border border-amber-400/25 bg-amber-950/30 p-2.5 flex items-start gap-2 text-[11px] text-amber-200">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span className="line-clamp-2">{mat.unreadableReason}</span>
            </div>
          ) : (
            <p className="text-xs text-emerald-100/65 line-clamp-2">
              {mat.notes || mat.extractedText || strings.noAnalysisYet}
            </p>
          )}

          {mat.analysisError && (
            <p className="text-[11px] text-amber-300">{mat.analysisError}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-emerald-400/15">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPreviewMaterial(mat)}
              className="rounded-xl border border-emerald-300/35 bg-emerald-500/15 hover:bg-emerald-500/25 px-3 py-1.5 text-xs font-medium text-white whitespace-nowrap cursor-pointer"
            >
              {strings.openPreview}
            </button>

            <button
              type="button"
              onClick={() => handleAnalyzeMaterial(mat.id)}
              disabled={analyzingId === mat.id}
              className="inline-flex items-center gap-1 rounded-xl border border-emerald-400/25 bg-emerald-950/50 hover:bg-emerald-500/20 disabled:opacity-45 px-2.5 py-1.5 text-xs text-emerald-200 whitespace-nowrap cursor-pointer"
            >
              {analyzingId === mat.id ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3 text-emerald-300" />
              )}
              <span>
                {analyzingId === mat.id
                  ? strings.analyzing
                  : mat.analysis
                  ? strings.reanalyze
                  : strings.analyzeWithAi}
              </span>
            </button>

            <button
              type="button"
              onClick={() => addMaterialToPlan(mat.id, 'today')}
              className="inline-flex items-center gap-1 rounded-xl border border-emerald-400/20 hover:bg-emerald-500/15 px-2.5 py-1.5 text-xs text-emerald-100/85 whitespace-nowrap cursor-pointer"
            >
              <CalendarPlus className="w-3 h-3 text-emerald-300" />
              <span>{strings.addToToday}</span>
            </button>
          </div>

          {mat.url && (
            <a
              href={mat.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-emerald-300 hover:underline shrink-0"
            >
              <span>Source</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    );
  };

  return (
    <section
      data-testid="research-library-studio"
      className="relative rounded-3xl border border-emerald-400/25 bg-gradient-to-br from-[#030b08] via-[#061811] to-[#030e09] text-emerald-50 p-5 sm:p-8 shadow-[0_24px_80px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(167,243,208,0.22)] space-y-6 overflow-hidden"
    >
      {/* Subtle Top-Right Volumetric Emerald Ambient Light */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl"
      />

      {/* Refined Studio Header */}
      <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-5 border-b border-emerald-400/15 pb-6">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-emerald-300">
            {strings.badge}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-white mt-1">
            {strings.title}
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/70 mt-1.5 max-w-2xl leading-relaxed">
            {strings.subtitle}
          </p>
        </div>

        {/* Compact Telemetry & Mode Switcher */}
        <div className="flex flex-col lg:items-end gap-3 shrink-0">
          <div className="flex flex-wrap lg:flex-nowrap items-center gap-2.5 text-xs font-mono text-emerald-200/80 whitespace-nowrap">
            <span>
              <strong className="text-white">{summaryStats.totalFolders}</strong>{' '}
              {strings.overviewFolders}
            </span>
            <span className="text-emerald-400/40">·</span>
            <span>
              <strong className="text-white">{summaryStats.totalMaterials}</strong>{' '}
              {strings.overviewMaterials}
            </span>
            <span className="text-emerald-400/40">·</span>
            <span>
              <strong className="text-emerald-300">{summaryStats.analyzed}</strong>{' '}
              {strings.overviewAnalyzed}
            </span>
            <span className="text-emerald-400/40">·</span>
            <span>
              <strong className="text-emerald-300">{summaryStats.masteryPct}%</strong>{' '}
              {strings.overviewCompleted}
            </span>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            {[
              { id: 'folders' as const, label: strings.viewFolders, icon: FolderOpen },
              { id: 'all_files' as const, label: strings.viewAllFiles, icon: Layers },
              { id: 'planner' as const, label: strings.viewPlanner, icon: Sparkles },
            ].map((item) => {
              const Icon = item.icon;
              const active = hubMode === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setHubMode(item.id);
                    if (item.id !== 'folders') setSelectedFolderId(null);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium border transition-colors whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-emerald-500 text-emerald-950 border-emerald-400 font-semibold'
                      : 'bg-[#071c14] border-emerald-400/20 text-emerald-100/80 hover:border-emerald-300/40'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* HUB MODE: 3D GLASS FOLDERS OR OPEN FOLDER VIEW */}
      {hubMode === 'folders' && !selectedFolder && (
        <div className="relative space-y-5">
          {/* Search, Sort & Folder Creation Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-emerald-300/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={strings.searchPlaceholder}
                className="w-full rounded-xl border border-emerald-400/25 bg-[#05140e] pl-10 pr-4 py-2 text-xs text-white placeholder:text-emerald-200/40 focus:outline-none focus:border-emerald-300"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setFavoritesOnly((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                  favoritesOnly
                    ? 'bg-emerald-500/25 border-emerald-300/60 text-emerald-200'
                    : 'bg-[#05140e] border-emerald-400/20 text-emerald-100/75 hover:border-emerald-300/40'
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${favoritesOnly ? 'fill-emerald-300' : ''}`} />
                <span>{strings.favoritesOnly}</span>
              </button>

              <select
                aria-label={strings.sortBy}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as FolderSortKey)}
                className="rounded-xl border border-emerald-400/25 bg-[#05140e] px-3 py-2 text-xs text-emerald-100"
              >
                <option value="updated">{strings.sortUpdated}</option>
                <option value="name">{strings.sortName}</option>
                <option value="progress">{strings.sortProgress}</option>
                <option value="count">{strings.sortCount}</option>
              </select>

              <button
                type="button"
                data-testid="create-folder-btn"
                onClick={() =>
                  setFolderDialog({
                    mode: 'create',
                    name: '',
                    description: '',
                    accentVariant:
                      FOLDER_ACCENT_VARIANTS[
                        libraryWorkspace.folders.length % FOLDER_ACCENT_VARIANTS.length
                      ],
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300/45 bg-emerald-500/20 hover:bg-emerald-500/30 px-3.5 py-2 text-xs font-semibold text-white whitespace-nowrap cursor-pointer"
              >
                <FolderPlus className="w-3.5 h-3.5 text-emerald-300" />
                <span>{strings.newFolder}</span>
              </button>
            </div>
          </div>

          {/* 3D Neon Glass Folder Grid */}
          {visibleFolders.length === 0 ? (
            <div className="rounded-2xl border border-emerald-400/20 bg-[#05140e]/70 p-10 text-center space-y-3">
              <FolderOpen className="w-8 h-8 text-emerald-300/60 mx-auto" />
              <p className="text-sm font-medium text-white">No matching folders found</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFavoritesOnly(false);
                }}
                className="rounded-xl border border-emerald-400/30 px-3.5 py-1.5 text-xs text-emerald-200 hover:bg-emerald-500/15 cursor-pointer"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleFolders.map(({ folder, items, metrics }) => (
                <GlassFolder3D
                  key={folder.id}
                  folder={folder}
                  materials={items}
                  metrics={metrics}
                  strings={strings}
                  onOpen={(id) => setSelectedFolderId(id)}
                  onToggleFavorite={toggleFavoriteFolder}
                  onRename={(f) =>
                    setFolderDialog({
                      mode: 'rename',
                      folder: f,
                      name: f.name,
                      description: f.description,
                      accentVariant: f.accentVariant,
                    })
                  }
                  onDelete={(f) => setConfirmDeleteFolderObj(f)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* OPEN FOLDER VIEW */}
      {hubMode === 'folders' && selectedFolder && (
        <div className="relative space-y-5" data-testid="open-folder-workspace">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-emerald-400/25 bg-[#05160f]/85 p-4">
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setSelectedFolderId(null)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-300 hover:text-emerald-200 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{strings.backToFolders}</span>
              </button>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-2xl font-semibold text-white">
                  {selectedFolder.name}
                </h2>
                <button
                  type="button"
                  onClick={() => toggleFavoriteFolder(selectedFolder.id)}
                  className="p-1 text-emerald-300 cursor-pointer"
                >
                  <Star
                    className={`w-4 h-4 ${
                      selectedFolder.isFavorite ? 'fill-emerald-300' : ''
                    }`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFolderDialog({
                      mode: 'rename',
                      folder: selectedFolder,
                      name: selectedFolder.name,
                      description: selectedFolder.description,
                      accentVariant: selectedFolder.accentVariant,
                    })
                  }
                  className="p-1 text-emerald-200/60 hover:text-emerald-200 cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
              {selectedFolder.description && (
                <p className="text-xs text-emerald-100/65">{selectedFolder.description}</p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setAddModalOpen(true)}
              className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-semibold px-4 py-2 text-xs whitespace-nowrap self-start sm:self-center cursor-pointer"
            >
              + {strings.addMaterial}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-emerald-300/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={strings.searchPlaceholder}
                className="w-full rounded-xl border border-emerald-400/25 bg-[#05140e] pl-10 pr-4 py-2 text-xs text-white placeholder:text-emerald-200/40"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'all' | MaterialType)}
              className="rounded-xl border border-emerald-400/25 bg-[#05140e] px-3 py-2 text-xs text-emerald-100"
            >
              <option value="all">{strings.filterAllTypes}</option>
              {(Object.keys(strings.typeLabels) as MaterialType[]).map((mt) => (
                <option key={mt} value={mt}>
                  {strings.typeLabels[mt]}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as 'all' | MaterialStudyStatus)
              }
              className="rounded-xl border border-emerald-400/25 bg-[#05140e] px-3 py-2 text-xs text-emerald-100"
            >
              <option value="all">{strings.filterAllStatuses}</option>
              {(Object.keys(strings.statusLabels) as MaterialStudyStatus[]).map((st) => (
                <option key={st} value={st}>
                  {strings.statusLabels[st]}
                </option>
              ))}
            </select>
          </div>

          {visibleMaterials.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-emerald-400/25 bg-[#05140e]/60 p-10 text-center space-y-2">
              <p className="text-sm font-medium text-white">{strings.emptyFolderTitle}</p>
              <p className="text-xs text-emerald-100/65 max-w-md mx-auto">
                {strings.emptyFolderSubtitle}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {visibleMaterials.map(renderMaterialCard)}
            </div>
          )}
        </div>
      )}

      {/* ALL MATERIALS VIEW */}
      {hubMode === 'all_files' && (
        <div className="relative space-y-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-emerald-300/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={strings.searchPlaceholder}
                className="w-full rounded-xl border border-emerald-400/25 bg-[#05140e] pl-10 pr-4 py-2 text-xs text-white placeholder:text-emerald-200/40"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'all' | MaterialType)}
              className="rounded-xl border border-emerald-400/25 bg-[#05140e] px-3 py-2 text-xs text-emerald-100"
            >
              <option value="all">{strings.filterAllTypes}</option>
              {(Object.keys(strings.typeLabels) as MaterialType[]).map((mt) => (
                <option key={mt} value={mt}>
                  {strings.typeLabels[mt]}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as 'all' | MaterialStudyStatus)
              }
              className="rounded-xl border border-emerald-400/25 bg-[#05140e] px-3 py-2 text-xs text-emerald-100"
            >
              <option value="all">{strings.filterAllStatuses}</option>
              {(Object.keys(strings.statusLabels) as MaterialStudyStatus[]).map((st) => (
                <option key={st} value={st}>
                  {strings.statusLabels[st]}
                </option>
              ))}
            </select>
          </div>

          {visibleMaterials.length === 0 ? (
            <div className="rounded-2xl border border-emerald-400/20 bg-[#05140e]/60 p-10 text-center text-sm text-emerald-100/70">
              No materials match your filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {visibleMaterials.map(renderMaterialCard)}
            </div>
          )}
        </div>
      )}

      {/* AI STUDY PLANNER */}
      {hubMode === 'planner' && (
        <AIPlannerWorkspace
          strings={strings}
          onOpenMaterial={(mat) => setPreviewMaterial(mat)}
        />
      )}

      {/* Floating 3D Glass Plus Button */}
      <GlassPlusButton
        label={strings.addMaterial}
        onClick={() => setAddModalOpen(true)}
      />

      {/* Add Material Modal */}
      <AddMaterialModal
        open={addModalOpen}
        defaultFolderId={
          selectedFolderId || libraryWorkspace.folders[0]?.id || ''
        }
        strings={strings}
        onClose={() => setAddModalOpen(false)}
      />

      {/* Preview & Intelligence Modal */}
      <MaterialPreviewModal
        material={previewMaterial}
        strings={strings}
        onClose={() => setPreviewMaterial(null)}
      />

      {/* Create / Rename Folder Modal */}
      {folderDialog &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
            onClick={() => setFolderDialog(null)}
          >
            <form
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleFolderDialogSubmit}
              className="w-full max-w-md rounded-3xl border border-emerald-400/35 bg-[#04120c]/95 p-6 space-y-4 text-emerald-50 shadow-2xl"
            >
              <h3 className="font-display text-xl font-semibold text-white">
                {folderDialog.mode === 'create' ? strings.newFolder : strings.renameFolder}
              </h3>

              <div>
                <label htmlFor="folder-name-field" className="block text-xs text-emerald-200/80 mb-1">
                  {strings.folderNameLabel}
                </label>
                <input
                  id="folder-name-field"
                  type="text"
                  required
                  autoFocus
                  value={folderDialog.name}
                  onChange={(e) =>
                    setFolderDialog((prev) => (prev ? { ...prev, name: e.target.value } : null))
                  }
                  placeholder="e.g., Linear Algebra & ML Prep"
                  className="w-full rounded-xl border border-emerald-400/30 bg-[#061811] px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label htmlFor="folder-desc-field" className="block text-xs text-emerald-200/80 mb-1">
                  {strings.folderDescLabel}
                </label>
                <input
                  id="folder-desc-field"
                  type="text"
                  value={folderDialog.description}
                  onChange={(e) =>
                    setFolderDialog((prev) =>
                      prev ? { ...prev, description: e.target.value } : null
                    )
                  }
                  placeholder="Core syllabi, slides, and practice sets"
                  className="w-full rounded-xl border border-emerald-400/30 bg-[#061811] px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <span className="block text-xs text-emerald-200/80 mb-1.5">
                  {strings.folderAccentLabel}
                </span>
                <div className="flex flex-wrap gap-2">
                  {FOLDER_ACCENT_VARIANTS.map((variant) => (
                    <button
                      key={variant}
                      type="button"
                      onClick={() =>
                        setFolderDialog((prev) =>
                          prev ? { ...prev, accentVariant: variant } : null
                        )
                      }
                      className={`rounded-lg px-2.5 py-1 text-[11px] capitalize border cursor-pointer ${
                        folderDialog.accentVariant === variant
                          ? 'bg-emerald-500 text-emerald-950 border-emerald-300 font-semibold'
                          : 'bg-[#061811] border-emerald-400/20 text-emerald-200'
                      }`}
                    >
                      {variant}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-emerald-400/15">
                <button
                  type="button"
                  onClick={() => setFolderDialog(null)}
                  className="rounded-xl border border-emerald-400/25 px-4 py-2 text-xs text-emerald-100/80 cursor-pointer"
                >
                  {strings.cancel}
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-semibold px-4 py-2 text-xs cursor-pointer"
                >
                  {folderDialog.mode === 'create' ? strings.create : strings.save}
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}

      {/* Delete Folder Confirmation Modal */}
      {confirmDeleteFolderObj &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
            onClick={() => setConfirmDeleteFolderObj(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl border border-rose-400/35 bg-[#09120e] p-6 space-y-4 text-emerald-50 shadow-2xl"
            >
              <h3 className="font-display text-xl font-semibold text-white">
                {strings.deleteFolder}: {confirmDeleteFolderObj.name}
              </h3>
              <p className="text-xs text-emerald-100/75 leading-relaxed">
                {strings.confirmDeleteFolder}
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteFolderObj(null)}
                  className="rounded-xl border border-emerald-400/25 px-4 py-2 text-xs text-emerald-100/80 cursor-pointer"
                >
                  {strings.cancel}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const targetId = confirmDeleteFolderObj.id;
                    setConfirmDeleteFolderObj(null);
                    if (selectedFolderId === targetId) setSelectedFolderId(null);
                    await deleteLibraryFolder(targetId);
                  }}
                  className="rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-semibold px-4 py-2 text-xs cursor-pointer"
                >
                  {strings.confirmDelete}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </section>
  );
};
