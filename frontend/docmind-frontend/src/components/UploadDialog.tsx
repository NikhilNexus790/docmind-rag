import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, Upload, FileText, CheckCircle, AlertCircle, Loader2, Plus } from 'lucide-react';
import { documentApi } from '../services/api';
import { useApp } from '../context/AppContext';
import type { UploadingFile } from '../types';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

interface UploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ACCEPTED_TYPES: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
  'text/markdown': ['.md'],
  'text/csv': ['.csv'],
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const UploadDialog: React.FC<UploadDialogProps> = ({ isOpen, onClose }) => {
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { fetchDocuments } = useApp();

  const onDrop = useCallback((accepted: File[]) => {
    const newFiles: UploadingFile[] = accepted.map((f) => ({
      id: crypto.randomUUID(),
      file: f,
      progress: 0,
      status: 'pending',
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    multiple: true,
  });

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setIsUploading(true);

    // Upload each file individually to track progress per file
    const pending = files.filter((f) => f.status === 'pending');

    await Promise.all(
      pending.map(async (uf) => {
        setFiles((prev) =>
          prev.map((f) => (f.id === uf.id ? { ...f, status: 'uploading' } : f))
        );
        try {
          const res = await documentApi.upload(uf.file, (pct) => {
            setFiles((prev) =>
              prev.map((f) => (f.id === uf.id ? { ...f, progress: pct } : f))
            );
          });
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uf.id
                ? { ...f, status: 'done', progress: 100, result: res.data }
                : f
            )
          );
        } catch (err: unknown) {
          const msg =
            err instanceof Error ? err.message : 'Upload failed';
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uf.id ? { ...f, status: 'error', error: msg } : f
            )
          );
        }
      })
    );

    setIsUploading(false);
    await fetchDocuments();
    const successCount = files.filter((f) => f.status === 'done').length;
    if (successCount > 0) toast.success(`${successCount} document(s) uploaded`);
  };

  const handleClose = () => {
    if (!isUploading) {
      setFiles([]);
      onClose();
    }
  };

  const allDone = files.length > 0 && files.every((f) => f.status === 'done' || f.status === 'error');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-xl mx-4 bg-[#1e293b] border border-[#334155] rounded-2xl shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#334155]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <Upload className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Upload Documents</h2>
              <p className="text-xs text-slate-400">PDF, DOCX, TXT, MD, CSV supported</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="p-2 hover:bg-[#334155] rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Dropzone */}
        <div className="p-6">
          <div
            {...getRootProps()}
            className={clsx(
              'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200',
              isDragActive
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'border-[#334155] hover:border-indigo-500/50 hover:bg-indigo-500/5'
            )}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-3">
              <div className={clsx(
                'p-4 rounded-full transition-colors',
                isDragActive ? 'bg-indigo-500/20' : 'bg-[#334155]'
              )}>
                <Upload className={clsx('w-8 h-8', isDragActive ? 'text-indigo-400' : 'text-slate-400')} />
              </div>
              <div>
                <p className="text-white font-medium">
                  {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
                </p>
                <p className="text-slate-400 text-sm mt-1">
                  or{' '}
                  <span className="text-indigo-400 hover:underline">browse to upload</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {['PDF', 'DOCX', 'TXT', 'MD', 'CSV'].map((ext) => (
                  <span key={ext} className="px-2 py-0.5 text-xs bg-[#334155] text-slate-300 rounded-full">
                    {ext}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="mt-4 space-y-2 max-h-64 overflow-y-auto pr-1">
              {files.map((uf) => (
                <div key={uf.id} className="flex items-center gap-3 p-3 bg-[#0f172a] rounded-lg">
                  <div className="p-2 bg-[#334155] rounded-lg flex-shrink-0">
                    <FileText className="w-4 h-4 text-slate-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm text-white truncate max-w-[220px]">{uf.file.name}</p>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span className="text-xs text-slate-400">{formatBytes(uf.file.size)}</span>
                        {uf.status === 'pending' && (
                          <button onClick={() => removeFile(uf.id)} className="text-slate-400 hover:text-red-400">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {uf.status === 'uploading' && <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />}
                        {uf.status === 'done' && <CheckCircle className="w-4 h-4 text-green-400" />}
                        {uf.status === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
                      </div>
                    </div>
                    {/* Progress bar */}
                    {(uf.status === 'uploading' || uf.status === 'done') && (
                      <div className="w-full bg-[#334155] rounded-full h-1.5">
                        <div
                          className={clsx(
                            'h-1.5 rounded-full transition-all duration-300',
                            uf.status === 'done' ? 'bg-green-500' : 'bg-indigo-500'
                          )}
                          style={{ width: `${uf.progress}%` }}
                        />
                      </div>
                    )}
                    {uf.status === 'error' && (
                      <p className="text-xs text-red-400 mt-0.5">{uf.error}</p>
                    )}
                    {uf.status === 'done' && uf.result && (
                      <p className="text-xs text-green-400 mt-0.5">
                        {uf.result.chunksCreated ?? 0} chunks indexed
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-[#334155]">
          <button
            onClick={() => setFiles([])}
            disabled={isUploading || files.length === 0}
            className="text-sm text-slate-400 hover:text-white disabled:opacity-40 transition-colors"
          >
            Clear all
          </button>
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={isUploading}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white border border-[#334155] hover:border-[#475569] rounded-lg transition-colors disabled:opacity-50"
            >
              {allDone ? 'Close' : 'Cancel'}
            </button>
            {!allDone && (
              <button
                onClick={handleUpload}
                disabled={isUploading || files.filter((f) => f.status === 'pending').length === 0}
                className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Upload {files.filter((f) => f.status === 'pending').length} file(s)
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadDialog;
