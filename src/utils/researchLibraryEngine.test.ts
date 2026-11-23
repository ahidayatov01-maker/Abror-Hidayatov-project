import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assessMaterialContentAccess,
  computeFolderMetrics,
  createDefaultLibraryWorkspace,
  detectMaterialType,
  extractXmlTextRuns,
  scheduleStudySessions,
  splitMaterialIntoSessions,
  topologicalStudyOrder,
} from './researchLibraryEngine';
import type { LibraryFolderRecord, LibraryMaterialRecord } from '../types/domain';

function makeMaterial(overrides: Partial<LibraryMaterialRecord> = {}): LibraryMaterialRecord {
  return {
    id: 'm1',
    folderId: 'f1',
    title: 'Sample Material',
    materialType: 'note',
    tags: [],
    notes: '',
    hasLocalBlob: false,
    contentAccess: 'accessible',
    studyStatus: 'analyzed',
    createdAt: '2026-11-01T10:00:00Z',
    updatedAt: '2026-11-01T10:00:00Z',
    analysis: {
      analyzedAt: '2026-11-01T10:05:00Z',
      model: 'gemini-4-hydrogen',
      contentVerification: 'verified_content',
      analysisBasis: 'Full text read',
      mainSubject: 'Calculus',
      conciseSummary: 'Limits and derivatives',
      keyTopics: ['Limits', 'Derivatives'],
      importantConcepts: ['Epsilon-delta', 'Chain rule'],
      learningObjectives: ['Compute limits', 'Differentiate polynomials'],
      difficultyLevel: 'Beginner',
      estimatedMinutes: 45,
      requiredPriorKnowledge: ['Algebra'],
      relatedTopics: ['Integration'],
      recommendedLearningOrderHint: 'Study first',
    },
    ...overrides,
  };
}

test('detectMaterialType identifies PDF, Word, PowerPoint, Image, and Note formats accurately', () => {
  assert.equal(detectMaterialType('syllabus.pdf', 'application/pdf'), 'pdf');
  assert.equal(detectMaterialType('essay.docx', ''), 'word');
  assert.equal(detectMaterialType('lecture1.pptx', ''), 'presentation');
  assert.equal(detectMaterialType('diagram.png', 'image/png'), 'image');
  assert.equal(detectMaterialType('summary.md', 'text/markdown'), 'note');
  assert.equal(detectMaterialType('archive.bin', 'application/octet-stream'), 'other');
});

test('assessMaterialContentAccess refuses to mark unreadable binaries or empty links as accessible', () => {
  const emptyDoc = assessMaterialContentAccess({
    materialType: 'word',
    extractedText: '',
    hasLocalBlob: true,
  });
  assert.equal(emptyDoc.contentAccess, 'unreadable');
  assert.ok(emptyDoc.unreadableReason);

  const validNote = assessMaterialContentAccess({
    materialType: 'note',
    extractedText: 'Eigenvalues and eigenvectors satisfy Av = lambda v.',
    hasLocalBlob: false,
  });
  assert.equal(validNote.contentAccess, 'accessible');

  const unfetchedLink = assessMaterialContentAccess({
    materialType: 'link',
    url: 'https://ocw.mit.edu',
    extractedText: '',
    hasLocalBlob: false,
  });
  assert.equal(unfetchedLink.contentAccess, 'unreadable');
});

test('extractXmlTextRuns cleanly parses DOCX and PPTX XML text runs', () => {
  const xml = '<w:p><w:r><w:t>Linear</w:t></w:r><w:r><w:t>Algebra &amp; Matrices</w:t></w:r></w:p>';
  assert.equal(extractXmlTextRuns(xml, 'w:t'), 'Linear Algebra & Matrices');

  const slideXml = '<p:sp><a:t>Slide 1</a:t><a:t>Key Takeaways</a:t></p:sp>';
  assert.equal(extractXmlTextRuns(slideXml, 'a:t'), 'Slide 1 Key Takeaways');
});

