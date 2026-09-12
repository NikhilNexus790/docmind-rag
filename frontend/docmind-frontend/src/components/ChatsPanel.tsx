import React, { useState } from 'react';
import {
  MessageSquare, Plus, Trash2, Clock, MessageSquarePlus
} from 'lucide-react';
import { useConversationStore } from '../store/conversationStore';
import { useDocumentStore } from '../store/documentStore';
import type { Conversation } from '../types';
import { clsx } from 'clsx';

function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 172800) return 'Yesterday';
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

const ChatItem: React.FC<{
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}> = ({ conversation, isActive, onSelect, onDelete }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDelete) {
      onDelete();
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 2500);
    }
  };

  return (
    <div
      onClick={onSelect}
      className={clsx(
        'group flex items-center justify-between gap-2.5 p-3 rounded-xl border transition-all duration-200 cursor-pointer select-none',
        isActive
          ? 'border-indigo-500/60 bg-indigo-500/10 shadow-sm shadow-indigo-500/10 text-white'
          : 'border-[#334155] bg-[#1e293b]/50 hover:border-[#475569] text-slate-300 hover:text-white'
      )}
    >
      <div className="flex items-start gap-2.5 min-w-0 flex-1">
        <div
          className={clsx(
            'p-1.5 rounded-lg flex-shrink-0 mt-0.5 transition-colors',
            isActive ? 'bg-indigo-500/20 text-indigo-400' : 'bg-[#0f172a] text-slate-400 group-hover:text-slate-300'
          )}
        >
          <MessageSquare className="w-3.5 h-3.5" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate leading-tight">
            {conversation.title}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <Clock className="w-2.5 h-2.5 text-slate-500 flex-shrink-0" />
            <span className="text-[10px] text-slate-500">
              {formatRelativeTime(conversation.updatedAt)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center flex-shrink-0">
        <button
          onClick={handleDelete}
          className={clsx(
            'p-1 rounded-lg transition-all text-xs cursor-pointer',
            confirmDelete
              ? 'bg-red-500/20 text-red-400 px-2 font-medium'
              : 'opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400 text-slate-400'
          )}
          title="Delete chat"
        >
          {confirmDelete ? 'Sure?' : <Trash2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};

export const ChatsPanel: React.FC = () => {
  const {
    conversations,
    activeConversationId,
    newChat,
    selectChat,
    deleteChat,
  } = useConversationStore();
  const { setActiveTab } = useDocumentStore();

  const handleNewChat = () => {
    newChat();
    setActiveTab('chat');
  };

  const handleSelectChat = (id: string) => {
    selectChat(id);
    setActiveTab('chat');
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* New chat prominent CTA */}
      <div className="p-3 border-b border-[#1e293b] flex-shrink-0">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center px-4">
            <div className="w-10 h-10 bg-[#1e293b] rounded-xl flex items-center justify-center mb-2.5">
              <MessageSquarePlus className="w-5 h-5 text-slate-600" />
            </div>
            <p className="text-xs text-slate-400 font-medium">No chat history yet</p>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Start a new conversation to ask questions about your documents
            </p>
            <button
              onClick={handleNewChat}
              className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors cursor-pointer"
            >
              Start first chat →
            </button>
          </div>
        ) : (
          conversations.map((chat) => (
            <ChatItem
              key={chat.id}
              conversation={chat}
              isActive={activeConversationId === chat.id}
              onSelect={() => handleSelectChat(chat.id)}
              onDelete={() => deleteChat(chat.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ChatsPanel;
