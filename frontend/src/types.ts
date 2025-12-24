import useGallery from "./composables/useGallery.ts";
import useUploadStore from "./stores/uploadStore.ts";
import useMedia from "@/composables/useMedia.ts";

export type UseGallery = ReturnType<typeof useGallery>;
export type UseUpload = ReturnType<typeof useUploadStore>
export type UseMedia = ReturnType<typeof useMedia>

export type TabType = 'Gallery' | 'Upload' | 'Media';

export interface TabBase {
    id: number
    title: string
}

export interface GalleryTab extends TabBase {
    type: 'Gallery';
    state: UseGallery;
}

export interface UploadTab extends TabBase {
    type: 'Upload';
    state: UseUpload;
}

export interface MediaTab extends TabBase {
    type: 'Media';
    state: UseMedia;
}

export type Tab = GalleryTab | UploadTab | MediaTab;
export type TabState = Tab['state'];

export function validateTabType<T extends TabType>(tab: Tab | undefined, type: T): tab is Extract<Tab, { type: T }> {
    return tab !== undefined && tab.type === type;
}
