import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Paperclip,
  X,
  FileText,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  UploadCloud,
  FileCheck2,
  ListCollapse,
  HelpCircle,
  Clock,
  Plus,
} from 'lucide-react';
import { Message, DocumentFile } from '../types';
import { sendChatMessage } from '../services/aiService';
import { parseUploadedFile } from '../utils/fileParser';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ChatInterfaceProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  activeDocument: DocumentFile | null;
  setActiveDocument: (doc: DocumentFile | null) => void;
  onNewChat: () => void;
  onOpenHistory: () => void;
  historyCount: number;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  setMessages,
  activeDocument,
  setActiveDocument,
  onNewChat,
  onOpenHistory,
  historyCount,
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  const handleFileUpload = async (file: File) => {
    setIsParsingFile(true);
    setErrorMessage(null);
    try {
      const parsed = await parseUploadedFile(file);
      const docFile: DocumentFile = {
        id: 'doc_' + Date.now(),
        filename: parsed.filename,
        fileType: parsed.fileType,
        size: parsed.size,
        text: parsed.text,
        wordCount: parsed.wordCount,
        uploadDate: new Date().toLocaleDateString(),
        status: 'ready',
      };
      setActiveDocument(docFile);
    } catch (err: any) {
      console.error('File parsing error:', err);
      setErrorMessage(err?.message || `Failed to process ${file.name}`);
    } finally {
      setIsParsingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSend = async (customPrompt?: string) => {
    const textToSend = (customPrompt || input).trim();
    if (!textToSend || isLoading) return;

    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setErrorMessage(null);

    const userMessage: Message = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachedDocument: activeDocument
        ? {
            filename: activeDocument.filename,
            wordCount: activeDocument.wordCount,
            size: activeDocument.size,
          }
        : undefined,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const historyPayload = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const replyText = await sendChatMessage(historyPayload, activeDocument);

      const assistantMessage: Message = {
        id: 'msg_' + (Date.now() + 1),
        role: 'assistant',
        content: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setErrorMessage(
        err?.message || "Ver_Ram AI couldn't process that request. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // The 3 dedicated focused functions
  const coreActions = [
    {
      id: 'analyze',
      title: 'Analyze Assignment',
      icon: FileCheck2,
      color: 'text-blue-400 bg-blue-950/80 border-blue-800/80 hover:border-blue-500',
      description: 'Break down instructions, tasks, deadlines & requirements',
      prompt:
        'Analyze this assignment in detail: identify the main objective, specific questions/tasks to complete, deadlines and submission guidelines, and key requirements.',
    },
    {
      id: 'summary',
      title: 'Keypoints & Summary',
      icon: ListCollapse,
      color: 'text-emerald-400 bg-emerald-950/80 border-emerald-800/80 hover:border-emerald-500',
      description: 'Extract core takeaways, main ideas & bulleted summary',
      prompt:
        'Extract the key points and provide a concise, high-yield summary of the core concepts, takeaways, and essential definitions from this material.',
    },
    {
      id: 'questionnaire',
      title: 'Practice Questionnaire',
      icon: HelpCircle,
      color: 'text-purple-400 bg-purple-950/80 border-purple-800/80 hover:border-purple-500',
      description: 'Generate practice quiz questions with answer key & explanations',
      prompt:
        'Create a 5-question practice questionnaire/quiz based on this material with multiple-choice questions (A, B, C, D) and include an Answer Key with explanations.',
    },
  ];

  return (
    <div
      className="flex flex-col h-screen w-full bg-slate-950 text-slate-100 relative overflow-hidden"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.docx,.doc,.txt,.md,.markdown,.csv,.rtf"
        className="hidden"
      />

      {/* Drag & Drop Screen Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center text-white border-4 border-dashed border-indigo-500 m-4 rounded-3xl animate-in fade-in duration-150">
          <UploadCloud className="w-16 h-16 mb-4 text-indigo-400 animate-bounce" />
          <h3 className="text-xl font-bold">Drop your assignment document here</h3>
          <p className="text-sm text-slate-400 mt-1">
            Supports PDF, Word (.docx, .doc), TXT, Markdown, CSV
          </p>
        </div>
      )}

      {/* Sleek Dark Top Header */}
      <header className="bg-slate-900 border-b border-slate-800/80 px-4 sm:px-6 py-3 flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center space-x-3">
          {/* History Button with count badge */}
          <button
            onClick={onOpenHistory}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 hover:text-white px-3 py-1.5 rounded-xl transition-all text-xs font-medium shadow-xs"
            title="Open Assignment History"
          >
            <Clock className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">History</span>
            {historyCount > 0 && (
              <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {historyCount}
              </span>
            )}
          </button>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          {/* Logo & Branding */}
          <div className="flex items-center space-x-2">
            <h1 className="font-bold text-base text-white tracking-tight">
              AssignMATE <span className="text-indigo-400">AI</span>
            </h1>
            <span className="text-xs bg-indigo-950/90 border border-indigo-500/40 text-indigo-300 px-2 py-0.5 rounded-full font-medium">
              Ver_Ram AI
            </span>
          </div>
        </div>

        {/* Right Header Controls */}
        <div className="flex items-center space-x-2">
          {/* Active Attached Document Badge */}
          {activeDocument ? (
            <div className="flex items-center space-x-1.5 bg-indigo-950/90 border border-indigo-500/50 text-indigo-200 px-3 py-1.5 rounded-xl text-xs max-w-[200px] sm:max-w-[280px]">
              <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="truncate font-medium">{activeDocument.filename}</span>
              <button
                onClick={() => setActiveDocument(null)}
                title="Remove attached document"
                className="text-indigo-400 hover:text-red-400 p-0.5 rounded ml-1 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isParsingFile}
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl transition-all text-xs font-medium shadow-xs"
              title="Upload assignment document"
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upload Document</span>
              <span className="sm:hidden">Upload</span>
            </button>
          )}

          {/* New Chat Button */}
          <button
            onClick={onNewChat}
            title="Start New Chat"
            className="flex items-center space-x-1 p-2 sm:px-3 sm:py-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700/80 rounded-xl transition-colors text-xs font-medium"
          >
            <Plus className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>
      </header>

      {/* Main Messages Scroll Area (Eye-Friendly Dark Slate Theme) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 max-w-4xl w-full mx-auto">
        {messages.length === 0 ? (
          /* Empty / Welcome State in Dark Slate */
          <div className="flex flex-col items-center justify-center text-center py-8 sm:py-12 space-y-6 max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/90 text-white flex items-center justify-center shadow-lg shadow-indigo-900/40 border border-indigo-500/30">
              <Bot className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Welcome to <span className="text-indigo-400">AssignMATE AI</span>
              </h2>
              <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                Powered by <strong>Ver_Ram AI</strong>. Focused exclusively on analyzing assignments, extracting keypoints & summaries, and generating practice questionnaires.
              </p>
            </div>

            {/* Document Upload Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-slate-900/80 hover:bg-slate-900 border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-6 text-center cursor-pointer transition-all shadow-xs group"
            >
              <div className="flex flex-col items-center space-y-2.5">
                <div className="p-3 bg-indigo-950/80 border border-indigo-500/30 group-hover:bg-indigo-900/60 rounded-xl text-indigo-400 transition-colors">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div className="font-semibold text-sm text-slate-200">
                  {activeDocument ? (
                    <span className="text-indigo-400">Attached: {activeDocument.filename} ({formatFileSize(activeDocument.size)})</span>
                  ) : (
                    <span>Upload your assignment document</span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Click or drag and drop PDF, Word (.docx, .doc), TXT, Markdown, CSV
                </p>
              </div>
            </div>

            {/* The 3 Core Actions */}
            <div className="w-full space-y-3 pt-2">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
                Choose a focused task or type below
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                {coreActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={() => handleSend(action.prompt)}
                      className="p-4 bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/50 rounded-2xl transition-all shadow-xs flex flex-col justify-between space-y-3 group text-left"
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className={`p-2 rounded-xl border ${action.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-xs text-slate-200 group-hover:text-indigo-400 transition-colors">
                          {action.title}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {action.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start space-x-3 ${
                  isUser ? 'justify-end' : 'justify-start'
                }`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className="max-w-[92%] sm:max-w-[82%] space-y-1.5">
                  {msg.attachedDocument && (
                    <div
                      className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                        isUser
                          ? 'bg-indigo-900/80 text-indigo-200 float-right mb-1 border border-indigo-700/60'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="truncate max-w-[220px]">
                        {msg.attachedDocument.filename}
                      </span>
                    </div>
                  )}

                  {/* Message Bubble (Dark theme) */}
                  <div
                    className={`rounded-2xl p-4 sm:p-5 shadow-xs leading-relaxed clear-both ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-tr-none text-sm'
                        : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-none text-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2 text-[11px] opacity-75">
                      <span className="font-semibold text-slate-300">
                        {isUser ? 'You' : 'Ver_Ram AI'}
                      </span>
                      <span className="text-slate-400">{msg.timestamp}</span>
                    </div>

                    {isUser ? (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    ) : (
                      <MarkdownRenderer content={msg.content} />
                    )}

                    {!isUser && (
                      <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-slate-400 text-xs">
                        <span className="text-[11px] text-slate-500">AssignMATE AI</span>
                        <button
                          onClick={() => handleCopyMessage(msg.id, msg.content)}
                          title="Copy response"
                          className="p-1 hover:text-white hover:bg-slate-800 rounded transition-colors flex items-center space-x-1 text-[11px]"
                        >
                          {copiedMessageId === msg.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400 font-medium">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 shadow-xs mt-1 border border-slate-700">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start space-x-3 justify-start animate-in fade-in duration-150">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none p-4 shadow-xs flex items-center space-x-2.5 text-slate-300 text-sm">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              <span>Ver_Ram AI is working on your request...</span>
            </div>
          </div>
        )}

        {/* Parsing Indicator */}
        {isParsingFile && (
          <div className="bg-indigo-950/80 border border-indigo-500/40 rounded-xl p-3 flex items-center space-x-2 text-indigo-200 text-xs">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-400 shrink-0" />
            <span>Reading and extracting assignment document...</span>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="bg-red-950/80 border border-red-800/80 rounded-xl p-3.5 flex items-start space-x-2 text-red-200 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Dark Slate Chatbox Composer Area */}
      <div className="p-3 sm:p-4 bg-slate-900/95 border-t border-slate-800 shrink-0 shadow-lg backdrop-blur-xs">
        <div className="max-w-4xl mx-auto space-y-2.5">
          {/* Active Document Badge + Quick 3 Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {activeDocument ? (
              <div className="inline-flex items-center space-x-2 bg-indigo-950/90 border border-indigo-500/50 text-indigo-200 px-3 py-1 rounded-xl text-xs">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-semibold truncate max-w-[200px] sm:max-w-sm">
                  {activeDocument.filename}
                </span>
                <span className="text-[11px] text-indigo-400">
                  ({formatFileSize(activeDocument.size)})
                </span>
                <button
                  onClick={() => setActiveDocument(null)}
                  title="Remove document"
                  className="text-indigo-400 hover:text-red-400 p-0.5 rounded transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="text-[11px] text-slate-500">
                Tip: Attach your document to analyze, summarize, or create a quiz
              </div>
            )}

            {/* Quick 3 focused function buttons */}
            <div className="flex items-center space-x-1.5 overflow-x-auto">
              {coreActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={() => handleSend(action.prompt)}
                    disabled={isLoading}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-indigo-950/70 hover:text-indigo-300 text-slate-300 border border-slate-700 hover:border-indigo-500/50 transition-all shrink-0"
                    title={action.description}
                  >
                    <Icon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{action.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Dark Input Bar & Buttons */}
          <div className="flex items-end space-x-2 bg-slate-800/90 border border-slate-700/80 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all shadow-inner">
            {/* Upload Document Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isParsingFile || isLoading}
              title="Upload assignment document (PDF, Word, TXT, CSV)"
              className="flex items-center space-x-1 px-2.5 py-2 text-slate-400 hover:text-indigo-300 hover:bg-slate-700/70 rounded-xl transition-colors shrink-0 font-medium text-xs"
            >
              <Paperclip className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">Upload</span>
            </button>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                activeDocument
                  ? `Ask Ver_Ram AI to analyze, summarize, or quiz on "${activeDocument.filename}"...`
                  : 'Ask Ver_Ram AI to analyze an assignment, summarize keypoints, or make a quiz...'
              }
              rows={1}
              className="flex-1 bg-transparent text-white text-sm focus:outline-none resize-none py-2 px-1 max-h-36 placeholder-slate-500"
            />

            {/* Send Message Button */}
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white p-2.5 rounded-xl transition-all shadow-md flex items-center justify-center shrink-0"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
            <span>Press Enter to send • Shift + Enter for new line • Drag & drop files anytime</span>
            <span>Ver_Ram AI • AssignMATE AI</span>
          </div>
        </div>
      </div>
    </div>
  );
};
