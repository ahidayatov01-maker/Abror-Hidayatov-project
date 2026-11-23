import { GoogleGenAI, Type } from '@google/genai';
import type {
  CrossMaterialAnalysisResult,
  DifficultyLevel,
  LibraryMaterialRecord,
  MaterialAnalysisResult,
  StudySchedulePreferences,
  StudySessionItem,
} from '../types/domain';
import { buildWeekDaySlots, scheduleStudySessions } from '../utils/researchLibraryEngine';

function isDisallowedHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (
    lower === 'localhost' ||
    lower === '::1' ||
    lower.endsWith('.local') ||
    lower.startsWith('127.') ||
    lower.startsWith('10.') ||
    lower.startsWith('192.168.') ||
    lower.startsWith('169.254.')
  ) {
    return true;
  }
  const m172 = /^172\.(\d+)\./.exec(lower);
  if (m172) {
    const oct = Number(m172[1]);
    if (oct >= 16 && oct <= 31) return true;
  }
  return false;
}

export async function inspectWebResourceUrl(rawUrl: string): Promise<{
  ok: boolean;
  title?: string;
  extractedText?: string;
  contentType?: string;
  error?: string;
}> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return { ok: false, error: 'Invalid URL format. Please enter a full http:// or https:// address.' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, error: 'Only HTTP and HTTPS links are supported.' };
  }
  if (isDisallowedHostname(parsed.hostname)) {
    return { ok: false, error: 'Private or local network URLs cannot be fetched.' };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);
    const resp = await fetch(parsed.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent': 'GlobalUniversityIntelligence-LibraryReader/1.0',
        Accept: 'text/html,text/plain,application/xhtml+xml;q=0.9,*/*;q=0.5',
      },
    });
    clearTimeout(timer);

    if (!resp.ok) {
      return {
        ok: false,
        error: `Remote server returned HTTP ${resp.status}. Link content could not be retrieved automatically.`,
      };
    }

    const contentType = resp.headers.get('content-type') || '';
    if (!contentType.includes('text/') && !contentType.includes('html') && !contentType.includes('xml') && !contentType.includes('json')) {
      return {
        ok: false,
        contentType,
        error: `Remote URL returned non-text content (${contentType || 'binary'}). Download the file directly to analyze it.`,
      };
    }

    const raw = await resp.text();
    const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(raw);
    const title = titleMatch
      ? titleMatch[1].replace(/\s+/g, ' ').replace(/&amp;/g, '&').trim()
      : parsed.hostname;

    const cleaned = raw
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleaned.length < 40) {
      return {
        ok: false,
        title,
        error: 'Web page returned minimal readable text (it may require JavaScript rendering or authentication).',
      };
    }

    return {
      ok: true,
      title: title.slice(0, 180),
      extractedText: cleaned.slice(0, 24000),
      contentType,
    };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error && err.name === 'AbortError'
          ? 'Timed out while retrieving the web resource.'
          : 'Unable to reach the web URL from the server.',
    };
  }
}

