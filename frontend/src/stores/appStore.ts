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
  }
});
