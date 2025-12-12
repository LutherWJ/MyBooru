import {defineStore} from 'pinia'

const MAX_BUFFER_SIZE = 1024 * 1024 * 5; // 5mb
const CHUNK_SIZE = 1024 * 1024; // 1mb

const useUploadStore = defineStore('uploads', {
    state: () => ({
        mediaList: [] as Blob[],
        mediaTagList: [] as string[],
        selectedMedia: 0,
        uploadProgress: 0
    }),

    getters: {
        bufferSize: (state) => state.mediaList.reduce((acc, cur) => acc + cur.byteLength, 0),
    },

    actions: {
        queueMedia(media: Blob) {
            this.mediaList.push(media);
            if (this.bufferSize > MAX_BUFFER_SIZE) {
                // TODO: create temp files and upload them in chunks
                console.warn('Buffer size exceeded, not uploading yet');
            }
        },
        clearQueue() {
            this.mediaList = [];
        },
        unqueueMedia(index: number) {
            if (index < 0 || index >= this.mediaList.length) return;
            if (this.selectedMedia === index) this.selectedMedia = 0;
            this.mediaList.splice(index, 1);
        },
        setSelectedMedia(index: number) {
            if (index < 0 || index >= this.mediaList.length) return;
            this.selectedMedia = index;
        },
        uploadMedia() {
            const uploadSize = this.mediaList[this.selectedMedia].size;
            const chunkCount = Math.ceil(uploadSize / CHUNK_SIZE);
            try {
                for (let i = 0; i < chunkCount; i++) {
                    await uploadChunk(); // doesn't exist
                    this.uploadProgress = Math.ceil(i / chunkCount);
                }
                finalizeUpload(this.mediaTagList[this.selectedMedia]); // doesn't exist
                this.uploadProgress = 0;
            } catch {
                console.error('Failed to perform upload')
            }
        },
    }
})

export default useUploadStore;