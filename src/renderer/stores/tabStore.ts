import {defineStore} from "pinia";
import type {Tab, TabType} from "../types.ts";
import useGalleryStore from "./galleryStore.ts";

const useTabStore = defineStore('tabs', {
    state: () => ({
        tabs: [] as Tab[],
        activeTabIndex: 0,
        activeTabID: ''
    }),

    getters: {
        getActiveTab: (state) => state.tabs[state.activeTabIndex],
    },

    actions: {
        addTab(tabType: TabType) {
            let tabState;
            switch (tabType) {
                case 'gallery': {
                    tabState = useGalleryStore();
                    break;
                }
                case 'upload': {
                    console.warn('Not implemented yet');
                    return
                }
            }
            const tab: Tab = {
                id: Date.now(),
                title: 'New Tab',
                type: tabType,
                isDirty: false,
                state: tabState
            }
            this.tabs.push(tab);
            this.activeTabIndex = this.tabs.length - 1;
        }
    }
});

export default useTabStore;
