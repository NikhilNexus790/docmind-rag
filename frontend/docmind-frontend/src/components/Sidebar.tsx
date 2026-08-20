import React, { useState } from 'react';
import {
  FileText,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Upload,
  RefreshCw,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { DocumentMetadataDto, DocumentStatus } from '../types';
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
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const StatusBadge: React.FC<{ status: DocumentStatus }> = ({ status }) => {
  const config: Record<DocumentStatus, { icon: React.ReactNode; color: string; label: string }> = {
    INDEXED: {
      icon: <CheckCircle className="w-3 h-3" />,
      color: 'text-green-400 bg-green-400/10',
      label: 'Indexed',
    },
    PROCESSING: {
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
      color: 'text-yellow-400 bg-yellow-400/10',
      label: 'Processing',
    },
    UPLOADING: {
      icon: <Clock className="w-3 h-3" />,
      color: 'text-blue-400 bg-blue-400/10',
      label: 'Uploading',
    },
    FAILED: {
      icon: <AlertCircle className="w-3 h-3" />,
      color: 'text-red-400 bg-red-400/10',
      label: 'Failed',
    },
  };
  const { icon, color, label } = config[status];
  return (
    <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', color)}>
      {icon}
      {label}
    </span>
  );
};

const DocumentItem: React.FC<{ doc: DocumentMetadataDto }> = ({ doc }) => {
  const { selectedDocumentId, setSelectedDocumentId, deleteDocument } = useApp();
  const [expanded, setExpanded] = useState(false);
  const isSelected = selectedDocumentId === doc.id;

  const getFileIcon = (contentType: string) => {
    if (contentType.includes('pdf')) return '📄';
    if (contentType.includes('word')) return '📝';
    if (contentType.includes('csv')) return '📊';
    return '📃';
  };

  return (
    <div
      className={clsx(
        'rounded-xl border transition-all duration-200 overflow-hidden',
        isSelected
          ? 'border-indigo-500/70 bg-indigo-500/10'
          : 'border-[#334155] bg-[#1e293b] hover:border-[#475569]'
      )}
    >
      <div
        className="flex items-start gap-2.5 p-3 cursor-pointer"
        onClick={() => setSelectedDocumentId(isSelected ? null : doc.id)}
      >
        <span className="text-lg flex-shrink-0 mt-0.5">{getFileIcon(doc.contentType)}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white font-medium truncate" title={doc.filename}>
            {doc.filename}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <StatusBadge status={doc.status} />
            <span className="text-xs text-slate-400">{formatBytes(doc.fileSize)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="p-1 hover:bg-[#334155] rounded-lg transition-colors"
          >
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteDocument(doc.id);
            }}
            className="p-1 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors text-slate-400"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded metadata */}
      {expanded && (
        <div className="px-3 pb-3 pt-0 border-t border-[#334155] mt-0">
          <div className="grid grid-cols-2 gap-2 mt-2">
            {doc.totalChunks !== null && (
              <div className="bg-[#0f172a] rounded-lg p-2">
                <p className="text-xs text-slate-400">Chunks</p>
                <p className="text-sm text-white font-medium">{doc.totalChunks}</p>
              </div>
            )}
            {doc.totalPages !== null && (
              <div className="bg-[#0f172a] rounded-lg p-2">
                <p className="text-xs text-slate-400">Pages</p>
                <p className="text-sm text-white font-medium">{doc.totalPages}</p>
              </div>
            )}
            <div className="bg-[#0f172a] rounded-lg p-2 col-span-2">
              <p className="text-xs text-slate-400">Added</p>
              <p className="text-sm text-white font-medium">{formatDate(doc.createdAt)}</p>
            </div>
          </div>
          {doc.errorMessage && (
            <p className="text-xs text-red-400 mt-2 bg-red-500/10 rounded-lg p-2">{doc.errorMessage}</p>
          )}
        </div>
      )}
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ onUploadClick }) => {
  const { documents, isLoadingDocuments, fetchDocuments, selectedDocumentId, setSelectedDocumentId, isSidebarOpen, setIsSidebarOpen } = useApp();

  return (
    <aside
      className={clsx(
        'flex flex-col h-full bg-[#1e293b] border-r border-[#334155] transition-all duration-300 flex-shrink-0',
        isSidebarOpen ? 'w-72' : 'w-0 overflow-hidden'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#334155] flex-shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-400" />
          <span className="text-sm font-semibold text-white">Documents</span>
          <span className="text-xs bg-[#334155] text-slate-300 px-1.5 py-0.5 rounded-full">
            {documents.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={fetchDocuments}
            className="p-1.5 hover:bg-[#334155] rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className={clsx('w-3.5 h-3.5 text-slate-400', isLoadingDocuments && 'animate-spin')} />
          </button>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 hover:bg-[#334155] rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Upload button */}
      <div className="p-3 border-b border-[#334155] flex-shrink-0">
        <button
          onClick={onUploadClick}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <Upload className="w-4 h-4" />
          Upload Documents
        </button>
      </div>

      {/* Filter chips */}
      {selectedDocumentId && (
        <div className="px-3 pt-2 flex-shrink-0">
          <button
            onClick={() => setSelectedDocumentId(null)}
            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <X className="w-3 h-3" />
            Clear document filter
          </button>
        </div>
      )}

      {/* Document list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoadingDocuments ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <FileText className="w-10 h-10 text-slate-600 mb-3" />
            <p className="text-sm text-slate-400">No documents yet</p>
            <p className="text-xs text-slate-500 mt-1">Upload documents to get started</p>
          </div>
        ) : (
          documents.map((doc) => <DocumentItem key={doc.id} doc={doc} />)
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
