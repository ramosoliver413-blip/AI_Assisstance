import { DocumentFile, LanguageOption } from '../types';

export async function sendChatMessage(
  messages: { role: string; content: string }[],
  documentContext: DocumentFile | null,
  language: LanguageOption = 'auto'
): Promise<string> {
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      documentContext: documentContext
        ? {
            filename: documentContext.filename,
            text: documentContext.text,
          }
        : null,
      language,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Ver_Ram AI encountered an error processing your request.');
  }

  const data = await res.json();
  return data.reply;
}
