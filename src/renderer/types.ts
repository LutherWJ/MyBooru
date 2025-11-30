export type TabType = 'gallery' | 'upload';

export interface Tab {
    id: number
    title: string
    type: TabType
    isDirty: boolean
    state: any
}

export interface UploadProgress {
  current: number;
  total: number;
  fileName: string;
}

// Extend window with our API
declare global {
  interface Window {
    api: {
      media: {
        getAll: () => Promise<Result<Media[]>>;
        getById: (id: number) => Promise<Result<Media>>;
        search: (query: string) => Promise<Result<Media[]>>;
        toggleFavorite: (id: number) => Promise<Result<Media>>;
        delete: (id: number) => Promise<Result<void>>;
      };
      tags: {
        getForMedia: (mediaId: number) => Promise<Result<Tag[]>>;
        addToMedia: (mediaId: number, tagNames: string[]) => Promise<Result<void>>;
        removeFromMedia: (mediaId: number, tagId: number) => Promise<Result<void>>;
        search: (pattern: string) => Promise<Result<Tag[]>>;
      };
      upload: {
        selectFiles: () => Promise<Result<string[]>>;
        uploadFiles: (filePaths: string[]) => Promise<Result<Result<Media>[]>>;
      };
      file: {
        getThumbnailPath: (mediaId: number) => Promise<Result<string>>;
        getMediaPath: (mediaId: number) => Promise<Result<string>>;
      };
      onUploadProgress: (callback: (progress: UploadProgress) => void) => void;
      removeUploadProgressListener: () => void;
    };
  }
}
