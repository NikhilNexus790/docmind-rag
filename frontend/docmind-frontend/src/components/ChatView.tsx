import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Loader2,
  ChevronDown,
  ChevronUp,
  FileText,
  Zap,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { chatApi } from '../services/api';
import { useApp } from '../context/AppContext';
import type { Message, CitationDto } from '../types';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

// Prompt templates matching the screenshots feature
const PROMPT_TEMPLATES = [
  {
    category: 'Summarization',
    icon: '📋',
    color: 'from-indigo-500/20 to-purple-500/20 border-indigo-500/30',
    templates: [
      { label: 'Executive Summary', prompt: 'Provide a concise executive summary of the key points in this document.' },
      { label: 'Key Findings', prompt: 'What are the key findings and conclusions from this document?' },
      { label: 'Action Items', prompt: 'List all action items, tasks, and next steps mentioned in this document.' },
    ],
  },
  {
    category: 'Legal & Compliance',
    icon: '⚖️',
    color: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30',
    templates: [
      { label: 'Key Clauses', prompt: 'What are the most important clauses in this document?' },
      { label: 'Obligations', prompt: 'What are the obligations and responsibilities mentioned in this document?' },
      { label: 'Risk Analysis', prompt: 'Identify potential risks and liabilities mentioned in this document.' },
    ],
  },
  {
    category: 'Analysis',
    icon: '🔍',
    color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30',
    templates: [
      { label: 'Data Points', prompt: 'Extract all key data points, statistics, and metrics from this document.' },
      { label: 'Definitions', prompt: 'What are the key terms and definitions used in this document?' },
      { label: 'Timeline', prompt: 'Create a chronological timeline of all events and dates mentioned.' },
    ],
  },
];