export async function analyzeMaterialWithGemini(params: {
  ai: GoogleGenAI;
  material: Pick<
    LibraryMaterialRecord,
    'id' | 'title' | 'materialType' | 'fileName' | 'url' | 'notes' | 'extractedText' | 'slideTexts' | 'pageCount'
  >;
  binaryBase64?: string;
  binaryMimeType?: string;
  otherMaterialTitles: Array<{ id: string; title: string; mainSubject?: string }>;
}): Promise<MaterialAnalysisResult> {
  const { ai, material, binaryBase64, binaryMimeType, otherMaterialTitles } = params;

  const textChunks: string[] = [];
  if (material.notes?.trim()) {
    textChunks.push(`STUDENT NOTES:\n${material.notes.trim()}`);
  }
  if (material.slideTexts && material.slideTexts.length > 0) {
    const formattedSlides = material.slideTexts
      .slice(0, 60)
      .map((s, idx) => `Slide ${idx + 1}: ${s}`)
      .join('\n');
    textChunks.push(`PRESENTATION SLIDES CONTENT:\n${formattedSlides}`);
  } else if (material.extractedText?.trim()) {
    textChunks.push(`EXTRACTED DOCUMENT / RESOURCE TEXT:\n${material.extractedText.trim().slice(0, 32000)}`);
  }

  const normalizedMime = (binaryMimeType || '').toLowerCase();
  const hasBinary = Boolean(
    binaryBase64 &&
      (normalizedMime === 'application/pdf' ||
        ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'].includes(normalizedMime))
  );
  const combinedText = textChunks.join('\n\n').trim();

  if (!hasBinary && combinedText.length < 20) {
    throw new Error(
      'Readable material content could not be accessed. Upload a readable document (.pdf, .docx, .pptx, .txt, .md, image) or fetch/paste readable notes before running AI analysis.'
    );
  }

  const promptText = `Analyze this educational material strictly based on its ACTUAL provided content.
Never invent chapters, formulas, topics, or page numbers that are not grounded in the provided content.

MATERIAL METADATA:
- Title: ${material.title}
- Type: ${material.materialType}
- File Name: ${material.fileName || 'N/A'}
- Page / Slide Count: ${material.pageCount ?? material.slideTexts?.length ?? 'Unknown'}
- URL: ${material.url || 'N/A'}

OTHER MATERIALS CURRENTLY IN LIBRARY (for related topic hints only):
${JSON.stringify(otherMaterialTitles.slice(0, 25))}

${combinedText ? combinedText : 'Inspect the attached PDF/Image binary directly for all text, headings, equations, diagrams, and learning objectives.'}`;

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
  if (hasBinary && binaryBase64 && binaryMimeType) {
    parts.push({
      inlineData: {
        mimeType: binaryMimeType,
        data: binaryBase64,
      },
    });
  }
  parts.push({ text: promptText });

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: { parts },
    config: {
      systemInstruction:
        'You are an expert AI Learning Systems Architect analyzing real student study materials. Extract accurate, grounded learning metadata, prerequisites, estimated study time in minutes, and concrete page/section splits when visible in the material. Clearly describe what exact content was read in analysisBasis.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          mainSubject: { type: Type.STRING },
          conciseSummary: { type: Type.STRING },
          analysisBasis: {
            type: Type.STRING,
            description: 'Exact explanation of what content/pages/slides/image were inspected.',
          },
          keyTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
          importantConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
          learningObjectives: { type: Type.ARRAY, items: { type: Type.STRING } },
          difficultyLevel: {
            type: Type.STRING,
            description: 'Must be exactly Beginner, Intermediate, or Advanced',
          },
          estimatedMinutes: { type: Type.INTEGER },
          requiredPriorKnowledge: { type: Type.ARRAY, items: { type: Type.STRING } },
          relatedTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
          recommendedLearningOrderHint: { type: Type.STRING },
          sectionsOrPages: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                focus: { type: Type.STRING },
                estimatedMinutes: { type: Type.INTEGER },
              },
              required: ['label', 'focus', 'estimatedMinutes'],
            },
          },
        },
        required: [
          'mainSubject',
          'conciseSummary',
          'analysisBasis',
          'keyTopics',
          'importantConcepts',
          'learningObjectives',
          'difficultyLevel',
          'estimatedMinutes',
          'requiredPriorKnowledge',
          'relatedTopics',
          'recommendedLearningOrderHint',
        ],
      },
    },
  });

  const rawJson = (response.text ?? '{}').trim();
  const parsed = JSON.parse(rawJson) as Record<string, unknown>;

  const rawDiff = String(parsed.difficultyLevel || 'Intermediate');
  const difficultyLevel: DifficultyLevel =
    rawDiff === 'Beginner' || rawDiff === 'Advanced' ? rawDiff : 'Intermediate';

  return {
    analyzedAt: new Date().toISOString(),
    model: 'gemini-4-hydrogen',
    contentVerification: hasBinary || combinedText.length >= 80 ? 'verified_content' : 'partial_metadata',
    analysisBasis: String(parsed.analysisBasis || 'Inspected uploaded material text.'),
    mainSubject: String(parsed.mainSubject || 'Academic Study'),
    conciseSummary: String(parsed.conciseSummary || ''),
    keyTopics: Array.isArray(parsed.keyTopics) ? parsed.keyTopics.map(String).slice(0, 10) : [],
    importantConcepts: Array.isArray(parsed.importantConcepts)
      ? parsed.importantConcepts.map(String).slice(0, 10)
      : [],
    learningObjectives: Array.isArray(parsed.learningObjectives)
      ? parsed.learningObjectives.map(String).slice(0, 8)
      : [],
    difficultyLevel,
    estimatedMinutes: Math.max(10, Math.min(480, Number(parsed.estimatedMinutes) || 45)),
    requiredPriorKnowledge: Array.isArray(parsed.requiredPriorKnowledge)
      ? parsed.requiredPriorKnowledge.map(String).slice(0, 8)
      : [],
    relatedTopics: Array.isArray(parsed.relatedTopics)
      ? parsed.relatedTopics.map(String).slice(0, 8)
      : [],
    recommendedLearningOrderHint: String(
      parsed.recommendedLearningOrderHint || 'Study according to prerequisite sequence.'
    ),
    sectionsOrPages: Array.isArray(parsed.sectionsOrPages)
      ? parsed.sectionsOrPages.slice(0, 6).map((s: unknown) => {
          const item = (s && typeof s === 'object' ? s : {}) as Record<string, unknown>;
          return {
            label: String(item.label || 'Core Section'),
            focus: String(item.focus || ''),
            estimatedMinutes: Math.max(10, Number(item.estimatedMinutes) || 30),
          };
        })
      : undefined,
  };
}

