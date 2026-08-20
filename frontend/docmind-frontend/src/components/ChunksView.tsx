import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  Loader2,
  FileText,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Search,
  Hash,
  BookOpen,
} from 'lucide-react';
import { chatApi } from '../services/api';
import { useApp } from '../context/AppContext';
import type { CitationDto } from '../types';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

const ChunkCard: React.FC<{ chunk: CitationDto; index: number }> = ({ chunk, index }) => {
  const [expanded, setExpanded] = useState(false);
  const score = chunk.similarityScore ? (chunk.similarityScore * 100).toFixed(1) : null;

  return (
    <div className="border border-[#334155] rounded-xl bg-[#1e293b] overflow-hidden hover:border-[#475569] transition-colors animate-fade-in">
      <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3 min-w-0">
          {/* Chunk number badge */}
          <div className="flex-shrink-0 w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
            <span className="text-xs font-bold text-indigo-400">#{chunk.chunkIndex}</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-white truncate">{chunk.fileName}</p>
              {chunk.pageNumber && (
                <span className="text-xs bg-[#334155] text-slate-300 px-1.5 py-0.5 rounded flex-shrink-0">
                  p.{chunk.pageNumber}
                </span>
              )}
            </div>
            <p className={clsx('text-xs text-slate-400 mt-0.5', !expanded && 'truncate max-w-xs')}>
              {chunk.snippet.slice(0, expanded ? undefined : 80)}{!expanded && chunk.snippet.length > 80 ? '...' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          {score && (
            <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">{score}%</span>
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-[#334155]">
          {/* Full text */}
          <div className="bg-[#0f172a] rounded-lg p-3 mt-3 mb-3">
            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{chunk.snippet}</p>
          </div>

          {/* Metadata grid */}
          {chunk.metadata && Object.keys(chunk.metadata).length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                <Hash className="w-3 h-3" />
                Metadata
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(chunk.metadata).map(([k, v]) => (
                  <div key={k} className="bg-[#0f172a] rounded-lg p-2">
                    <p className="text-xs text-slate-500 capitalize">{k.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-slate-200 font-medium mt-0.5 truncate">{String(v)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ChunksView: React.FC = () => {
  const { selectedDocumentId, documents } = useApp();
  const [chunks, setChunks] = useState<CitationDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState('*');
  const [hasLoaded, setHasLoaded] = useState(false);
  const [filter, setFilter] = useState('');

  const selectedDoc = documents.find((d) => d.id === selectedDocumentId);

  const loadChunks = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await chatApi.searchSimilarity({
        query: query || '*',
        documentId: selectedDocumentId ?? undefined,
        topK: 50,
        similaritySearch: 0.0,
      });
      setChunks(res.data.matches);
      setHasLoaded(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load chunks';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDocumentId, query]);

  useEffect(() => {
    // Auto-load when a document is selected
    if (selectedDocumentId) {
      loadChunks();
    } else {
      setChunks([]);
      setHasLoaded(false);
    }
  }, [selectedDocumentId, loadChunks]);

  const filteredChunks = filter
    ? chunks.filter((c) =>
        c.snippet.toLowerCase().includes(filter.toLowerCase()) ||
        c.fileName.toLowerCase().includes(filter.toLowerCase())
      )
    : chunks;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#334155] flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-white">Document Chunks</h2>
            {chunks.length > 0 && (
              <span className="text-xs bg-[#334155] text-slate-300 px-2 py-0.5 rounded-full">
                {filteredChunks.length} / {chunks.length}
              </span>
            )}
          </div>
          <button
            onClick={loadChunks}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white border border-[#334155] hover:border-[#475569] px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={clsx('w-3.5 h-3.5', isLoading && 'animate-spin')} />
            Refresh
          </button>
        </div>

        {/* Search query input */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1 flex items-center gap-2 bg-[#1e293b] border border-[#334155] rounded-xl px-3 py-2 focus-within:border-indigo-500/50 transition-colors">
            <BookOpen className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadChunks()}
              placeholder="Vector search query (or * for all)"
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-400 outline-none"
            />
          </div>
          <button
            onClick={loadChunks}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition-colors"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Load
          </button>
        </div>

        {/* Text filter */}
        {chunks.length > 0 && (
          <div className="flex items-center gap-2 bg-[#1e293b] border border-[#334155] rounded-xl px-3 py-2 focus-within:border-indigo-500/50 transition-colors">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter chunks by text..."
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-400 outline-none"
            />
          </div>
        )}
      </div>

      {/* Chunks list */}
      <div className="flex-1 overflow-y-auto p-6">
        {!hasLoaded && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Layers className="w-12 h-12 text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-slate-300 mb-2">View Document Chunks</h3>
            <p className="text-sm text-slate-500 max-w-sm mb-6">
              {selectedDoc
                ? `View and explore the vector chunks for "${selectedDoc.filename}"`
                : 'Select a document from the sidebar to view its chunks, or click Load to browse all chunks'}
            </p>
            <button
              onClick={loadChunks}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors"
            >
              <Layers className="w-4 h-4" />
              Load Chunks
            </button>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-4" />
            <p className="text-slate-400">Loading document chunks from vector store...</p>
          </div>
        )}

        {hasLoaded && !isLoading && filteredChunks.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <FileText className="w-10 h-10 text-slate-600 mb-3" />
            <p className="text-slate-400">No chunks found</p>
            <p className="text-sm text-slate-500 mt-1">
              {filter ? 'Try a different filter' : 'Upload and index documents to see chunks here'}
            </p>
          </div>
        )}

        {hasLoaded && !isLoading && filteredChunks.length > 0 && (
          <div className="space-y-3">
            {filteredChunks.map((chunk, i) => (
              <ChunkCard key={`${chunk.documentId}-${chunk.chunkIndex}-${i}`} chunk={chunk} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChunksView;
