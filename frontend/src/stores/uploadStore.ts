import {defineStore} from 'pinia'
import {StartUpload, FinalizeUpload, UploadChunk} from "../../wailsjs/go/app/App";

const MAX_BUFFER_SIZE = 1024 * 1024 * 5; // 5mb
const CHUNK_SIZE = 1024 * 1024; // 1mb

const useUploadStore = defineStore('uploads', {
    state: () => ({
        mediaList: [] as Blob[],
        mediaTagList: [] as string[],
        selectedIndex: 0,
        uploadProgress: 0
    }),

    getters: {
        bufferSize: state => state.mediaList.reduce((acc, cur) => acc + cur.size, 0),
        selectedMedia: state =>  state.mediaList[state.selectedIndex],
        selectedTagBox: state => state.mediaTagList[state.selectedIndex]
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
            if (this.selectedIndex === index) this.selectedIndex = 0;
            this.mediaList.splice(index, 1);
        },
        setselectedIndex(index: number) {
            if (index < 0 || index >= this.mediaList.length) return;
            this.selectedIndex = index;
        },
        async uploadMedia() {
            const upload = this.mediaList[this.selectedIndex];
            const uploadSize = upload.size;
            const chunkCount = Math.ceil(uploadSize / CHUNK_SIZE);

            try {
                const sessionID = await StartUpload(upload.size);

                for (let i = 0; i < chunkCount; i++) {
                    const chunkStart = i * CHUNK_SIZE;
                    const chunkEnd = Math.min((i + 1) * CHUNK_SIZE, uploadSize);
                    const chunk = upload.slice(chunkStart, chunkEnd);

                    const arrayBuffer = await chunk.arrayBuffer();
                    const uint8Array = new Uint8Array(arrayBuffer);

                    await UploadChunk(sessionID, Array.from(uint8Array));
                    this.uploadProgress = Math.round(((i + 1) / chunkCount) * 100);
                }

                const tagString = this.mediaTagList[this.selectedIndex] || '';
                const mediaID = await FinalizeUpload(sessionID, tagString);
                this.uploadProgress = 0;
                return mediaID;
            } catch (error) {
                this.uploadProgress = 0;
                throw error;
            }
        },
    }
})

export default useUploadStore;