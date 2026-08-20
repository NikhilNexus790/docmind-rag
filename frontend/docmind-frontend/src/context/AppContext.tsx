import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { DocumentMetadataDto } from '../types';
import { documentApi } from '../services/api';
import toast from 'react-hot-toast';

interface AppContextType {
  documents: DocumentMetadataDto[];
  selectedDocumentId: string | null;
  setSelectedDocumentId: (id: string | null) => void;
  fetchDocuments: () => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  isLoadingDocuments: boolean;
  activeTab: 'chat' | 'search' | 'chunks';
  setActiveTab: (tab: 'chat' | 'search' | 'chunks') => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (v: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [documents, setDocuments] = useState<DocumentMetadataDto[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'search' | 'chunks'>('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const fetchDocuments = useCallback(async () => {
    setIsLoadingDocuments(true);
    try {
      const resp = await documentApi.getAll();
      if (resp.success) setDocuments(resp.data);
    } catch (err) {
      console.error('Failed to fetch documents', err);
    } finally {
      setIsLoadingDocuments(false);
    }
  }, []);

  const deleteDocument = useCallback(async (id: string) => {
    try {
      await documentApi.delete(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      if (selectedDocumentId === id) setSelectedDocumentId(null);
      toast.success('Document deleted successfully');
    } catch {
      toast.error('Failed to delete document');
    }
  }, [selectedDocumentId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return (
    <AppContext.Provider
      value={{
        documents,
        selectedDocumentId,
        setSelectedDocumentId,
        fetchDocuments,
        deleteDocument,
        isLoadingDocuments,
        activeTab,
        setActiveTab,
        isSidebarOpen,
        setIsSidebarOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};
