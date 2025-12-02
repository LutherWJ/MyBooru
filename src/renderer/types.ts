import type {Result, Media, Tag, DatabaseError, FileSystemError} from "../shared/types.ts";

export type TabType = 'gallery' | 'upload';

export interface Tab {
    id: number
    title: string
    type: TabType
    isDirty: boolean
    state: any
}

