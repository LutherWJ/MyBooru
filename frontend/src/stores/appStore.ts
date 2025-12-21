import { defineStore } from 'pinia';
import { GetSettings } from '../../wailsjs/go/app/App';
import { app } from '../../wailsjs/go/models';

export const useAppStore = defineStore('app', {
  state: () => ({
    config: null as app.AppConfig | null,
    separator: '/' as string
  }),
  actions: {
    async init() {
      try {
        this.config = await GetSettings();
        if (this.config.ThumbnailDir.includes('\\')) {
            this.separator = '\\';
        }
      } catch (e) {
        console.error("Failed to load app settings", e);
      }
    },
    getThumbnailPath(md5: string): string {
      if (!this.config || !md5 || md5.length < 2) return '';
      const prefix = md5.substring(0, 2);
      return `${this.config.ThumbnailDir}${this.separator}${prefix}${this.separator}${md5}.jpg`;
    }
  }
});
