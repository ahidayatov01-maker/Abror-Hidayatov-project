import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  CalendarPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  FileText,
  FolderInput,
  Loader2,
  Pencil,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { LibraryMaterialRecord, MaterialStudyStatus } from '../../types/domain';
import { getMaterialBlob } from '../../utils/libraryBlobStore';
import { assessMaterialContentAccess } from '../../utils/researchLibraryEngine';
import type { LibraryLocaleStrings } from './libraryStrings';

interface MaterialPreviewModalProps {
  material: LibraryMaterialRecord | null;
  strings: LibraryLocaleStrings;
  onClose: () => void;
}

export const MaterialPreviewModal: React.FC<MaterialPreviewModalProps> = ({
  material,
  strings,
  onClose,
}) => {
  const {
    libraryWorkspace,
    updateLibraryMaterial,
    moveLibraryMaterial,
    deleteLibraryMaterial,
    analyzeLibraryMaterial,
    addMaterialToPlan,
  } = useApp();

  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [slideIdx, setSlideIdx] = useState(0);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setSlideIdx(0);
    setEditingTitle(false);
    setEditingNotes(false);
    setConfirmDelete(false);
    setActionMsg(null);
    if (material) {
      setTitleDraft(material.title);
      setNotesDraft(material.notes || material.extractedText || '');
    }
  }, [material?.id]);

  useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;
    setObjectUrl(null);
    if (material?.hasLocalBlob) {
      getMaterialBlob(material.id).then((rec) => {
        if (!active || !rec) return;
        createdUrl = URL.createObjectURL(rec.blob);
        setObjectUrl(createdUrl);
      });
    }
    return () => {
      active = false;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [material?.id, material?.hasLocalBlob]);

  useEffect(() => {
    if (!material) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [material, onClose]);

  if (!material || typeof document === 'undefined') return null;

  const currentMaterial =
    libraryWorkspace.materials.find((m) => m.id === material.id) || material;

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setActionMsg(null);
    const res = await analyzeLibraryMaterial(currentMaterial.id);
    setAnalyzing(false);
    if (res.ok) {
      setActionMsg('AI analysis complete using verified material content.');
    } else {
      setActionMsg(res.error || 'AI analysis could not be completed.');
    }
  };

  const handleSaveTitle = () => {
    if (titleDraft.trim()) {
      updateLibraryMaterial(currentMaterial.id, { title: titleDraft.trim() });
    }
    setEditingTitle(false);
  };

  const handleSaveNotes = () => {
    const clean = notesDraft.trim();
    const assessment = assessMaterialContentAccess({
      materialType: currentMaterial.materialType,
      extractedText:
        currentMaterial.extractedText && currentMaterial.extractedText !== currentMaterial.notes
          ? `${currentMaterial.extractedText}\n${clean}`
          : clean,
      hasLocalBlob: currentMaterial.hasLocalBlob,
      url: currentMaterial.url,
    });
    updateLibraryMaterial(currentMaterial.id, {
      notes: clean,
      ...(currentMaterial.materialType === 'note' ||
      currentMaterial.materialType === 'study_doc' ||
      (!currentMaterial.extractedText && clean)
        ? { extractedText: clean }
        : {}),
      contentAccess: assessment.contentAccess,
      unreadableReason: assessment.unreadableReason,
    });
    setEditingNotes(false);
  };

  const handleDelete = async () => {
    await deleteLibraryMaterial(currentMaterial.id);
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={currentMaterial.title}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        data-testid="material-preview-modal"
        className="w-full max-w-6xl h-[90vh] flex flex-col rounded-3xl border border-emerald-400/35 bg-[#04110b]/96 text-emerald-50 shadow-[0_30px_100px_rgba(0,0,0,0.88)] overflow-hidden"
      >
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-emerald-400/15 bg-[#061810]/90">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-emerald-300">
              <span>{strings.typeLabels[currentMaterial.materialType]}</span>
              {currentMaterial.fileName && <span>· {currentMaterial.fileName}</span>}
              {currentMaterial.pageCount ? (
                <span>· {currentMaterial.pageCount} pages</span>
              ) : null}
            </div>

            {editingTitle ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle();
                  }}
                  className="rounded-lg border border-emerald-400/40 bg-emerald-950/70 px-2.5 py-1 text-sm text-white w-72"
                />
                <button
                  type="button"
                  onClick={handleSaveTitle}
                  className="rounded-lg bg-emerald-500 text-emerald-950 px-2.5 py-1 text-xs font-semibold cursor-pointer"
                >
                  {strings.save}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-0.5">
                <h2 className="font-display text-xl sm:text-2xl font-semibold text-white truncate">
                  {currentMaterial.title}
                </h2>
                <button
                  type="button"
                  onClick={() => setEditingTitle(true)}
                  aria-label={strings.rename}
                  className="p-1 rounded-lg text-emerald-200/50 hover:text-emerald-200 hover:bg-emerald-500/15 cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {objectUrl && currentMaterial.fileName && (
              <a
                href={objectUrl}
                download={currentMaterial.fileName}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/25 bg-emerald-950/50 hover:bg-emerald-500/20 px-3 py-1.5 text-xs text-emerald-100 whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close preview"
              className="p-2 rounded-xl border border-emerald-400/25 text-emerald-100/80 hover:text-white hover:bg-emerald-500/15 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Split Body */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Document / Media Preview Canvas */}
          <div className="lg:col-span-7 border-b lg:border-b-0 lg:border-r border-emerald-400/15 bg-[#020a07] overflow-y-auto p-4 sm:p-6 flex flex-col">
            {currentMaterial.contentAccess === 'unreadable' && (
              <div className="mb-4 rounded-2xl border border-amber-400/35 bg-amber-950/35 p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-amber-200">
                    {strings.unreadableNoticeTitle}
                  </p>
                  <p className="text-amber-100/80 leading-relaxed">
                    {currentMaterial.unreadableReason}
                  </p>
                </div>
              </div>
            )}

            {currentMaterial.materialType === 'pdf' && objectUrl && currentMaterial.contentAccess !== 'unreadable' ? (
              <iframe
                title={currentMaterial.title}
                src={objectUrl}
                className="w-full flex-1 min-h-[420px] rounded-2xl border border-emerald-400/20 bg-white"
              />
            ) : currentMaterial.materialType === 'image' && objectUrl ? (
              <div className="flex-1 flex items-center justify-center rounded-2xl border border-emerald-400/20 bg-black/50 p-3">
                <img
                  src={objectUrl}
                  alt={currentMaterial.title}
                  className="max-w-full max-h-[62vh] rounded-xl object-contain"
                />
              </div>
            ) : currentMaterial.materialType === 'presentation' &&
              currentMaterial.slideTexts &&
              currentMaterial.slideTexts.length > 0 ? (
              <div className="flex-1 flex flex-col justify-between gap-4">
                <div className="rounded-2xl border border-emerald-400/25 bg-[#071a12] p-6 min-h-[280px] flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-mono text-emerald-300 border-b border-emerald-400/15 pb-3">
                    <span>
                      SLIDE {slideIdx + 1} / {currentMaterial.slideTexts.length}
                    </span>
                    <span>PPTX EXTRACT</span>
                  </div>
                  <p className="text-sm sm:text-base text-white leading-relaxed py-6 whitespace-pre-wrap">
                    {currentMaterial.slideTexts[slideIdx]}
                  </p>
                  <div className="h-1 w-full rounded-full bg-emerald-950 overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 transition-[width] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]"
                      style={{
                        width: `${((slideIdx + 1) / currentMaterial.slideTexts.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    disabled={slideIdx === 0}
                    onClick={() => setSlideIdx((i) => Math.max(0, i - 1))}
                    className="inline-flex items-center gap-1 rounded-xl border border-emerald-400/25 px-3 py-1.5 text-xs disabled:opacity-35 hover:bg-emerald-500/15 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Prev Slide</span>
                  </button>
                  <button
                    type="button"
                    disabled={slideIdx >= currentMaterial.slideTexts.length - 1}
                    onClick={() =>
                      setSlideIdx((i) =>
                        Math.min(currentMaterial.slideTexts!.length - 1, i + 1)
                      )
                    }
                    className="inline-flex items-center gap-1 rounded-xl border border-emerald-400/25 px-3 py-1.5 text-xs disabled:opacity-35 hover:bg-emerald-500/15 cursor-pointer"
                  >
                    <span>Next Slide</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 flex-1 flex flex-col">
                {currentMaterial.url && (
                  <div className="rounded-xl border border-emerald-400/20 bg-emerald-950/40 p-3 flex items-center justify-between gap-3">
                    <span className="text-xs text-emerald-200 truncate">{currentMaterial.url}</span>
                    <a
                      href={currentMaterial.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-300 hover:underline shrink-0"
                    >
                      <span>Open Source</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <p className="text-xs font-mono uppercase tracking-wider text-emerald-300">
                    <FileText className="w-3.5 h-3.5 inline mr-1.5" />
                    Extracted Content & Study Notes
                  </p>
                  <button
                    type="button"
                    onClick={() => setEditingNotes((v) => !v)}
                    className="text-xs text-emerald-300 hover:underline cursor-pointer"
                  >
                    {editingNotes ? strings.cancel : 'Edit Notes'}
                  </button>
                </div>

                {editingNotes ? (
                  <div className="space-y-3 flex-1 flex flex-col">
                    <textarea
                      rows={12}
                      value={notesDraft}
                      onChange={(e) => setNotesDraft(e.target.value)}
                      className="w-full flex-1 rounded-2xl border border-emerald-400/30 bg-[#071a12] p-4 text-xs sm:text-sm text-white leading-relaxed"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleSaveNotes}
                        className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-semibold px-4 py-2 text-xs cursor-pointer"
                      >
                        {strings.save}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-emerald-400/20 bg-[#071912] p-5 flex-1 overflow-y-auto">
                    {currentMaterial.extractedText || currentMaterial.notes ? (
                      <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm text-emerald-50/90 leading-relaxed">
                        {currentMaterial.extractedText || currentMaterial.notes}
                      </pre>
                    ) : (
                      <p className="text-xs text-emerald-100/55">
                        No readable text has been added to this resource yet. Click &ldquo;Edit Notes&rdquo; above to add notes or study excerpts.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Intelligence & Actions Sidebar */}
          <div className="lg:col-span-5 overflow-y-auto p-5 space-y-5 bg-[#05150e]/85">
            {/* Lifecycle Actions */}
            <div className="space-y-3 pb-4 border-b border-emerald-400/15">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  data-testid="preview-analyze-btn"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-emerald-950 font-semibold px-3.5 py-2 text-xs whitespace-nowrap cursor-pointer"
                >
                  {analyzing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {analyzing
                      ? strings.analyzing
                      : currentMaterial.analysis
                      ? strings.reanalyze
                      : strings.analyzeWithAi}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    addMaterialToPlan(currentMaterial.id, 'today');
                    setActionMsg('Added to Today’s Study Plan.');
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/30 bg-emerald-500/15 hover:bg-emerald-500/25 px-3 py-2 text-xs text-emerald-100 whitespace-nowrap cursor-pointer"
                >
                  <CalendarPlus className="w-3.5 h-3.5 text-emerald-300" />
                  <span>{strings.addToToday}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    addMaterialToPlan(currentMaterial.id, 'weekly');
                    setActionMsg('Added to Weekly Study Plan.');
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/25 bg-emerald-950/60 hover:bg-emerald-500/15 px-3 py-2 text-xs text-emerald-100 whitespace-nowrap cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5 text-emerald-300" />
                  <span>{strings.addToWeekly}</span>
                </button>
              </div>

              {actionMsg && (
                <p className="text-xs rounded-xl border border-emerald-400/25 bg-emerald-950/60 px-3 py-2 text-emerald-200">
                  {actionMsg}
                </p>
              )}

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div>
                  <label htmlFor="preview-status-select" className="block text-[11px] text-emerald-200/70 mb-1">
                    Study Status
                  </label>
                  <select
                    id="preview-status-select"
                    value={currentMaterial.studyStatus}
                    onChange={(e) =>
                      updateLibraryMaterial(currentMaterial.id, {
                        studyStatus: e.target.value as MaterialStudyStatus,
                      })
                    }
                    className="w-full rounded-xl border border-emerald-400/25 bg-[#061811] px-2.5 py-1.5 text-xs text-white"
                  >
                    {(Object.keys(strings.statusLabels) as MaterialStudyStatus[]).map((st) => (
                      <option key={st} value={st}>
                        {strings.statusLabels[st]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="preview-move-folder" className="block text-[11px] text-emerald-200/70 mb-1">
                    <FolderInput className="w-3 h-3 inline mr-1" />
                    {strings.moveFolder}
                  </label>
                  <select
                    id="preview-move-folder"
                    value={currentMaterial.folderId}
                    onChange={(e) => moveLibraryMaterial(currentMaterial.id, e.target.value)}
                    className="w-full rounded-xl border border-emerald-400/25 bg-[#061811] px-2.5 py-1.5 text-xs text-white"
                  >
                    {libraryWorkspace.folders.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* AI Analysis Results */}
            {currentMaterial.analysis ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-emerald-400/25 bg-emerald-950/45 p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-emerald-300">
                      {currentMaterial.analysis.mainSubject}
                    </span>
                    <span className="font-mono text-emerald-200/80">
                      {currentMaterial.analysis.difficultyLevel} ·{' '}
                      {currentMaterial.analysis.estimatedMinutes} min
                    </span>
                  </div>
                  <p className="text-xs text-white leading-relaxed">
                    {currentMaterial.analysis.conciseSummary}
                  </p>
                  <p className="text-[11px] text-emerald-200/65 pt-1 border-t border-emerald-400/15">
                    Inspection Basis: {currentMaterial.analysis.analysisBasis}
                  </p>
                </div>

                {currentMaterial.analysis.keyTopics.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-mono uppercase tracking-wider text-emerald-300 mb-1.5">
                      Key Topics & Concepts
                    </h4>
                    <p className="text-xs text-emerald-100/90 leading-relaxed">
                      {currentMaterial.analysis.keyTopics.join(' · ')}
                    </p>
                  </div>
                )}

                {currentMaterial.analysis.learningObjectives.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-mono uppercase tracking-wider text-emerald-300 mb-1.5">
                      Learning Objectives
                    </h4>
                    <ul className="space-y-1 text-xs text-emerald-100/85">
                      {currentMaterial.analysis.learningObjectives.map((obj, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {currentMaterial.analysis.requiredPriorKnowledge.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-mono uppercase tracking-wider text-emerald-300 mb-1">
                      Required Prerequisites
                    </h4>
                    <p className="text-xs text-emerald-100/80">
                      {currentMaterial.analysis.requiredPriorKnowledge.join(' · ')}
                    </p>
                  </div>
                )}

                {currentMaterial.analysis.sectionsOrPages &&
                  currentMaterial.analysis.sectionsOrPages.length > 0 && (
                    <div>
                      <h4 className="text-[11px] font-mono uppercase tracking-wider text-emerald-300 mb-1.5">
                        Recommended Study Splits
                      </h4>
                      <div className="space-y-1.5">
                        {currentMaterial.analysis.sectionsOrPages.map((sec, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl border border-emerald-400/15 bg-emerald-950/35 px-3 py-2 text-xs flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <p className="font-medium text-white truncate">{sec.label}</p>
                              <p className="text-[11px] text-emerald-100/65 truncate">{sec.focus}</p>
                            </div>
                            <span className="font-mono text-[11px] text-emerald-300 shrink-0">
                              {sec.estimatedMinutes}m
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                <p className="text-xs text-emerald-200/75 italic">
                  {currentMaterial.analysis.recommendedLearningOrderHint}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-950/30 p-4 text-xs text-emerald-100/75 leading-relaxed">
                {currentMaterial.analysisError ? (
                  <p className="text-amber-300">{currentMaterial.analysisError}</p>
                ) : (
                  <p>{strings.noAnalysisYet}</p>
                )}
              </div>
            )}

            {/* Delete Zone */}
            <div className="pt-3 border-t border-emerald-400/15 flex items-center justify-between">
              {confirmDelete ? (
                <div className="flex items-center gap-2 w-full justify-between">
                  <span className="text-xs text-rose-200">{strings.confirmDeleteMaterial}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="rounded-lg border border-emerald-400/25 px-2.5 py-1 text-xs cursor-pointer"
                    >
                      {strings.cancel}
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="rounded-lg bg-rose-500 hover:bg-rose-400 text-white px-2.5 py-1 text-xs font-semibold cursor-pointer"
                    >
                      {strings.confirmDelete}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-rose-300/80 hover:text-rose-200 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{strings.delete}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
