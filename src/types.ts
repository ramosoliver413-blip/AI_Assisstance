export type LanguageOption = 'auto' | 'en' | 'tl' | 'ceb' | 'taglish' | 'bislish';

export type ResponseStyleOption = 'simple' | 'balanced' | 'detailed';

export interface UserSettings {
  language: LanguageOption;
  responseStyle: ResponseStyleOption;
  theme: 'light' | 'dark';
}

export interface DocumentFile {
  id: string;
  filename: string;
  fileType: string;
  size: number;
  text: string;
  wordCount?: number;
  uploadDate: string;
  status: 'processing' | 'ready' | 'error';
  errorMessage?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  attachedDocument?: {
    filename: string;
    wordCount?: number;
    size?: number;
  };
  error?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  activeDocument: DocumentFile | null;
}

