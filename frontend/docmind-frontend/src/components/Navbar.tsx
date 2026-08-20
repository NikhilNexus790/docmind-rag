import React, { useState } from 'react';
import {
  Brain,
  MessageSquare,
  Search,
  Layers,
  Upload,
  PanelLeft,
  FileText,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { clsx } from 'clsx';

interface NavbarProps {
  onUploadClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onUploadClick }) => {
  const { activeTab, setActiveTab, isSidebarOpen, setIsSidebarOpen, documents, selectedDocumentId } = useApp();

  const tabs = [
    { id: 'chat' as const, label: 'Chat', icon: MessageSquare },
    { id: 'search' as const, label: 'Search', icon: Search },
    { id: 'chunks' as const, label: 'Chunks', icon: Layers },
  ];

  const selectedDoc = documents.find((d) => d.id === selectedDocumentId);

  return (
    <header className="flex items-center h-14 px-4 bg-[#1e293b] border-b border-[#334155] flex-shrink-0 z-10">
      {/* Left: Logo + sidebar toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 hover:bg-[#334155] rounded-lg transition-colors"
          title="Toggle sidebar"
        >
          <PanelLeft className="w-4 h-4 text-slate-400" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-bold text-white">DocMind</span>
          <span className="text-xs text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-full border border-indigo-500/20 hidden sm:block">
            AI
          </span>
        </div>
      </div>

      {/* Center: Navigation tabs */}
      <nav className="flex-1 flex items-center justify-center gap-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={clsx(
              'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
              activeTab === id
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                : 'text-slate-400 hover:text-white hover:bg-[#334155]'
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:block">{label}</span>
          </button>
        ))}
      </nav>

      {/* Right: Document context + upload */}
      <div className="flex items-center gap-2">
        {selectedDoc && (
          <div className="hidden md:flex items-center gap-1.5 bg-[#0f172a] border border-[#334155] px-3 py-1.5 rounded-lg">
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs text-slate-300 max-w-[150px] truncate">{selectedDoc.filename}</span>
          </div>
        )}
        <button
          onClick={onUploadClick}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Upload className="w-4 h-4" />
          <span className="hidden sm:block">Upload</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
