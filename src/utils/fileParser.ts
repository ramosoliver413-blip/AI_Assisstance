import mammoth from 'mammoth';

export interface ParsedDocument {
  filename: string;
  fileType: string;
  size: number;
  text: string;
  wordCount: number;
}

/**
 * Extracts text from various file formats (.txt, .md, .docx, .doc, .pdf, .json, .csv, etc.)
 */
export async function parseUploadedFile(file: File): Promise<ParsedDocument> {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  let extractedText = '';

  try {
    if (extension === 'docx' || extension === 'doc') {
      const arrayBuffer = await file.arrayBuffer();
      try {
        const result = await mammoth.extractRawText({ arrayBuffer });
        extractedText = result.value || '';
      } catch (docxErr) {
        console.warn('Mammoth extraction failed, falling back to text read:', docxErr);
        extractedText = await file.text();
      }
    } else if (
      extension === 'txt' ||
      extension === 'md' ||
      extension === 'markdown' ||
      extension === 'json' ||
      extension === 'csv' ||
      extension === 'html' ||
      extension === 'htm' ||
      extension === 'rtf'
    ) {
      extractedText = await file.text();
    } else if (extension === 'pdf') {
      // For PDF in browser without heavy binaries, extract ASCII text stream or read text buffer
      try {
        const buffer = await file.arrayBuffer();
        const decoder = new TextDecoder('utf-8');
        const rawContent = decoder.decode(buffer);

        // Simple regex extraction for PDF text streams
        const textBlocks: string[] = [];
        const regex = /BT[\s\S]*?ET/g;
        let match;
        while ((match = regex.exec(rawContent)) !== null) {
          // Extract strings inside parentheses (Text)
          const strings = match[0].match(/\((.*?)\)/g);
          if (strings) {
            const block = strings.map((s) => s.slice(1, -1)).join(' ');
            if (block.trim()) textBlocks.push(block);
          }
        }

        if (textBlocks.length > 0) {
          extractedText = textBlocks.join('\n\n');
        } else {
          // Fallback to basic clean string extract
          const clean = rawContent
            .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          if (clean.length > 50) {
            extractedText = clean;
          } else {
            extractedText = `[PDF Document: ${file.name}]\n(Extracted basic binary stream - length: ${file.size} bytes)`;
          }
        }
      } catch {
        extractedText = await file.text();
      }
    } else {
      // Generic fallback
      extractedText = await file.text();
    }

    // Clean up text
    extractedText = extractedText.replace(/\r\n/g, '\n').trim();

    if (!extractedText) {
      extractedText = `[Empty or unreadable document: ${file.name}]`;
    }

    const words = extractedText.split(/\s+/).filter(Boolean).length;

    return {
      filename: file.name,
      fileType: file.type || extension || 'document',
      size: file.size,
      text: extractedText,
      wordCount: words,
    };
  } catch (err: any) {
    console.error('File parsing error:', err);
    throw new Error(`Failed to read "${file.name}": ${err?.message || 'Unsupported format'}`);
  }
}