test('computeFolderMetrics calculates progress, AI status, and latest timestamp accurately', () => {
  const folder: LibraryFolderRecord = {
    id: 'f1',
    name: 'Mathematics',
    description: 'Core math',
    accentVariant: 'emerald',
    isFavorite: true,
    createdAt: '2026-11-01T09:00:00Z',
    updatedAt: '2026-11-01T09:00:00Z',
  };
  const mats = [
    makeMaterial({ id: 'm1', studyStatus: 'completed', updatedAt: '2026-11-02T12:00:00Z' }),
    makeMaterial({ id: 'm2', studyStatus: 'ready_to_study', analysis: null }),
  ];
  const metrics = computeFolderMetrics(folder, mats);
  assert.equal(metrics.materialCount, 2);
  assert.equal(metrics.completedCount, 1);
  assert.equal(metrics.analyzedCount, 1);
  assert.equal(metrics.progressPct, 50);
  assert.equal(metrics.aiStatus, 'partial');
  assert.equal(metrics.lastUpdated, '2026-11-02T12:00:00Z');
});

test('topologicalStudyOrder schedules prerequisites before advanced dependent materials', () => {
  const advanced = makeMaterial({
    id: 'm-adv',
    title: 'Multivariable Calculus',
    createdAt: '2026-11-01T08:00:00Z',
    analysis: {
      ...makeMaterial().analysis!,
      difficultyLevel: 'Advanced',
    },
  });
  const prereq = makeMaterial({
    id: 'm-pre',
    title: 'Single-Variable Limits',
    createdAt: '2026-11-01T09:00:00Z',
    analysis: {
      ...makeMaterial().analysis!,
      difficultyLevel: 'Beginner',
    },
  });

  const ordered = topologicalStudyOrder([advanced, prereq], [
    { fromMaterialId: 'm-pre', toMaterialId: 'm-adv', reason: 'Limits required before multivariable' },
  ]);
  assert.deepEqual(
    ordered.map((m) => m.id),
    ['m-pre', 'm-adv']
  );
});

test('splitMaterialIntoSessions breaks large documents into multi-part sessions', () => {
  const largeDoc = makeMaterial({
    id: 'm-big',
    pageCount: 60,
    analysis: {
      ...makeMaterial().analysis!,
      estimatedMinutes: 180,
      difficultyLevel: 'Advanced',
    },
  });
  const parts = splitMaterialIntoSessions(largeDoc, 60);
  assert.equal(parts.length, 3);
  assert.equal(parts[0].partLabel, 'Part 1 of 3');
  assert.match(parts[0].pagesOrSections, /Pages 1–20/);
});

test('scheduleStudySessions avoids duplicating sessions and spaces out advanced materials', () => {
  const m1 = makeMaterial({
    id: 'm1',
    title: 'Foundations',
    analysis: { ...makeMaterial().analysis!, estimatedMinutes: 40, difficultyLevel: 'Beginner' },
  });
  const m2 = makeMaterial({
    id: 'm2',
    title: 'Quantum Mechanics I',
    analysis: { ...makeMaterial().analysis!, estimatedMinutes: 50, difficultyLevel: 'Advanced' },
  });
  const m3 = makeMaterial({
    id: 'm3',
    title: 'Real Analysis I',
    analysis: { ...makeMaterial().analysis!, estimatedMinutes: 50, difficultyLevel: 'Advanced' },
  });

  const sessions = scheduleStudySessions({
    materials: [m1, m2, m3],
    prerequisiteLinks: [{ fromMaterialId: 'm1', toMaterialId: 'm2', reason: 'Foundation' }],
    preferences: { dailyStudyMinutes: 90, studyDaysPerWeek: 5, maxHardSessionsPerDay: 1 },
    startDate: new Date('2026-11-18T08:00:00Z'),
  });

  assert.equal(sessions.length, 3);
  const uniqueIds = new Set(sessions.map((s) => s.materialId));
  assert.equal(uniqueIds.size, 3);

  const m2Session = sessions.find((s) => s.materialId === 'm2')!;
  const m3Session = sessions.find((s) => s.materialId === 'm3')!;
  assert.notEqual(m2Session.dayKey, m3Session.dayKey, 'Two Advanced materials should not overload the same day');
});

test('createDefaultLibraryWorkspace migrates legacy resources without inventing fake files', () => {
  const emptyWs = createDefaultLibraryWorkspace([]);
  assert.equal(emptyWs.folders.length, 1);
  assert.equal(emptyWs.materials.length, 0);

  const migrated = createDefaultLibraryWorkspace([
    {
      id: 'r1',
      title: 'MEXT Guide',
      url: 'https://example.edu',
      folder: 'MEXT Preparation',
      tags: ['Scholarship'],
      notes: 'Requires Japanese placement test info.',
    },
  ]);
  assert.equal(migrated.folders[0].name, 'MEXT Preparation');
  assert.equal(migrated.materials.length, 1);
  assert.equal(migrated.materials[0].contentAccess, 'partial');
});