export async function crossAnalyzeLibraryWithGemini(params: {
  ai: GoogleGenAI;
  materials: LibraryMaterialRecord[];
}): Promise<CrossMaterialAnalysisResult> {
  const { ai, materials } = params;
  const analyzed = materials.filter((m) => Boolean(m.analysis));
  if (analyzed.length < 1) {
    throw new Error('Analyze at least one accessible material before running cross-material analysis.');
  }

  const digest = analyzed.map((m) => ({
    id: m.id,
    title: m.title,
    type: m.materialType,
    mainSubject: m.analysis!.mainSubject,
    keyTopics: m.analysis!.keyTopics,
    requiredPriorKnowledge: m.analysis!.requiredPriorKnowledge,
    difficultyLevel: m.analysis!.difficultyLevel,
    estimatedMinutes: m.analysis!.estimatedMinutes,
    conciseSummary: m.analysis!.conciseSummary,
  }));

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: `Perform cross-material curriculum dependency & sequence analysis on ONLY these verified library materials:\n${JSON.stringify(
      digest
    )}`,
    config: {
      systemInstruction:
        'Identify real prerequisite relationships, overlapping topics, complementary pairs, recommended study sequence from 1..N, and learning sequence gaps strictly using the provided material IDs. Never invent material IDs.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          studySequence: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                materialId: { type: Type.STRING },
                order: { type: Type.INTEGER },
                rationale: { type: Type.STRING },
              },
              required: ['materialId', 'order', 'rationale'],
            },
          },
          prerequisiteLinks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                fromMaterialId: { type: Type.STRING },
                toMaterialId: { type: Type.STRING },
                reason: { type: Type.STRING },
              },
              required: ['fromMaterialId', 'toMaterialId', 'reason'],
            },
          },
          overlappingTopics: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                topic: { type: Type.STRING },
                materialIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                note: { type: Type.STRING },
              },
              required: ['topic', 'materialIds', 'note'],
            },
          },
          complementaryPairs: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                materialAId: { type: Type.STRING },
                materialBId: { type: Type.STRING },
                synergy: { type: Type.STRING },
              },
              required: ['materialAId', 'materialBId', 'synergy'],
            },
          },
          knowledgeGaps: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: [
          'studySequence',
          'prerequisiteLinks',
          'overlappingTopics',
          'complementaryPairs',
          'knowledgeGaps',
        ],
      },
    },
  });

  const parsed = JSON.parse((response.text ?? '{}').trim()) as Record<string, unknown>;
  const validIds = new Set(analyzed.map((m) => m.id));

  return {
    analyzedAt: new Date().toISOString(),
    model: 'gemini-4-hydrogen',
    studySequence: Array.isArray(parsed.studySequence)
      ? parsed.studySequence
          .map((item: unknown, idx: number) => {
            const obj = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
            return {
              materialId: String(obj.materialId || ''),
              order: Number(obj.order) || idx + 1,
              rationale: String(obj.rationale || ''),
            };
          })
          .filter((x) => validIds.has(x.materialId))
      : [],
    prerequisiteLinks: Array.isArray(parsed.prerequisiteLinks)
      ? parsed.prerequisiteLinks
          .map((item: unknown) => {
            const obj = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
            return {
              fromMaterialId: String(obj.fromMaterialId || ''),
              toMaterialId: String(obj.toMaterialId || ''),
              reason: String(obj.reason || ''),
            };
          })
          .filter(
            (l) =>
              validIds.has(l.fromMaterialId) &&
              validIds.has(l.toMaterialId) &&
              l.fromMaterialId !== l.toMaterialId
          )
      : [],
    overlappingTopics: Array.isArray(parsed.overlappingTopics)
      ? parsed.overlappingTopics.map((item: unknown) => {
          const obj = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
          return {
            topic: String(obj.topic || ''),
            materialIds: Array.isArray(obj.materialIds)
              ? obj.materialIds.map(String).filter((id) => validIds.has(id))
              : [],
            note: String(obj.note || ''),
          };
        })
      : [],
    complementaryPairs: Array.isArray(parsed.complementaryPairs)
      ? parsed.complementaryPairs
          .map((item: unknown) => {
            const obj = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
            return {
              materialAId: String(obj.materialAId || ''),
              materialBId: String(obj.materialBId || ''),
              synergy: String(obj.synergy || ''),
            };
          })
          .filter((p) => validIds.has(p.materialAId) && validIds.has(p.materialBId))
      : [],
    knowledgeGaps: Array.isArray(parsed.knowledgeGaps)
      ? parsed.knowledgeGaps.map(String)
      : [],
  };
}

