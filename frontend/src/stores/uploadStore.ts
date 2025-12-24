import {defineStore} from 'pinia'
import {useAPI} from "@/composables/useAPI.ts";

const CHUNK_SIZE = 1024 * 1024 * 4; // 4mb

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
            if (this.bufferSize > CHUNK_SIZE) {
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
            const api = useAPI();

            try {
                const sessionID = await api.startUpload(upload.size);

                for (let i = 0; i < chunkCount; i++) {
                    const chunkStart = i * CHUNK_SIZE;
                    const chunkEnd = Math.min((i + 1) * CHUNK_SIZE, uploadSize);
                    const chunk = upload.slice(chunkStart, chunkEnd);

                    const arrayBuffer = await chunk.arrayBuffer();
                    const data = new Uint8Array(arrayBuffer);

                    await api.uploadChunk(sessionID, data);
                    this.uploadProgress = Math.round(((i + 1) / chunkCount) * 100);
               }

                const tagString = this.mediaTagList[this.selectedIndex] || '';
                const mediaID = await api.finalizeUpload(sessionID, tagString);

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