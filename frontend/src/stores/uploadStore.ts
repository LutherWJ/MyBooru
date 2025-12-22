import {defineStore} from 'pinia'
import {useAppStore} from "@/stores/appStore.ts";

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

            try {
                const sessionID = await startUpload(upload.size);

                for (let i = 0; i < chunkCount; i++) {
                    const chunkStart = i * CHUNK_SIZE;
                    const chunkEnd = Math.min((i + 1) * CHUNK_SIZE, uploadSize);
                    const chunk = upload.slice(chunkStart, chunkEnd);

                    const arrayBuffer = await chunk.arrayBuffer();
                    const data = new Uint8Array(arrayBuffer);

                    await uploadChunk(sessionID, data);
                    this.uploadProgress = Math.round(((i + 1) / chunkCount) * 100);
               }

                const tagString = this.mediaTagList[this.selectedIndex] || '';
                const mediaID = await finalizeUpload(sessionID, tagString);

                this.uploadProgress = 0;
                return mediaID;
            } catch (error) {
                this.uploadProgress = 0;
                throw error;
            }
        },
    }
})

const startUpload = async (size: number): Promise<string | null> => {
    try {
        const store = useAppStore();
        const port = store.port;
        const res = await fetch(`http://localhost:${port}/upload/init`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({totalSize: size})
        });
        if (!res.ok) return null
        const data = await res.json();
        return data.sessionID;
    } catch (err) {
        console.error(err);
        return null;
    }
}

const uploadChunk = async (sessionID: string | null, chunk: Uint8Array) => {
    if (sessionID === null) throw new Error('Session does not exist')
    const store = useAppStore();
    const port = store.port;
    const res = await fetch(`http://localhost:${port}/upload/chunk?sessionID=${sessionID}`, {
        method: 'POST',
        // @ts-ignore
        body: chunk
    });
    if (!res.ok) throw new Error('Failed to upload chunk');
}

const finalizeUpload = async (sessionID: string | null, tags: string) => {
    const store = useAppStore();
    const port = store.port;
    if (sessionID === null) throw new Error('Session does not exist')
    const res = await fetch(`http://localhost:${port}/upload/finalize?sessionID=${sessionID}&tags=${tags}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
    });
    if (!res.ok) throw new Error('Failed to finalize upload');
    const data = await res.json();
    return data.mediaID;
}

export default useUploadStore;