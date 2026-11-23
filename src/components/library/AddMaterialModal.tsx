import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  CheckCircle2,
  FileUp,
  FolderPlus,
  Globe,
  Loader2,
  NotebookPen,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { ExtractedFilePayload } from '../../utils/fileExtractor';
import { assessMaterialContentAccess } from '../../utils/researchLibraryEngine';
import type { LibraryLocaleStrings } from './libraryStrings';

interface AddMaterialModalProps {
  open: boolean;
  defaultFolderId: string;
  strings: LibraryLocaleStrings;
  onClose: () => void;
}

type ModalTab = 'upload' | 'link' | 'note' | 'study';

export const AddMaterialModal: React.FC<AddMaterialModalProps> = ({
  open,
  defaultFolderId,
  strings,
  onClose,
}) => {
  const {
    libraryWorkspace,
    createLibraryFolder,
    addLibraryMaterials,
    catalog,
  } = useApp();

  const [tab, setTab] = useState<ModalTab>('upload');
  const [targetFolderId, setTargetFolderId] = useState(defaultFolderId);
  const [creatingFolderName, setCreatingFolderName] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);

  // Upload tab state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [extractingFiles, setExtractingFiles] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<ExtractedFilePayload[]>([]);

  // Link / Note / Study tab state
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [tagsRaw, setTagsRaw] = useState('');
  const [universitySlug, setUniversitySlug] = useState('');
  const [notes, setNotes] = useState('');
  const [inspectedText, setInspectedText] = useState('');
  const [inspectingUrl, setInspectingUrl] = useState(false);
  const [urlFeedback, setUrlFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTargetFolderId(
        defaultFolderId || libraryWorkspace.folders[0]?.id || ''
      );
    }
  }, [open, defaultFolderId, libraryWorkspace.folders]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  const ensureValidFolderId = (): string => {
    if (showNewFolderInput && creatingFolderName.trim()) {
      const created = createLibraryFolder({ name: creatingFolderName.trim() });
      setShowNewFolderInput(false);
      setCreatingFolderName('');
      return created.id;
    }
    if (libraryWorkspace.folders.some((f) => f.id === targetFolderId)) {
      return targetFolderId;
    }
    if (libraryWorkspace.folders[0]) return libraryWorkspace.folders[0].id;
    const fallback = createLibraryFolder({ name: 'University Research' });
    return fallback.id;
  };

  const handleFilesSelected = async (filesList: FileList | File[]) => {
    const arr = Array.from(filesList);
    if (arr.length === 0) return;
    setExtractingFiles(true);
    try {
      const { extractMaterialContent } = await import('../../utils/fileExtractor');
      const extracted = await Promise.all(arr.map((f) => extractMaterialContent(f)));
      setStagedFiles((prev) => [...prev, ...extracted]);
    } finally {
      setExtractingFiles(false);
    }
  };

  const handleInspectUrl = async () => {
    if (!url.trim()) return;
    setInspectingUrl(true);
    setUrlFeedback(null);
    try {
      const resp = await fetch('/api/library/inspect-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await resp.json();
      if (data.ok && data.extractedText) {
        if (!title.trim() && data.title) setTitle(data.title);
        setInspectedText(data.extractedText);
        setUrlFeedback({
          ok: true,
          message: `Extracted ${data.extractedText.length.toLocaleString()} readable characters from page.`,
        });
      } else {
        setInspectedText('');
        setUrlFeedback({
          ok: false,
          message:
            data.error ||
            'Could not read page text automatically. You can still save the link and paste study notes.',
        });
      }
    } catch {
      setUrlFeedback({
        ok: false,
        message: 'Network error while inspecting URL.',
      });
    } finally {
      setInspectingUrl(false);
    }
  };

  const handleSaveUpload = async () => {
    if (stagedFiles.length === 0) return;
    setSaving(true);
    try {
      const folderId = ensureValidFolderId();
      await addLibraryMaterials(
        stagedFiles.map((f) => ({
          folderId,
          title: f.title,
          fileName: f.fileName,
          mimeType: f.mimeType,
          fileSizeBytes: f.fileSizeBytes,
          materialType: f.materialType,
          extractedText: f.extractedText,
          slideTexts: f.slideTexts,
          pageCount: f.pageCount,
          contentAccess: f.contentAccess,
          unreadableReason: f.unreadableReason,
          blob: f.blob,
          previewDataUrl: f.previewDataUrl,
          tags: tagsRaw
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          universitySlug: universitySlug || null,
        }))
      );
      setStagedFiles([]);
      setTagsRaw('');
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStructured = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const folderId = ensureValidFolderId();
      const materialType =
        tab === 'link' ? 'link' : tab === 'study' ? 'study_doc' : 'note';
      const combinedText = [inspectedText.trim(), notes.trim()].filter(Boolean).join('\n\n');
      const access = assessMaterialContentAccess({
        materialType,
        extractedText: combinedText,
        hasLocalBlob: false,
        url: url.trim() || undefined,
      });

      await addLibraryMaterials([
        {
          folderId,
          title: title.trim(),
          materialType,
          url: url.trim() || undefined,
          universitySlug: universitySlug || null,
          tags: tagsRaw
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          notes: notes.trim(),
          extractedText: combinedText || undefined,
          contentAccess: access.contentAccess,
          unreadableReason: access.unreadableReason,
        },
      ]);

      setTitle('');
      setUrl('');
      setNotes('');
      setInspectedText('');
      setTagsRaw('');
      setUrlFeedback(null);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={strings.addMaterial}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        data-testid="add-material-modal"
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-emerald-400/35 bg-[#04120c]/95 text-emerald-50 shadow-[0_28px_90px_rgba(0,0,0,0.85)] p-6 space-y-5"
      >
        <div className="flex items-start justify-between gap-4 border-b border-emerald-400/15 pb-4">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-emerald-300">
              {strings.badge}
            </p>
            <h2 className="font-display text-2xl font-semibold text-white mt-0.5">
              {strings.addMaterial}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={strings.cancel}
            className="p-2 rounded-xl border border-emerald-400/20 text-emerald-100/70 hover:text-white hover:bg-emerald-500/15 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: 'upload' as const, label: strings.modalUploadTab, icon: Upload },
            { id: 'link' as const, label: strings.modalLinkTab, icon: Globe },
            { id: 'note' as const, label: strings.modalNoteTab, icon: NotebookPen },
            { id: 'study' as const, label: strings.modalStudyTab, icon: Sparkles },
          ].map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium border transition-colors cursor-pointer ${
                  active
                    ? 'bg-emerald-500/25 border-emerald-300/60 text-white'
                    : 'bg-emerald-950/40 border-emerald-400/15 text-emerald-100/70 hover:border-emerald-300/35'
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Target Folder & Institution Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="modal-folder-select" className="text-xs text-emerald-200/80">
                {strings.selectFolder}
              </label>
              <button
                type="button"
                onClick={() => setShowNewFolderInput((v) => !v)}
                className="inline-flex items-center gap-1 text-[11px] text-emerald-300 hover:underline cursor-pointer"
              >
                <FolderPlus className="w-3 h-3" />
                <span>{strings.newFolder}</span>
              </button>
            </div>
            {showNewFolderInput ? (
              <input
                type="text"
                value={creatingFolderName}
                onChange={(e) => setCreatingFolderName(e.target.value)}
                placeholder="New folder name..."
                className="w-full rounded-xl border border-emerald-400/35 bg-emerald-950/60 px-3 py-2 text-xs text-white placeholder:text-emerald-200/40"
              />
            ) : (
              <select
                id="modal-folder-select"
                value={targetFolderId}
                onChange={(e) => setTargetFolderId(e.target.value)}
                className="w-full rounded-xl border border-emerald-400/25 bg-[#061811] px-3 py-2 text-xs text-white"
              >
                {libraryWorkspace.folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label htmlFor="modal-uni-select" className="block text-xs text-emerald-200/80 mb-1">
              Institution (optional)
            </label>
            <select
              id="modal-uni-select"
              value={universitySlug}
              onChange={(e) => setUniversitySlug(e.target.value)}
              className="w-full rounded-xl border border-emerald-400/25 bg-[#061811] px-3 py-2 text-xs text-white"
            >
              <option value="">General Study Material</option>
              {catalog.universities.map((u) => (
                <option key={u.slug} value={u.slug}>
                  {u.shortName} · {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {tab === 'upload' ? (
          <div className="space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                if (e.dataTransfer.files) void handleFilesSelected(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
                dragActive
                  ? 'border-emerald-300 bg-emerald-500/15'
                  : 'border-emerald-400/30 bg-emerald-950/35 hover:border-emerald-300/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,.markdown,.csv,.json,.png,.jpg,.jpeg,.webp,.gif,.svg"
                onChange={(e) => {
                  if (e.target.files) void handleFilesSelected(e.target.files);
                  e.target.value = '';
                }}
                className="hidden"
                data-testid="library-file-input"
              />
              <FileUp className="w-8 h-8 text-emerald-300 mx-auto mb-2.5" />
              <p className="text-sm font-medium text-white">{strings.dropzoneTitle}</p>
              <p className="text-xs text-emerald-100/65 mt-1">{strings.dropzoneSubtitle}</p>
              {extractingFiles && (
                <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-300">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Inspecting uploaded files...</span>
                </p>
              )}
            </div>

            {stagedFiles.length > 0 && (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {stagedFiles.map((f, idx) => (
                  <div
                    key={`${f.fileName}-${idx}`}
                    className="rounded-xl border border-emerald-400/20 bg-emerald-950/45 p-3 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{f.fileName}</p>
                      <p className="text-[11px] text-emerald-200/70 mt-0.5">
                        {strings.typeLabels[f.materialType]} ·{' '}
                        {Math.max(1, Math.round(f.fileSizeBytes / 1024))} KB
                        {f.pageCount ? ` · ${f.pageCount} pages/slides` : ''}
                      </p>
                      {f.contentAccess === 'accessible' ? (
                        <p className="inline-flex items-center gap-1 text-[11px] text-emerald-300 mt-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Content verified & ready for preview / AI analysis</span>
                        </p>
                      ) : (
                        <p className="inline-flex items-start gap-1 text-[11px] text-amber-300 mt-1">
                          <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                          <span>{f.unreadableReason}</span>
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setStagedFiles((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="text-emerald-200/50 hover:text-rose-300 p-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div>
              <label htmlFor="upload-tags" className="block text-xs text-emerald-200/80 mb-1">
                Tags (comma-separated, optional)
              </label>
              <input
                id="upload-tags"
                type="text"
                value={tagsRaw}
                onChange={(e) => setTagsRaw(e.target.value)}
                placeholder="Linear Algebra, Midterm, Syllabus"
                className="w-full rounded-xl border border-emerald-400/25 bg-[#061811] px-3 py-2 text-xs text-white placeholder:text-emerald-200/35"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-400/15">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-emerald-400/25 px-4 py-2 text-xs text-emerald-100/80 hover:bg-emerald-500/10 cursor-pointer"
              >
                {strings.cancel}
              </button>
              <button
                type="button"
                disabled={stagedFiles.length === 0 || saving}
                onClick={handleSaveUpload}
                className="rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-45 text-emerald-950 font-semibold px-4 py-2 text-xs cursor-pointer"
              >
                {saving ? 'Saving...' : `Save ${stagedFiles.length || ''} File(s)`}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveStructured} className="space-y-4">
            {tab === 'link' && (
              <div className="space-y-2">
                <label htmlFor="modal-url-input" className="block text-xs text-emerald-200/80">
                  Web Resource URL
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    id="modal-url-input"
                    type="url"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 rounded-xl border border-emerald-400/25 bg-[#061811] px-3 py-2 text-xs text-white placeholder:text-emerald-200/35"
                  />
                  <button
                    type="button"
                    onClick={handleInspectUrl}
                    disabled={inspectingUrl || !url.trim()}
                    className="rounded-xl border border-emerald-300/40 bg-emerald-500/20 hover:bg-emerald-500/30 disabled:opacity-45 px-3 py-2 text-xs font-medium text-emerald-100 whitespace-nowrap inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {inspectingUrl && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{inspectingUrl ? strings.inspectingUrl : strings.inspectUrlBtn}</span>
                  </button>
                </div>
                {urlFeedback && (
                  <p
                    className={`text-xs ${
                      urlFeedback.ok ? 'text-emerald-300' : 'text-amber-300'
                    }`}
                  >
                    {urlFeedback.message}
                  </p>
                )}
              </div>
            )}

            <div>
              <label htmlFor="modal-title-input" className="block text-xs text-emerald-200/80 mb-1">
                Material Title
              </label>
              <input
                id="modal-title-input"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  tab === 'link'
                    ? 'e.g., MIT OCW Linear Algebra Lecture Notes'
                    : 'e.g., Organic Chemistry Reaction Mechanisms Summary'
                }
                className="w-full rounded-xl border border-emerald-400/25 bg-[#061811] px-3 py-2 text-xs text-white placeholder:text-emerald-200/35"
              />
            </div>

            <div>
              <label htmlFor="modal-notes-input" className="block text-xs text-emerald-200/80 mb-1">
                {strings.noteContentLabel}
              </label>
              <textarea
                id="modal-notes-input"
                rows={5}
                required={tab !== 'link'}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Paste study outline, formulas, summary points, or key syllabus questions..."
                className="w-full rounded-xl border border-emerald-400/25 bg-[#061811] px-3 py-2 text-xs text-white placeholder:text-emerald-200/35 resize-y"
              />
            </div>

            <div>
              <label htmlFor="modal-tags-input" className="block text-xs text-emerald-200/80 mb-1">
                Tags (comma-separated, optional)
              </label>
              <input
                id="modal-tags-input"
                type="text"
                value={tagsRaw}
                onChange={(e) => setTagsRaw(e.target.value)}
                placeholder="Core Concepts, Exam Prep, Week 3"
                className="w-full rounded-xl border border-emerald-400/25 bg-[#061811] px-3 py-2 text-xs text-white placeholder:text-emerald-200/35"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-400/15">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-emerald-400/25 px-4 py-2 text-xs text-emerald-100/80 hover:bg-emerald-500/10 cursor-pointer"
              >
                {strings.cancel}
              </button>
              <button
                type="submit"
                disabled={saving || !title.trim()}
                className="rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-45 text-emerald-950 font-semibold px-4 py-2 text-xs cursor-pointer"
              >
                {saving ? 'Saving...' : strings.save}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};
