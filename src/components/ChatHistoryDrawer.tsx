import React, { useState } from 'react';
import {
  X,
  Plus,
  MessageSquare,
  FileText,
  Trash2,
  Edit2,
  Check,
  Search,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { ChatSession } from '../types';

interface ChatHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
}

export const ChatHistoryDrawer: React.FC<ChatHistoryDrawerProps> = ({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onRenameSession,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredSessions = sessions.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.title.toLowerCase().includes(q) ||
      (s.activeDocument && s.activeDocument.filename.toLowerCase().includes(q))
    );
  });

  const handleStartRename = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmId(null);
    setEditingSessionId(session.id);
    setEditTitle(session.title);
  };

  const handleSaveRename = (id: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingSessionId(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteSession(id);
    setDeleteConfirmId(null);
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffHours < 24 && now.getDate() === date.getDate()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-xs sm:max-w-sm bg-slate-900 border-r border-slate-800 h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-left duration-200 text-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            <h2 className="font-bold text-base text-white">Assignment History</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Close History"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3 border-b border-slate-800">
          <button
            onClick={() => {
              onNewSession();
              onClose();
            }}
            className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 px-4 rounded-xl transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Assignment Chat</span>
          </button>
        </div>

        {/* Search Filter */}
        <div className="p-3 border-b border-slate-800">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-500 absolute left-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search past assignments..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-10 px-4 text-slate-500 text-xs">
              {searchQuery ? 'No matching assignments found.' : 'No saved assignments yet.'}
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isSelected = session.id === currentSessionId;
              const isEditing = editingSessionId === session.id;
              const isConfirmingDelete = deleteConfirmId === session.id;

              return (
                <div
                  key={session.id}
                  onClick={() => {
                    if (!isEditing && !isConfirmingDelete) {
                      onSelectSession(session.id);
                      onClose();
                    }
                  }}
                  className={`relative flex items-start space-x-2.5 p-3 rounded-xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-slate-800 border-indigo-500/60 text-white shadow-xs'
                      : 'border-slate-800/60 bg-slate-900/60 hover:bg-slate-800/70 text-slate-300 hover:text-white'
                  }`}
                >
                  <MessageSquare
                    className={`w-4 h-4 shrink-0 mt-0.5 ${
                      isSelected ? 'text-indigo-400' : 'text-slate-500'
                    }`}
                  />

                  <div className="flex-1 overflow-hidden min-w-0">
                    {isEditing ? (
                      <form
                        onSubmit={(e) => handleSaveRename(session.id, e)}
                        className="flex items-center space-x-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          autoFocus
                          onBlur={() => handleSaveRename(session.id)}
                          className="bg-slate-950 border border-indigo-500 rounded px-2 py-0.5 text-xs text-white w-full focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="p-1 text-emerald-400 hover:text-emerald-300"
                          title="Save Title"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-xs truncate max-w-[150px] sm:max-w-[170px]">
                            {session.title || 'Untitled Assignment'}
                          </h4>
                          <span className="text-[10px] text-slate-500 shrink-0 ml-1">
                            {formatTime(session.updatedAt)}
                          </span>
                        </div>

                        {/* Document & Message Indicators */}
                        <div className="flex items-center space-x-2 mt-1 text-[11px] text-slate-500">
                          {session.activeDocument && (
                            <span className="inline-flex items-center space-x-1 text-indigo-400 font-medium truncate max-w-[130px]">
                              <FileText className="w-3 h-3 shrink-0" />
                              <span className="truncate">{session.activeDocument.filename}</span>
                            </span>
                          )}
                          <span>
                            {session.messages.length}{' '}
                            {session.messages.length === 1 ? 'msg' : 'msgs'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Inline Delete Confirmation or Action Buttons */}
                  <div className="flex items-center space-x-1 shrink-0 self-center">
                    {isConfirmingDelete ? (
                      <div
                        className="flex items-center space-x-1 bg-red-950 border border-red-500/70 text-red-200 px-2 py-1 rounded-lg text-xs animate-in fade-in duration-150"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-[10px] font-semibold text-red-300 mr-0.5">Delete?</span>
                        <button
                          onClick={(e) => handleDelete(session.id, e)}
                          className="px-1.5 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-bold transition-colors"
                          title="Confirm Delete"
                        >
                          Yes
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(null);
                          }}
                          className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] transition-colors"
                          title="Cancel"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      !isEditing && (
                        <div className="flex items-center space-x-0.5">
                          <button
                            onClick={(e) => handleStartRename(session, e)}
                            title="Rename assignment"
                            className="p-1 text-slate-400 hover:text-white hover:bg-slate-700/80 rounded transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(session.id);
                            }}
                            title="Delete assignment"
                            className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-700/80 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          {isSelected && (
                            <ChevronRight className="w-3.5 h-3.5 text-indigo-400 ml-0.5" />
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-800 text-center text-[11px] text-slate-500">
          AssignMATE AI • Saved in browser storage
        </div>
      </div>
    </div>
  );
};
