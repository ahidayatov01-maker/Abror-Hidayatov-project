import type {
  CrossMaterialPrerequisiteLink,
  DifficultyLevel,
  FolderAccentVariant,
  LibraryFolderRecord,
  LibraryMaterialRecord,
  MaterialContentAccess,
  MaterialType,
  ResearchLibraryWorkspaceState,
  ResearchResourceEntry,
  StudySchedulePreferences,
  StudySessionItem,
} from '../types/domain';

export const FOLDER_ACCENT_VARIANTS: FolderAccentVariant[] = [
  'emerald',
  'jade',
  'mint',
  'teal',
  'forest',
  'sage',
];

export const DEFAULT_SCHEDULE_PREFERENCES: StudySchedulePreferences = {
  dailyStudyMinutes: 90,
  studyDaysPerWeek: 6,
  maxHardSessionsPerDay: 1,
};

export function detectMaterialType(
  fileName?: string,
  mimeType?: string,
  explicitKind?: MaterialType
): MaterialType {
  if (explicitKind) return explicitKind;
  const name = (fileName || '').toLowerCase();
  const mime = (mimeType || '').toLowerCase();

  if (mime === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (
    mime.includes('wordprocessingml') ||
    mime === 'application/msword' ||
    name.endsWith('.docx') ||
    name.endsWith('.doc')
  ) {
    return 'word';
  }
  if (
    mime.includes('presentationml') ||
    mime === 'application/vnd.ms-powerpoint' ||
    name.endsWith('.pptx') ||
    name.endsWith('.ppt')
  ) {
    return 'presentation';
  }
  if (
    mime.startsWith('image/') ||
    /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(name)
  ) {
    return 'image';
  }
  if (
    mime.startsWith('text/') ||
    /\.(txt|md|markdown|csv|json|log)$/i.test(name)
  ) {
    return 'note';
  }
  return 'other';
}

export function extractXmlTextRuns(xml: string, tagName: 'w:t' | 'a:t'): string {
  if (!xml) return '';
  const regex = new RegExp(`<${tagName}(?:\\s+[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, 'g');
  const parts: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(xml)) !== null) {
    const decoded = match[1]
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    if (decoded.trim()) {
      parts.push(decoded);
    }
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

export function assessMaterialContentAccess(params: {
  materialType: MaterialType;
  extractedText?: string;
  hasLocalBlob: boolean;
  url?: string;
  unreadableReason?: string;
}): { contentAccess: MaterialContentAccess; unreadableReason?: string } {
  if (params.unreadableReason) {
    return { contentAccess: 'unreadable', unreadableReason: params.unreadableReason };
  }
  const textLen = (params.extractedText || '').trim().length;
  if (params.materialType === 'note' || params.materialType === 'study_doc') {
    if (textLen > 0) return { contentAccess: 'accessible' };
    return {
      contentAccess: 'unreadable',
      unreadableReason: 'No readable text content found inside this note.',
    };
  }
  if (params.materialType === 'link') {
    if (textLen >= 40) return { contentAccess: 'accessible' };
    if (params.url && textLen === 0) {
      return {
        contentAccess: 'unreadable',
        unreadableReason:
          'Web page text could not be fetched directly. Inspect the URL or paste study notes to analyze.',
      };
    }
    return { contentAccess: 'partial' };
  }
  if (params.materialType === 'image' || params.materialType === 'pdf') {
    if (params.hasLocalBlob || textLen > 0) {
      return { contentAccess: 'accessible' };
    }
    return {
      contentAccess: 'unreadable',
      unreadableReason: 'Binary file is not loaded on this device.',
    };
  }
  if (params.materialType === 'word' || params.materialType === 'presentation') {
    if (textLen > 0) return { contentAccess: 'accessible' };
    return {
      contentAccess: 'unreadable',
      unreadableReason:
        'Could not extract readable text from this document format (legacy binary .doc/.ppt requires conversion to .docx/.pptx or PDF).',
    };
  }
  if (textLen > 0) return { contentAccess: 'accessible' };
  return {
    contentAccess: 'unreadable',
    unreadableReason: 'Unsupported binary format — content cannot be read for AI analysis.',
  };
}

export interface ComputedFolderMetrics {
  materialCount: number;
  analyzedCount: number;
  readyCount: number;
  studyingCount: number;
  completedCount: number;
  progressPct: number;
  aiStatus: 'none' | 'partial' | 'complete';
  lastUpdated: string;
}

export function computeFolderMetrics(
  folder: LibraryFolderRecord,
  materials: LibraryMaterialRecord[]
): ComputedFolderMetrics {
  const items = materials.filter((m) => m.folderId === folder.id);
  const materialCount = items.length;
  const analyzedCount = items.filter((m) => Boolean(m.analysis)).length;
  const readyCount = items.filter((m) => m.studyStatus === 'ready_to_study').length;
  const studyingCount = items.filter((m) => m.studyStatus === 'studying').length;
  const completedCount = items.filter((m) => m.studyStatus === 'completed').length;
  const progressPct =
    materialCount > 0 ? Math.round((completedCount / materialCount) * 100) : 0;

  let aiStatus: 'none' | 'partial' | 'complete' = 'none';
  if (materialCount > 0) {
    if (analyzedCount === materialCount) aiStatus = 'complete';
    else if (analyzedCount > 0) aiStatus = 'partial';
  }

  let lastUpdated = folder.updatedAt;
  for (const m of items) {
    if (m.updatedAt > lastUpdated) {
      lastUpdated = m.updatedAt;
    }
  }

  return {
    materialCount,
    analyzedCount,
    readyCount,
    studyingCount,
    completedCount,
    progressPct,
    aiStatus,
    lastUpdated,
  };
}

export function topologicalStudyOrder(
  materials: LibraryMaterialRecord[],
  prerequisiteLinks: CrossMaterialPrerequisiteLink[]
): LibraryMaterialRecord[] {
  const byId = new Map(materials.map((m) => [m.id, m]));
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const m of materials) {
    inDegree.set(m.id, 0);
    adjacency.set(m.id, []);
  }

  for (const link of prerequisiteLinks) {
    if (!byId.has(link.fromMaterialId) || !byId.has(link.toMaterialId)) continue;
    if (link.fromMaterialId === link.toMaterialId) continue;
    const neighbors = adjacency.get(link.fromMaterialId)!;
    if (!neighbors.includes(link.toMaterialId)) {
      neighbors.push(link.toMaterialId);
      inDegree.set(link.toMaterialId, (inDegree.get(link.toMaterialId) || 0) + 1);
    }
  }

  const diffRank: Record<DifficultyLevel, number> = {
    Beginner: 0,
    Intermediate: 1,
    Advanced: 2,
  };

  const sortReady = (aId: string, bId: string) => {
    const a = byId.get(aId)!;
    const b = byId.get(bId)!;
    const da = a.analysis ? diffRank[a.analysis.difficultyLevel] : 1;
    const db = b.analysis ? diffRank[b.analysis.difficultyLevel] : 1;
    if (da !== db) return da - db;
    return a.createdAt.localeCompare(b.createdAt);
  };

  const queue = materials
    .filter((m) => (inDegree.get(m.id) || 0) === 0)
    .map((m) => m.id)
    .sort(sortReady);

  const ordered: LibraryMaterialRecord[] = [];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const mat = byId.get(id);
    if (mat) ordered.push(mat);

    for (const nextId of adjacency.get(id) || []) {
      const nextDeg = (inDegree.get(nextId) || 1) - 1;
      inDegree.set(nextId, nextDeg);
      if (nextDeg <= 0 && !visited.has(nextId)) {
        queue.push(nextId);
        queue.sort(sortReady);
      }
    }
  }

  for (const m of materials) {
    if (!visited.has(m.id)) {
      ordered.push(m);
    }
  }

  return ordered;
}

export function formatLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function buildWeekDaySlots(startDate: Date, count: number): Array<{ dayKey: string; dayLabel: string }> {
  const formatter = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const slots: Array<{ dayKey: string; dayLabel: string }> = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    slots.push({
      dayKey: formatLocalDateKey(d),
      dayLabel: i === 0 ? `Today · ${formatter.format(d)}` : formatter.format(d),
    });
  }
  return slots;
}

export function splitMaterialIntoSessions(
  material: LibraryMaterialRecord,
  dailyLimitMinutes: number
): Array<{
  partLabel?: string;
  pagesOrSections: string;
  estimatedMinutes: number;
  learningObjective: string;
}> {
  const analysis = material.analysis;
  const totalMinutes = Math.max(15, analysis?.estimatedMinutes || 40);
  const sections = analysis?.sectionsOrPages || [];
  const cap = Math.max(25, dailyLimitMinutes);

  if (sections.length > 1 && totalMinutes > cap) {
    return sections.map((sec, idx) => ({
      partLabel: `Part ${idx + 1} of ${sections.length}`,
      pagesOrSections: sec.label,
      estimatedMinutes: Math.max(15, Math.min(cap, sec.estimatedMinutes)),
      learningObjective: sec.focus,
    }));
  }

  if (totalMinutes > cap) {
    const numParts = Math.min(4, Math.ceil(totalMinutes / cap));
    const perPart = Math.round(totalMinutes / numParts);
    return Array.from({ length: numParts }, (_, idx) => {
      const pageWindow =
        material.pageCount && material.pageCount > 1
          ? `Pages ${Math.floor((idx * material.pageCount) / numParts) + 1}–${Math.max(
              Math.floor((idx * material.pageCount) / numParts) + 1,
              Math.floor(((idx + 1) * material.pageCount) / numParts)
            )}`
          : material.slideTexts && material.slideTexts.length > 1
          ? `Slides ${Math.floor((idx * material.slideTexts.length) / numParts) + 1}–${Math.max(
              Math.floor((idx * material.slideTexts.length) / numParts) + 1,
              Math.floor(((idx + 1) * material.slideTexts.length) / numParts)
            )}`
          : `Section ${idx + 1}/${numParts}`;
      return {
        partLabel: `Part ${idx + 1} of ${numParts}`,
        pagesOrSections: pageWindow,
        estimatedMinutes: perPart,
        learningObjective:
          analysis?.learningObjectives[idx % Math.max(1, analysis.learningObjectives.length)] ||
          analysis?.conciseSummary ||
          `Study ${material.title}`,
      };
    });
  }

  return [
    {
      pagesOrSections:
        sections[0]?.label ||
        (material.pageCount
          ? `Pages 1–${material.pageCount}`
          : material.slideTexts?.length
          ? `Slides 1–${material.slideTexts.length}`
          : 'Full Material'),
      estimatedMinutes: totalMinutes,
      learningObjective:
        analysis?.learningObjectives[0] ||
        analysis?.conciseSummary ||
        `Review and master ${material.title}`,
    },
  ];
}

export function scheduleStudySessions(params: {
  materials: LibraryMaterialRecord[];
  prerequisiteLinks: CrossMaterialPrerequisiteLink[];
  preferences: StudySchedulePreferences;
  existingManualSessions?: StudySessionItem[];
  startDate?: Date;
}): StudySessionItem[] {
  const {
    materials,
    prerequisiteLinks,
    preferences,
    existingManualSessions = [],
    startDate = new Date(),
  } = params;

  const eligible = materials.filter(
    (m) => m.studyStatus !== 'completed' && m.analysis
  );
  const ordered = topologicalStudyOrder(eligible, prerequisiteLinks);
  const days = buildWeekDaySlots(startDate, Math.max(1, Math.min(7, preferences.studyDaysPerWeek)));
  const dayMinutesUsed = new Map<string, number>();
  const dayHardCount = new Map<string, number>();

  for (const s of existingManualSessions) {
    dayMinutesUsed.set(s.dayKey, (dayMinutesUsed.get(s.dayKey) || 0) + s.estimatedMinutes);
    if (s.difficulty === 'Advanced') {
      dayHardCount.set(s.dayKey, (dayHardCount.get(s.dayKey) || 0) + 1);
    }
  }

  const seenMaterialPartKeys = new Set(
    existingManualSessions.map((s) => `${s.materialId}::${s.partLabel || 'full'}`)
  );

  const generated: StudySessionItem[] = [...existingManualSessions];
  let cursorDayIdx = 0;

  for (const mat of ordered) {
    const analysis = mat.analysis!;
    const chunks = splitMaterialIntoSessions(mat, preferences.dailyStudyMinutes);

    for (let cIdx = 0; cIdx < chunks.length; cIdx++) {
      const chunk = chunks[cIdx];
      const dedupeKey = `${mat.id}::${chunk.partLabel || 'full'}`;
      if (seenMaterialPartKeys.has(dedupeKey)) continue;
      seenMaterialPartKeys.add(dedupeKey);

      let placedDay = days[days.length - 1];
      let slotType: StudySessionItem['slotType'] = 'upcoming';

      for (let attempt = cursorDayIdx; attempt < days.length; attempt++) {
        const candidate = days[attempt];
        const used = dayMinutesUsed.get(candidate.dayKey) || 0;
        const hardCount = dayHardCount.get(candidate.dayKey) || 0;
        const exceedsHard =
          analysis.difficultyLevel === 'Advanced' &&
          hardCount >= preferences.maxHardSessionsPerDay;

        if (!exceedsHard && used + chunk.estimatedMinutes <= preferences.dailyStudyMinutes) {
          placedDay = candidate;
          slotType = attempt === 0 ? 'today' : 'weekly';
          dayMinutesUsed.set(candidate.dayKey, used + chunk.estimatedMinutes);
          if (analysis.difficultyLevel === 'Advanced') {
            dayHardCount.set(candidate.dayKey, hardCount + 1);
          }
          // Spread subsequent parts of the same material onto later days
          if (chunks.length > 1) {
            cursorDayIdx = Math.min(days.length - 1, attempt + 1);
          }
          break;
        }
      }

      if (slotType === 'upcoming' && days.length > 0) {
        const upcomingDate = new Date(startDate);
        upcomingDate.setDate(startDate.getDate() + days.length + (generated.length % 4));
        placedDay = {
          dayKey: formatLocalDateKey(upcomingDate),
          dayLabel: new Intl.DateTimeFormat('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          }).format(upcomingDate),
        };
      }

      const hasPrereq = prerequisiteLinks.some((l) => l.toMaterialId === mat.id);
      const isPrereqForOthers = prerequisiteLinks.some((l) => l.fromMaterialId === mat.id);

      const whyScheduled = isPrereqForOthers
        ? `Scheduled earlier because other materials depend on ${analysis.mainSubject}.`
        : hasPrereq
        ? `Placed after prerequisite readings in ${analysis.mainSubject}.`
        : analysis.difficultyLevel === 'Advanced'
        ? `Isolated to prevent cognitive overload on heavy study days.`
        : `Balanced into ${placedDay.dayLabel} within your ${preferences.dailyStudyMinutes}-min daily budget.`;

      generated.push({
        id: `sched-${mat.id}-${cIdx}-${placedDay.dayKey}`,
        materialId: mat.id,
        folderId: mat.folderId,
        dayKey: placedDay.dayKey,
        dayLabel: placedDay.dayLabel,
        slotType,
        partLabel: chunk.partLabel,
        pagesOrSections: chunk.pagesOrSections,
        estimatedMinutes: chunk.estimatedMinutes,
        learningObjective: chunk.learningObjective,
        priority: isPrereqForOthers ? 'high' : analysis.difficultyLevel === 'Advanced' ? 'high' : 'medium',
        difficulty: analysis.difficultyLevel,
        whyScheduled,
        completed: false,
        isAiGenerated: true,
      });
    }
  }

  return generated.sort((a, b) => a.dayKey.localeCompare(b.dayKey));
}

export function createDefaultLibraryWorkspace(
  legacyResources: ResearchResourceEntry[] = []
): ResearchLibraryWorkspaceState {
  const now = new Date().toISOString();
  const folderMap = new Map<string, LibraryFolderRecord>();

  const ensureFolder = (name: string, description = ''): LibraryFolderRecord => {
    const clean = name.trim() || 'General Research';
    const existing = folderMap.get(clean.toLowerCase());
    if (existing) return existing;
    const idx = folderMap.size;
    const record: LibraryFolderRecord = {
      id: `folder-${clean.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${idx}`,
      name: clean,
      description,
      accentVariant: FOLDER_ACCENT_VARIANTS[idx % FOLDER_ACCENT_VARIANTS.length],
      isFavorite: idx === 0,
      createdAt: now,
      updatedAt: now,
    };
    folderMap.set(clean.toLowerCase(), record);
    return record;
  };

  // Preserve any existing saved legacy resources by placing them in their real folders
  const migratedMaterials: LibraryMaterialRecord[] = legacyResources.map((res, index) => {
    const f = ensureFolder(res.folder || 'General Research');
    const inferredType: MaterialType = res.url ? 'link' : 'note';
    const hasReadableNotes = Boolean(res.notes && res.notes.trim().length > 0);
    return {
      id: `mat-legacy-${String(res.id)}-${index}`,
      legacyResourceId: res.id,
      folderId: f.id,
      title: res.title,
      materialType: inferredType,
      url: res.url || undefined,
      universitySlug: res.universitySlug ?? null,
      tags: Array.isArray(res.tags) ? res.tags : [],
      notes: res.notes || '',
      extractedText: hasReadableNotes ? res.notes : undefined,
      hasLocalBlob: false,
      contentAccess: hasReadableNotes ? 'partial' : 'unreadable',
      unreadableReason: hasReadableNotes
        ? undefined
        : res.url
        ? 'Fetch the webpage content or add study notes before running AI analysis.'
        : 'Add readable notes or upload a document to analyze.',
      studyStatus: 'not_reviewed',
      analysis: null,
      createdAt: now,
      updatedAt: now,
    };
  });

  if (folderMap.size === 0) {
    ensureFolder(
      'University Research',
      'Core syllabus documents, admission handbooks, and study notes.'
    );
  }

  return {
    version: 1,
    folders: Array.from(folderMap.values()),
    materials: migratedMaterials,
    crossAnalysis: null,
    scheduleSessions: [],
    schedulePreferences: DEFAULT_SCHEDULE_PREFERENCES,
    updatedAt: now,
  };
}
