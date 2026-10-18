import React, { useState, useEffect } from 'react';
import { ChatInterface } from './components/ChatInterface';
import { ChatHistoryDrawer } from './components/ChatHistoryDrawer';
import { ChatSession, Message, DocumentFile } from './types';

const STORAGE_KEY_SESSIONS = 'assignmate_ai_sessions_v4';

const createDefaultSession = (): ChatSession => ({
  id: 'sess_' + Date.now(),
  title: 'New Assignment Chat',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  messages: [],
  activeDocument: null,
});

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SESSIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to restore chat sessions:', e);
    }
    return [createDefaultSession()];
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    return sessions[0]?.id || 'sess_default';
  });

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Persist sessions whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
    } catch (e) {
      console.warn('Failed to persist sessions:', e);
    }
  }, [sessions]);

  // Current active session
  const currentSession =
    sessions.find((s) => s.id === currentSessionId) || sessions[0] || createDefaultSession();

  const handleUpdateMessages: React.Dispatch<React.SetStateAction<Message[]>> = (updater) => {
    setSessions((prevSessions) => {
      return prevSessions.map((s) => {
        if (s.id === currentSession.id) {
          const newMessages = typeof updater === 'function' ? updater(s.messages) : updater;
          // Auto-generate title if it's default
          let title = s.title;
          if (
            (s.title === 'New Assignment Chat' || s.title === 'Untitled Chat') &&
            newMessages.length > 0
          ) {
            const firstUserMsg = newMessages.find((m) => m.role === 'user');
            if (firstUserMsg) {
              title =
                firstUserMsg.content.slice(0, 30).trim() +
                (firstUserMsg.content.length > 30 ? '...' : '');
            }
          }

          return {
            ...s,
            messages: newMessages,
            title,
            updatedAt: new Date().toISOString(),
          };
        }
        return s;
      });
    });
  };

  const handleSetActiveDocument = (doc: DocumentFile | null) => {
    setSessions((prevSessions) => {
      return prevSessions.map((s) => {
        if (s.id === currentSession.id) {
          let title = s.title;
          if (doc && (s.title === 'New Assignment Chat' || s.title === 'Untitled Chat')) {
            title = doc.filename.replace(/\.[^/.]+$/, '').slice(0, 28);
          }
          return {
            ...s,
            activeDocument: doc,
            title,
            updatedAt: new Date().toISOString(),
          };
        }
        return s;
      });
    });
  };

  const handleNewSession = () => {
    const newSess = createDefaultSession();
    setSessions((prev) => [newSess, ...prev]);
    setCurrentSessionId(newSess.id);
  };

  const handleDeleteSession = (id: string) => {
    setSessions((prev) => {
      const remaining = prev.filter((s) => s.id !== id);
      if (remaining.length === 0) {
        const fresh = createDefaultSession();
        setCurrentSessionId(fresh.id);
        return [fresh];
      }
      if (currentSessionId === id) {
        setCurrentSessionId(remaining[0].id);
      }
      return remaining;
    });
  };

  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle, updatedAt: new Date().toISOString() } : s))
    );
  };

  return (
    <div className="h-screen w-screen flex bg-slate-950 overflow-hidden font-sans select-text">
      {/* Main Chat Interface */}
      <ChatInterface
        messages={currentSession.messages}
        setMessages={handleUpdateMessages}
        activeDocument={currentSession.activeDocument}
        setActiveDocument={handleSetActiveDocument}
        onNewChat={handleNewSession}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={sessions.length}
      />

      {/* Assignment Chat History Drawer */}
      <ChatHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        sessions={sessions}
        currentSessionId={currentSession.id}
        onSelectSession={(id) => setCurrentSessionId(id)}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
      />
    </div>
  );
}
