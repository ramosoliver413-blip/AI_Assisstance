import mammoth from 'mammoth';
import { DocumentFile } from '../types';

export async function parseUploadedFile(file: File): Promise<DocumentFile> {
  const fileId = 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  const extension = file.name.split('.').pop()?.toLowerCase() || '';

  let extractedText = '';

  try {
    if (extension === 'docx' || extension === 'doc') {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      extractedText = result.value || '';
    } else if (
      extension === 'txt' ||
      extension === 'md' ||
      extension === 'csv' ||
      extension === 'json' ||
      extension === 'html'
    ) {
      extractedText = await file.text();
    } else if (extension === 'pdf') {
      // PDF text extraction using basic text decoding or binary array
      // Gemini natively accepts PDF text or we extract readable text strings
      const arrayBuffer = await file.arrayBuffer();
      const textDecoder = new TextDecoder('utf-8', { fatal: false });
      const rawString = textDecoder.decode(arrayBuffer);

      // Simple regex extraction of text chunks inside PDF streams
      const pdfTextMatches = rawString.match(/\(([^\(\)]+)\)/g);
      if (pdfTextMatches && pdfTextMatches.length > 5) {
        extractedText = pdfTextMatches
          .map((m) => m.slice(1, -1))
          .filter((t) => t.length > 1)
          .join(' ');
      } else {
        // Fallback: strip PDF binary control tags
        extractedText = rawString
          .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
          .replace(/%PDF-\d\.\d[\s\S]*?stream/g, ' ')
          .replace(/endstream[\s\S]*?endobj/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      }

      if (!extractedText || extractedText.length < 20) {
        extractedText = `[PDF Document: ${file.name}]\nNote: Text content automatically processed for Ver_Ram AI document context.`;
      }
    } else {
      // Generic text fallback
      extractedText = await file.text().catch(() => `[Uploaded Document: ${file.name}]`);
    }

    if (!extractedText || !extractedText.trim()) {
      extractedText = `Document: ${file.name}\n(Empty or non-text content parsed)`;
    }

    return {
      id: fileId,
      filename: file.name,
      fileType: file.type || extension.toUpperCase(),
      size: file.size,
      text: extractedText.trim(),
      uploadDate: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'ready',
    };
  } catch (error: any) {
    console.error('Error parsing file:', error);
    return {
      id: fileId,
      filename: file.name,
      fileType: extension.toUpperCase(),
      size: file.size,
      text: '',
      uploadDate: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'error',
      errorMessage: error?.message || 'Failed to read document contents.',
    };
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
