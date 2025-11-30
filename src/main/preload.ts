import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  // Media operations
  media: {
    getAll: () => ipcRenderer.invoke('media:getAll'),
    getById: (id: number) => ipcRenderer.invoke('media:getById', id),
    search: (query: string) => ipcRenderer.invoke('media:search', query),
    toggleFavorite: (id: number) => ipcRenderer.invoke('media:toggleFavorite', id),
    delete: (id: number) => ipcRenderer.invoke('media:delete', id),
  },

  // Tag operations
  tags: {
    getForMedia: (mediaId: number) => ipcRenderer.invoke('tags:getForMedia', mediaId),
    addToMedia: (mediaId: number, tagNames: string[]) => ipcRenderer.invoke('tags:addToMedia', mediaId, tagNames),
    removeFromMedia: (mediaId: number, tagId: number) => ipcRenderer.invoke('tags:removeFromMedia', mediaId, tagId),
    search: (pattern: string) => ipcRenderer.invoke('tags:search', pattern),
  },

  // Upload operations
  upload: {
    selectFiles: () => ipcRenderer.invoke('upload:selectFiles'),
    uploadFiles: (filePaths: string[]) => ipcRenderer.invoke('upload:uploadFiles', filePaths),
  },

  // File operations
  file: {
    getThumbnailPath: (mediaId: number) => ipcRenderer.invoke('file:getThumbnailPath', mediaId),
    getMediaPath: (mediaId: number) => ipcRenderer.invoke('file:getMediaPath', mediaId),
  },

  // Listen for upload progress
  onUploadProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('upload:progress', (_event, progress) => callback(progress));
  },

  // Remove upload progress listener
  removeUploadProgressListener: () => {
    ipcRenderer.removeAllListeners('upload:progress');
  },
});
