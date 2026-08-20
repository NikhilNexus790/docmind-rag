import React, { useState } from 'react';
import {
  Search,
  Loader2,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Filter,
  Layers,
} from 'lucide-react';
import { chatApi } from '../services/api';
import { useApp } from '../context/AppContext';
import type { CitationDto, SearchResultDto } from '../types';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

const SEARCH_TYPES = [
  { label: 'All Concepts', icon: '🔍', placeholder: 'Search for any concept or topic...' },
  { label: 'Clauses', icon: '📜', placeholder: 'Search for specific clauses...' },
  { label: 'Facts & Figures', icon: '📊', placeholder: 'Search for facts and data points...' },
  { label: 'Definitions', icon: '📚', placeholder: 'Search for term definitions...' },
];

const ResultCard: React.FC<{ match: CitationDto; index: number }> = ({ match, index }) => {
  const [expanded, setExpanded] = useState(false);
  const score = (match.similarityScore * 100).toFixed(1);
  const scoreNum = parseFloat(score);

  return (
    <div className="border border-[#334155] rounded-xl overflow-hidden bg-[#1e293b] hover:border-[#475569] transition-colors animate-fade-in">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex-shrink-0 w-6 h-6 bg-indigo-500/20 text-indigo-400 rounded-full text-xs flex items-center justify-center font-bold">
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{match.fileName}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {match.pageNumber && (
                  <span className="text-xs text-slate-400">Page {match.pageNumber}</span>
                )}
                <span className="text-xs text-slate-400">Chunk #{match.chunkIndex}</span>
              </div>
            </div>
          </div>

          {/* Similarity badge */}
          <div className="flex-shrink-0 text-center">
            <div
              className={clsx(
                'px-2.5 py-1 rounded-lg text-xs font-bold',
                scoreNum >= 80
                  ? 'bg-green-500/20 text-green-400'
                  : scoreNum >= 60
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-red-500/20 text-red-400'
              )}
            >
              {score}%
            </div>
            <p className="text-xs text-slate-500 mt-0.5">match</p>
          </div>
        </div>

        {/* Similarity bar */}
        <div className="w-full bg-[#0f172a] rounded-full h-1 mb-3">
          <div
            className={clsx(
              'h-1 rounded-full transition-all',
              scoreNum >= 80 ? 'bg-green-500' : scoreNum >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            )}
            style={{ width: `${scoreNum}%` }}
          />
        </div>

        {/* Snippet */}
        <p className={clsx('text-sm text-slate-300 leading-relaxed', !expanded && 'line-clamp-3')}>
          {match.snippet}
        </p>

        {match.snippet.length > 200 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 mt-2 transition-colors"
          >
            {expanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Show more</>}
          </button>
        )}

        {/* Metadata tags */}
        {match.metadata && Object.keys(match.metadata).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {Object.entries(match.metadata).slice(0, 4).map(([k, v]) => (
              <span key={k} className="text-xs bg-[#0f172a] text-slate-400 px-2 py-0.5 rounded-full">
                {k}: {String(v)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const SearchView: React.FC = () => {
  const { selectedDocumentId, documents } = useApp();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResultDto | null>(null);
  const [topK, setTopK] = useState(10);
  const [minSimilarity, setMinSimilarity] = useState(0.5);
  const [selectedType, setSelectedType] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const selectedDoc = documents.find((d) => d.id === selectedDocumentId);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const res = await chatApi.searchSimilarity({
        query: query.trim(),
        documentId: selectedDocumentId ?? undefined,
        topK,
        similaritySearch: minSimilarity,
      });
      setResults(res.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Search failed';
      toast.error(msg);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  const EXAMPLE_QUERIES = ['payment terms', 'termination clause', 'liability cap', 'force majeure', 'intellectual property'];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search header */}
      <div className="px-6 py-4 border-b border-[#334155] flex-shrink-0">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-semibold text-white">Semantic Search</h2>
          {selectedDoc && (
            <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/30">
              {selectedDoc.filename}
            </span>
          )}
        </div>

        {/* Search type tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {SEARCH_TYPES.map((type, i) => (
            <button
              key={i}
              onClick={() => setSelectedType(i)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
                selectedType === i
                  ? 'bg-indigo-600 text-white'
                  : 'bg-[#1e293b] border border-[#334155] text-slate-400 hover:text-white'
              )}
            >
              <span>{type.icon}</span>
              {type.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-[#1e293b] border border-[#334155] rounded-xl px-4 py-2.5 focus-within:border-indigo-500/50 transition-colors">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={SEARCH_TYPES[selectedType].placeholder}
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-400 outline-none"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={clsx(
              'p-2.5 rounded-xl border transition-colors',
              showFilters
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'bg-[#1e293b] border-[#334155] text-slate-400 hover:text-white'
            )}
          >
            <Filter className="w-4 h-4" />
          </button>
          <button
            onClick={handleSearch}
            disabled={!query.trim() || isSearching}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition-colors"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Search
          </button>
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <div className="mt-3 p-3 bg-[#0f172a] rounded-xl border border-[#334155] animate-fade-in">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Top Results: {topK}</label>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={topK}
                  onChange={(e) => setTopK(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Min Similarity: {(minSimilarity * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={minSimilarity}
                  onChange={(e) => setMinSimilarity(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Example queries */}
        {!results && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-xs text-slate-500">Try:</span>
            {EXAMPLE_QUERIES.map((q) => (
              <button
                key={q}
                onClick={() => { setQuery(q); }}
                className="text-xs bg-[#1e293b] border border-[#334155] text-slate-400 hover:text-indigo-400 hover:border-indigo-500/40 px-2 py-0.5 rounded-full transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-6">
        {!results && !isSearching && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Search className="w-12 h-12 text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-slate-300 mb-2">Search your documents</h3>
            <p className="text-sm text-slate-500 max-w-sm">
              Use semantic search to find clauses, concepts, facts, and definitions across your documents
            </p>
          </div>
        )}

        {isSearching && (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-4" />
            <p className="text-slate-400">Searching through document vectors...</p>
          </div>
        )}

        {results && !isSearching && (
          <div>
            {/* Results summary */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span className="text-sm text-white font-medium">
                  {results.totalMatches} result{results.totalMatches !== 1 ? 's' : ''} for
                </span>
                <span className="text-sm text-indigo-400">"{results.query}"</span>
              </div>
              {results.totalMatches === 0 && (
                <div className="flex items-center gap-1.5 text-yellow-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-xs">No matches found</span>
                </div>
              )}
            </div>

            {results.totalMatches === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No matching chunks found</p>
                <p className="text-sm text-slate-500 mt-1">Try a different query or reduce the similarity threshold</p>
              </div>
            ) : (
              <div className="space-y-3">
                {results.matches.map((match, i) => (
                  <ResultCard key={i} match={match} index={i} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchView;
