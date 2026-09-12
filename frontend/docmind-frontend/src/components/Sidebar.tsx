import React, { useState } from 'react';
import {
  FileText, Trash2, ChevronDown, ChevronUp,
  CheckCircle, Clock, AlertCircle, Loader2,
  Upload, RefreshCw, X, FileType, FilePieChart, File,
  FolderOpen, MessageSquare
} from 'lucide-react';
import { useDocumentStore } from '../store/documentStore';
import { useConversationStore } from '../store/conversationStore';
import type { DocumentMetadataDto, DocumentStatus } from '../types';
import ChatsPanel from './ChatsPanel';
import { clsx } from 'clsx';

interface SidebarProps {
  onUploadClick: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getFileEmoji(contentType: string): React.ReactNode {
  if (contentType.includes('pdf')) return <FileText className="w-4 h-4 text-red-400" />;
  if (contentType.includes('word') || contentType.includes('docx')) return <FileType className="w-4 h-4 text-blue-400" />;
  if (contentType.includes('csv')) return <FilePieChart className="w-4 h-4 text-green-400" />;
  return <File className="w-4 h-4 text-slate-400" />;
}

const STATUS_CONFIG: Record<DocumentStatus, { icon: React.ReactNode; color: string; dot: string; label: string }> = {
  INDEXED: {
    icon: <CheckCircle className="w-3 h-3" />,
    color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    dot: 'bg-emerald-400',
    label: 'Indexed',
  },
  PROCESSING: {
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
    color: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    dot: 'bg-amber-400 animate-pulse',
    label: 'Processing',
  },
  UPLOADING: {
    icon: <Clock className="w-3 h-3" />,
    color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    dot: 'bg-blue-400 animate-pulse',
    label: 'Uploading',
  },
  FAILED: {
    icon: <AlertCircle className="w-3 h-3" />,
    color: 'text-red-400 bg-red-400/10 border-red-400/20',
    dot: 'bg-red-400',
    label: 'Failed',
  },
};

const StatusBadge: React.FC<{ status: DocumentStatus }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border', cfg.color)}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
};

