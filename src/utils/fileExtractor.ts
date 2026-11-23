import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import type { MaterialContentAccess, MaterialType } from '../types/domain';
import {
  assessMaterialContentAccess,
  detectMaterialType,
  extractXmlTextRuns,
} from './researchLibraryEngine';

export interface ExtractedFilePayload {
  title: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  materialType: MaterialType;
  extractedText?: string;
  slideTexts?: string[];
  pageCount?: number | null;
  previewDataUrl?: string;
  contentAccess: MaterialContentAccess;
  unreadableReason?: string;
  blob: Blob;
}

function stripExtension(name: string): string {
  return name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim() || name;
}

function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(reader.error || new Error('Failed to read image data URL.'));
    reader.readAsDataURL(blob);
  });
}

export async function extractMaterialContent(file: File): Promise<ExtractedFilePayload> {
  const fileName = file.name || 'Untitled Resource';
  const mimeType = file.type || 'application/octet-stream';
  const materialType = detectMaterialType(fileName, mimeType);
  const title = stripExtension(fileName);

  let extractedText: string | undefined;
  let slideTexts: string[] | undefined;
  let pageCount: number | null = null;
  let previewDataUrl: string | undefined;
  let unreadableReason: string | undefined;

  try {
    if (materialType === 'note') {
      const text = (await file.text()).trim();
      if (text.length === 0) {
        unreadableReason = 'Uploaded text file is empty.';
      } else {
        extractedText = text.slice(0, 80000);
      }
    } else if (materialType === 'image') {
      if (file.size === 0) {
        unreadableReason = 'Image file is empty (0 bytes).';
      } else {
        previewDataUrl = await readBlobAsDataUrl(file);
        if (mimeType === 'image/svg+xml' || fileName.toLowerCase().endsWith('.svg')) {
          extractedText = (await file.text()).slice(0, 24000);
        } else {
          extractedText = `Visual study material (${fileName}, ${Math.max(1, Math.round(file.size / 1024))} KB).`;
        }
      }
    } else if (materialType === 'pdf') {
      const bytes = await file.arrayBuffer();
      if (bytes.byteLength < 8) {
        unreadableReason = 'PDF file appears empty or truncated.';
      } else {
        try {
          const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: false });
          pageCount = pdfDoc.getPageCount();
          const metaParts: string[] = [];
          const pdfTitle = pdfDoc.getTitle();
          const pdfAuthor = pdfDoc.getAuthor();
          const pdfSubject = pdfDoc.getSubject();
          if (pdfTitle) metaParts.push(`Document Title: ${pdfTitle}`);
          if (pdfAuthor) metaParts.push(`Author: ${pdfAuthor}`);
          if (pdfSubject) metaParts.push(`Subject: ${pdfSubject}`);
          metaParts.push(`Pages: ${pageCount}`);
          extractedText = metaParts.join('\n');
        } catch (pdfErr: unknown) {
          const msg = pdfErr instanceof Error ? pdfErr.message : '';
          if (msg.toLowerCase().includes('encrypt')) {
            unreadableReason =
              'This PDF is password-protected/encrypted. Remove password protection to preview and run AI analysis.';
          } else {
            unreadableReason =
              'PDF structure appears corrupted or unreadable and could not be parsed cleanly.';
          }
        }
      }
    } else if (materialType === 'word') {
      const lower = fileName.toLowerCase();
      if (lower.endsWith('.docx')) {
        const bytes = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(bytes);
        const docXml = await zip.file('word/document.xml')?.async('text');
        if (!docXml) {
          unreadableReason = 'Could not locate readable document XML inside this .docx archive.';
        } else {
          const paragraphs = docXml
            .split(/<\/w:p>/g)
            .map((chunk) => extractXmlTextRuns(chunk, 'w:t'))
            .filter(Boolean);
          const joined = paragraphs.join('\n\n').trim();
          if (!joined) {
            unreadableReason = 'Word document contains no extractable text paragraphs.';
          } else {
            extractedText = joined.slice(0, 60000);
          }
        }
      } else {
        unreadableReason =
          'Legacy binary .doc files cannot be parsed directly in the browser. Convert to .docx or PDF for full inspection and AI analysis.';
      }
    } else if (materialType === 'presentation') {
      const lower = fileName.toLowerCase();
      if (lower.endsWith('.pptx')) {
        const bytes = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(bytes);
        const slideFiles = Object.keys(zip.files)
          .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
          .sort((a, b) => {
            const na = Number(/slide(\d+)\.xml/i.exec(a)?.[1] || 0);
            const nb = Number(/slide(\d+)\.xml/i.exec(b)?.[1] || 0);
            return na - nb;
          });

        if (slideFiles.length === 0) {
          unreadableReason = 'No slides were found inside this .pptx presentation.';
        } else {
          const collected: string[] = [];
          for (const slidePath of slideFiles) {
            const xml = await zip.file(slidePath)?.async('text');
            const text = xml ? extractXmlTextRuns(xml, 'a:t') : '';
            collected.push(text || '(Visual / non-text slide)');
          }
          slideTexts = collected;
          pageCount = collected.length;
          const meaningful = collected.filter((s) => s !== '(Visual / non-text slide)').join('\n');
          if (!meaningful.trim()) {
            unreadableReason = 'Presentation slides contain no extractable text runs.';
          } else {
            extractedText = collected
              .map((s, idx) => `Slide ${idx + 1}: ${s}`)
              .join('\n\n')
              .slice(0, 60000);
          }
        }
      } else {
        unreadableReason =
          'Legacy binary .ppt presentations cannot be read directly in the browser. Save as .pptx or PDF for full slide extraction and AI analysis.';
      }
    } else {
      // Check if unknown extension happens to contain plain UTF-8 text
      if (file.size > 0 && file.size <= 512 * 1024 && mimeType.startsWith('text/')) {
        extractedText = (await file.text()).slice(0, 60000);
      } else {
        unreadableReason =
          'Unsupported binary format — content cannot be extracted safely for preview or AI analysis.';
      }
    }
  } catch (err: unknown) {
    unreadableReason =
      err instanceof Error
        ? `Could not extract content: ${err.message}`
        : 'File could not be parsed cleanly.';
  }

  const assessment = assessMaterialContentAccess({
    materialType,
    extractedText,
    hasLocalBlob: !unreadableReason,
    unreadableReason,
  });

  return {
    title,
    fileName,
    mimeType,
    fileSizeBytes: file.size,
    materialType,
    extractedText,
    slideTexts,
    pageCount,
    previewDataUrl,
    contentAccess: assessment.contentAccess,
    unreadableReason: assessment.unreadableReason,
    blob: file,
  };
}
