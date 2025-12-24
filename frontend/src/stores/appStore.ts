import { defineStore } from 'pinia';
import {GetConfig, UpdateConfig, GetApiPort} from '../../wailsjs/go/app/App';
import {models} from "../../wailsjs/go/models.ts";

export const useAppStore = defineStore('app', {
  state: () => ({
    config: null as models.Config | null,
      port: null as number | null,
  }),
  actions: {
    async init() {
        this.config = await GetConfig();
        this.port = await GetApiPort();
    },
    async updateConfig(config: models.Config) {
        await UpdateConfig(config);
        this.config = await GetConfig();
    },
    getThumbnailUrl(md5: string): string {
        if (!this.port) return "";
        return `http://localhost:${this.port}/thumbnail/${md5}.jpg`;
    },
      getMediaUrl(md5: string, ext: string) {
        if (!this.port) return "";
        return `http://localhost:${this.port}/media/${md5}.${ext}`;
      }
  }
});