const DocumentItem: React.FC<{ doc: DocumentMetadataDto }> = ({ doc }) => {
  const { selectedDocumentId, setSelectedDocumentId, deleteDocument } = useDocumentStore();
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isSelected = selectedDocumentId === doc.id;

  const handleDelete = () => {
    if (confirmDelete) {
      deleteDocument(doc.id);
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 2500);
    }
  };

  return (
    <div
      className={clsx(
        'rounded-xl border transition-all duration-200 overflow-hidden',
        isSelected
          ? 'border-indigo-500/60 bg-indigo-500/8 shadow-sm shadow-indigo-500/10'
          : 'border-[#334155] bg-[#1e293b]/50 hover:border-[#475569]'
      )}
    >
      {/* Main row */}
      <div
        className="flex items-start gap-2.5 p-3 cursor-pointer"
        onClick={() => setSelectedDocumentId(isSelected ? null : doc.id)}
      >
        <div className={clsx(
          'p-1.5 rounded-lg flex-shrink-0 mt-0.5 transition-colors',
          isSelected ? 'bg-indigo-500/20' : 'bg-[#0f172a]'
        )}>
          {getFileEmoji(doc.contentType)}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm text-white font-medium truncate leading-tight" title={doc.filename}>
            {doc.filename}
          </p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <StatusBadge status={doc.status} />
            <span className="text-xs text-slate-500">{formatBytes(doc.fileSize)}</span>
          </div>
        </div>

        <div className="flex items-center gap-0.5 flex-shrink-0 mt-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="p-1 hover:bg-[#334155] rounded-lg transition-colors cursor-pointer"
          >
            {expanded
              ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(); }}
            className={clsx(
              'p-1 rounded-lg transition-all text-xs cursor-pointer',
              confirmDelete
                ? 'bg-red-500/20 text-red-400 px-2 font-medium'
                : 'hover:bg-red-500/10 hover:text-red-400 text-slate-400'
            )}
          >
            {confirmDelete ? 'Sure?' : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded info */}
      {expanded && (
        <div className="px-3 pb-3 border-t border-[#334155]/60">
          <div className="grid grid-cols-3 gap-1.5 mt-2.5">
            {doc.totalChunks != null && (
              <div className="bg-[#0f172a] rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-indigo-400">{doc.totalChunks}</p>
                <p className="text-xs text-slate-500">chunks</p>
              </div>
            )}
            {doc.totalPages != null && (
              <div className="bg-[#0f172a] rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-slate-200">{doc.totalPages}</p>
                <p className="text-xs text-slate-500">pages</p>
              </div>
            )}
            <div className="bg-[#0f172a] rounded-lg p-2 text-center">
              <p className="text-sm font-semibold text-slate-200">{formatDate(doc.createdAt)}</p>
              <p className="text-xs text-slate-500">added</p>
            </div>
          </div>
          {doc.errorMessage && (
            <div className="mt-2 px-2 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-xs text-red-400">{doc.errorMessage}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ onUploadClick }) => {
  const {
    documents,
    isLoadingDocuments,
    fetchDocuments,
    selectedDocumentId,
    setSelectedDocumentId,
    isSidebarOpen,
    setIsSidebarOpen,
  } = useDocumentStore();

  const { conversations, loadChats } = useConversationStore();

  const [sidebarTab, setSidebarTab] = useState<'documents' | 'chats'>('documents');

  const handleRefresh = () => {
    if (sidebarTab === 'documents') {
      fetchDocuments();
    } else {
      loadChats();
    }
  };

  return (
    <aside
      className={clsx(
        'flex flex-col h-full bg-[#111827] border-r border-[#1e293b] transition-all duration-300 flex-shrink-0',
        isSidebarOpen ? 'w-72' : 'w-0 overflow-hidden'
      )}
    >
      {/* Sidebar Mode Tabs */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#1e293b] flex-shrink-0 bg-[#0f172a]/70">
        <div className="flex items-center gap-1 bg-[#1e293b] p-0.5 rounded-lg border border-[#334155]">
          <button
            onClick={() => setSidebarTab('documents')}
            className={clsx(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer',
              sidebarTab === 'documents'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            )}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Docs</span>
            <span className={clsx('text-[10px] px-1 py-0.2 rounded-full', sidebarTab === 'documents' ? 'bg-indigo-700' : 'bg-[#0f172a] text-slate-400')}>
              {documents.length}
            </span>
          </button>

          <button
            onClick={() => setSidebarTab('chats')}
            className={clsx(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer',
              sidebarTab === 'chats'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            )}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chats</span>
            <span className={clsx('text-[10px] px-1 py-0.2 rounded-full', sidebarTab === 'chats' ? 'bg-indigo-700' : 'bg-[#0f172a] text-slate-400')}>
              {conversations.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleRefresh}
            className="p-1.5 hover:bg-[#1e293b] rounded-lg transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={clsx('w-3.5 h-3.5 text-slate-400', isLoadingDocuments && 'animate-spin')} />
          </button>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 hover:bg-[#1e293b] rounded-lg transition-colors cursor-pointer"
            title="Close sidebar"
          >
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {sidebarTab === 'chats' ? (
        <ChatsPanel />
      ) : (
        <div className="flex flex-col h-full overflow-hidden">
          {/* Upload CTA */}
          <div className="p-3 border-b border-[#1e293b] flex-shrink-0">
            <button
              onClick={onUploadClick}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Documents</span>
            </button>
          </div>

          {/* Active filter chip */}
          {selectedDocumentId && (
            <div className="px-3 py-2 flex-shrink-0 border-b border-[#1e293b]/60">
              <button
                onClick={() => setSelectedDocumentId(null)}
                className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 px-3 py-1 rounded-full transition-all w-full justify-center cursor-pointer"
              >
                <X className="w-3 h-3" />
                Clear document filter
              </button>
            </div>
          )}

          {/* Doc list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {isLoadingDocuments ? (
              <div className="flex flex-col items-center justify-center h-32 gap-2">
                <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                <p className="text-xs text-slate-500">Loading documents…</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-52 text-center px-4">
                <div className="w-12 h-12 bg-[#1e293b] rounded-xl flex items-center justify-center mb-3">
                  <FileText className="w-6 h-6 text-slate-600" />
                </div>
                <p className="text-sm text-slate-400 font-medium">No documents yet</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Upload PDF, DOCX, TXT, MD or CSV files to get started
                </p>
                <button
                  onClick={onUploadClick}
                  className="mt-4 text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors cursor-pointer"
                >
                  Upload your first document →
                </button>
              </div>
            ) : (
              documents.map((doc) => <DocumentItem key={doc.id} doc={doc} />)
            )}
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