const CitationCard: React.FC<{ citation: CitationDto; index: number }> = ({ citation, index }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border border-[#334155] rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-2.5 hover:bg-[#1e293b] transition-colors text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex-shrink-0 w-5 h-5 bg-indigo-500/20 text-indigo-400 rounded text-xs flex items-center justify-center font-bold">
            {index + 1}
          </span>
          <p className="text-xs text-slate-300 truncate">{citation.fileName}</p>
          {citation.pageNumber && (
            <span className="text-xs text-slate-500 flex-shrink-0">p.{citation.pageNumber}</span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <span className="text-xs text-indigo-400 font-medium">
            {(citation.similarityScore * 100).toFixed(0)}%
          </span>
          {expanded ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
        </div>
      </button>
      {expanded && (
        <div className="px-2.5 pb-2.5 pt-0 border-t border-[#334155]">
          <p className="text-xs text-slate-400 leading-relaxed mt-2">{citation.snippet}</p>
        </div>
      )}
    </div>
  );
};

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.role === 'user';
  const [showCitations, setShowCitations] = useState(false);

  const renderContent = (content: string) => {
    // Basic markdown rendering
    const lines = content.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('### ')) return <h3 key={i} className="text-base font-semibold text-white mt-3 mb-1">{line.slice(4)}</h3>;
      if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-semibold text-white mt-3 mb-1">{line.slice(3)}</h2>;
      if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold text-white mt-3 mb-1">{line.slice(2)}</h1>;
      if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 text-slate-200 list-disc">{renderInline(line.slice(2))}</li>;
      if (line.match(/^\d+\. /)) return <li key={i} className="ml-4 text-slate-200 list-decimal">{renderInline(line.replace(/^\d+\. /, ''))}</li>;
      if (line === '') return <div key={i} className="h-2" />;
      return <p key={i} className="text-slate-200 leading-relaxed">{renderInline(line)}</p>;
    });
  };

  const renderInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
      if (part.startsWith('`') && part.endsWith('`')) return <code key={i} className="px-1.5 py-0.5 bg-[#0f172a] text-indigo-300 rounded text-sm font-mono">{part.slice(1, -1)}</code>;
      return part;
    });
  };

  return (
    <div className={clsx('flex gap-3 animate-fade-in', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div
        className={clsx(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser ? 'bg-indigo-600' : 'bg-gradient-to-br from-indigo-500 to-purple-600'
        )}
      >
        {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
      </div>

      {/* Bubble */}
      <div className={clsx('max-w-[80%] min-w-0', isUser ? 'items-end' : 'items-start')}>
        <div
          className={clsx(
            'rounded-2xl px-4 py-3',
            isUser
              ? 'bg-indigo-600 text-white rounded-tr-sm'
              : 'bg-[#1e293b] border border-[#334155] rounded-tl-sm'
          )}
        >
          <div className="text-sm space-y-1">
            {renderContent(message.content)}
          </div>
        </div>

        {/* Citations & metadata */}
        {!isUser && message.citations && message.citations.length > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setShowCitations(!showCitations)}
              className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <FileText className="w-3 h-3" />
              {message.citations.length} source{message.citations.length > 1 ? 's' : ''}
              {showCitations ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {showCitations && (
              <div className="mt-2 space-y-1.5 animate-fade-in">
                {message.citations.map((c, i) => (
                  <CitationCard key={i} citation={c} index={i} />
                ))}
              </div>
            )}
          </div>
        )}

        {!isUser && message.responseTimeMs && (
          <div className="flex items-center gap-1 mt-1.5">
            <Zap className="w-3 h-3 text-slate-500" />
            <span className="text-xs text-slate-500">{message.responseTimeMs}ms</span>
          </div>
        )}
      </div>
    </div>
  );
};

const TypingIndicator = () => (
  <div className="flex gap-3 animate-fade-in">
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
      <Bot className="w-4 h-4 text-white" />
    </div>
    <div className="bg-[#1e293b] border border-[#334155] rounded-2xl rounded-tl-sm px-4 py-3">
      <div className="flex items-center gap-1 h-4">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
    </div>
  </div>
);

const ChatView: React.FC = () => {
  const { selectedDocumentId, documents } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [showTemplates, setShowTemplates] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const selectedDoc = documents.find((d) => d.id === selectedDocumentId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = async (question: string) => {
    if (!question.trim() || isLoading) return;
    setShowTemplates(false);

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await chatApi.query({
        question: question.trim(),
        documentId: selectedDocumentId ?? undefined,
        topK: 5,
        conversationId,
      });
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: res.data.answer,
        citations: res.data.citations,
        responseTimeMs: res.data.responseTimeMs,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      if (res.data.conversationId) setConversationId(res.data.conversationId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      toast.error(msg);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `❌ Error: ${msg}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setConversationId(undefined);
    setShowTemplates(true);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#334155] flex-shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-medium text-white">
            {selectedDoc ? `Chatting with: ${selectedDoc.filename}` : 'Chat with all documents'}
          </span>
          {selectedDoc && (
            <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/30">
              Focused
            </span>
          )}
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            New chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Welcome + templates */}
        {messages.length === 0 && showTemplates && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">DocMind AI Assistant</h2>
              <p className="text-slate-400 text-sm max-w-md mx-auto">
                {selectedDoc
                  ? `Ask questions about "${selectedDoc.filename}" or use a template below`
                  : 'Select a document or ask questions across all your uploaded documents'}
              </p>
            </div>

            {/* Template categories */}
            <div className="space-y-4 max-w-2xl mx-auto">
              {PROMPT_TEMPLATES.map((category) => (
                <div key={category.category} className={clsx('rounded-xl border bg-gradient-to-br p-4', category.color)}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">{category.icon}</span>
                    <h3 className="text-sm font-semibold text-white">{category.category}</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {category.templates.map((t) => (
                      <button
                        key={t.label}
                        onClick={() => sendMessage(t.prompt)}
                        className="text-left p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-xs text-slate-200 hover:text-white"
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isLoading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="px-6 py-4 border-t border-[#334155] flex-shrink-0">
        <div className="flex gap-3 items-end bg-[#1e293b] border border-[#334155] rounded-2xl px-4 py-3 focus-within:border-indigo-500/50 transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedDoc
                ? `Ask about "${selectedDoc.filename}"...`
                : 'Ask a question about your documents...'
            }
            rows={1}
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-400 resize-none outline-none max-h-36 leading-relaxed"
            style={{ minHeight: '24px' }}
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = 'auto';
              t.style.height = `${Math.min(t.scrollHeight, 144)}px`;
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2 text-center">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

export default ChatView;
