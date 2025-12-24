import {useAppStore} from "@/stores/appStore.ts";

export const useAPI = () => {
    const appStore = useAppStore();

    const getBaseUrl = () => {
        if (!appStore.port) throw new Error("Server port not initialized");
        return `http://localhost:${appStore.port}`;
    };

    const startUpload = async (size: number): Promise<string> => {
        try {
            const baseUrl = getBaseUrl();
            const res = await fetch(`${baseUrl}/upload/init`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({totalSize: size})
            });
            
            if (!res.ok) throw new Error(`Init failed: ${res.statusText}`);
            const data = await res.json();
            return data.sessionID;
        } catch (err) {
            console.error("Upload init error:", err);
            throw err;
        }
    };

    const uploadChunk = async (sessionID: string, chunk: Uint8Array) => {
        const baseUrl = getBaseUrl();
        const res = await fetch(`${baseUrl}/upload/chunk?sessionID=${sessionID}`, {
            method: 'POST',
            // @ts-ignore - Fetch body accepts Uint8Array
            body: chunk
        });
        
        if (!res.ok) throw new Error(`Chunk upload failed: ${res.statusText}`);
    };

    const finalizeUpload = async (sessionID: string, tags: string): Promise<number> => {
        const baseUrl = getBaseUrl();
        const res = await fetch(`${baseUrl}/upload/finalize?sessionID=${sessionID}&tags=${tags}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
        });
        
        if (!res.ok) throw new Error(`Finalize failed: ${res.statusText}`);
        const data = await res.json();
        return data.mediaID;
    };

    return {
        startUpload,
        uploadChunk,
        finalizeUpload
    };
};