export async function generateStudyScheduleWithGemini(params: {
  ai: GoogleGenAI;
  materials: LibraryMaterialRecord[];
  prerequisiteLinks: CrossMaterialAnalysisResult['prerequisiteLinks'];
  preferences: StudySchedulePreferences;
  existingManualSessions: StudySessionItem[];
  startDate?: Date;
}): Promise<{ sessions: StudySessionItem[]; summaryNote: string }> {
  const { ai, materials, prerequisiteLinks, preferences, existingManualSessions, startDate = new Date() } =
    params;

  const eligible = materials.filter((m) => m.studyStatus !== 'completed' && m.analysis);
  if (eligible.length === 0) {
    throw new Error('Analyze at least one uncompleted material first so AI can build a grounded study schedule.');
  }

  // Deterministic topological baseline guarantees prerequisite safety and session splitting
  const baselineSessions = scheduleStudySessions({
    materials: eligible,
    prerequisiteLinks,
    preferences,
    existingManualSessions,
    startDate,
  });

  const daySlots = buildWeekDaySlots(startDate, Math.max(1, Math.min(7, preferences.studyDaysPerWeek)));
  const materialById = new Map(eligible.map((m) => [m.id, m]));

  const aiDigest = baselineSessions.map((s) => ({
    sessionId: s.id,
    materialTitle: materialById.get(s.materialId)?.title || s.materialId,
    subject: materialById.get(s.materialId)?.analysis?.mainSubject || '',
    difficulty: s.difficulty,
    partLabel: s.partLabel || null,
    pagesOrSections: s.pagesOrSections,
    dayKey: s.dayKey,
    dayLabel: s.dayLabel,
    estimatedMinutes: s.estimatedMinutes,
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Refine the coaching rationale ("whyScheduled") and focused "learningObjective" for each scheduled study session below, keeping the exact sessionIds, and write a brief 1-2 sentence weekly pacing summary.\nPreferences: ${JSON.stringify(
        preferences
      )}\nDay slots: ${JSON.stringify(daySlots)}\nSessions: ${JSON.stringify(aiDigest)}`,
      config: {
        systemInstruction:
          'You are an expert Academic Study Planner. Produce clear, practical, concise explanations for why each real material session sits on its assigned day and what exact learning objective the student should master. Never invent materials or page numbers.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summaryNote: { type: Type.STRING },
            sessionUpdates: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sessionId: { type: Type.STRING },
                  whyScheduled: { type: Type.STRING },
                  learningObjective: { type: Type.STRING },
                },
                required: ['sessionId', 'whyScheduled', 'learningObjective'],
              },
            },
          },
          required: ['summaryNote', 'sessionUpdates'],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim()) as {
      summaryNote?: string;
      sessionUpdates?: Array<{ sessionId: string; whyScheduled: string; learningObjective: string }>;
    };

    const updateMap = new Map(
      (parsed.sessionUpdates || []).map((u) => [u.sessionId, u])
    );

    const refined = baselineSessions.map((s) => {
      const upd = updateMap.get(s.id);
      if (!upd) return s;
      return {
        ...s,
        whyScheduled: upd.whyScheduled || s.whyScheduled,
        learningObjective: upd.learningObjective || s.learningObjective,
      };
    });

    return {
      sessions: refined,
      summaryNote:
        parsed.summaryNote ||
        `Scheduled ${refined.length} study session(s) across ${daySlots.length} day(s), prioritizing prerequisites and balancing difficult topics.`,
    };
  } catch (err) {
    console.warn('Gemini schedule rationale enrichment fallback to verified baseline:', err);
    return {
      sessions: baselineSessions,
      summaryNote: `Scheduled ${baselineSessions.length} session(s) in topological prerequisite order (${preferences.dailyStudyMinutes} min/day budget).`,
    };
  }
}
