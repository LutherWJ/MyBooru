import useGallery from "./composables/useGallery.ts";
import useUploadStore from "./stores/uploadStore.ts";

export type UseGallery = ReturnType<typeof useGallery>;
export type UseUpload = ReturnType<typeof useUploadStore>

export type TabType = 'Gallery' | 'Upload';

export type TabState = UseGallery | UseUpload;

export interface Tab {
    id: number
    title: string
    type: TabType
    isDirty: boolean
    state: TabState
}
