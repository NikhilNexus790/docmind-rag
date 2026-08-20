import axios from 'axios';
import type {
  ApiResponse,
  ChatRequestDto,
  ChatResponseDto,
  DocumentMetadataDto,
  DocumentResponseDto,
  SearchRequestDto,
  SearchResultDto,
} from '../types';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Document APIs
export const documentApi = {
  upload: async (file: File, onProgress?: (pct: number) => void): Promise<ApiResponse<DocumentResponseDto>> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post<ApiResponse<DocumentResponseDto>>('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (e.total && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      },
    });
    return data;
  },

  uploadMultiple: async (files: File[], onProgress?: (pct: number) => void): Promise<ApiResponse<DocumentResponseDto[]>> => {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    const { data } = await api.post<ApiResponse<DocumentResponseDto[]>>('/documents/upload-multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (e.total && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      },
    });
    return data;
  },

  getAll: async (): Promise<ApiResponse<DocumentMetadataDto[]>> => {
    const { data } = await api.get<ApiResponse<DocumentMetadataDto[]>>('/documents');
    return data;
  },

  getById: async (id: string): Promise<ApiResponse<DocumentMetadataDto>> => {
    const { data } = await api.get<ApiResponse<DocumentMetadataDto>>(`/documents/${id}`);
    return data;
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    const { data } = await api.delete<ApiResponse<void>>(`/documents/${id}`);
    return data;
  },
};

// Chat APIs
export const chatApi = {
  query: async (request: ChatRequestDto): Promise<ApiResponse<ChatResponseDto>> => {
    const { data } = await api.post<ApiResponse<ChatResponseDto>>('/chat/query', request);
    return data;
  },

  searchSimilarity: async (request: SearchRequestDto): Promise<ApiResponse<SearchResultDto>> => {
    const { data } = await api.post<ApiResponse<SearchResultDto>>('/chat/search/similarity', request);
    return data;
  },
};

export default api;
