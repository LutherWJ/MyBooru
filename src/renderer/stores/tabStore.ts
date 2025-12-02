import {defineStore} from "pinia";
import type {Tab, TabType} from "../types.ts";
import useGalleryStore from "./galleryStore.ts";

const useTabStore = defineStore('tabs', {
    state: () => ({
        tabs: [] as Tab[],
        activeTabID: 0
    }),

    getters: {
        activeTab: (state) => state.tabs.find(t => t.id === state.activeTabID)!,
        activeTabIndex: (state) => state.tabs.findIndex(t => t.id === state.activeTabID),
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
            this.activeTabID = tab.id;
        },

        setActiveTab(tabID: number) {
            if (this.tabs.some(t => t.id === tabID)) {
                this.activeTabID = tabID;
            }
        },

        invalidateGalleryTabs() {
            for (const tab of this.tabs) {
                if (tab.type === 'gallery') {
                    tab.isDirty = true;
                }
            }
        },

        removeTab(tabID: number) {
            const index = this.tabs.findIndex(t => t.id === tabID);
            if (index === -1) return;

            // If removing the last tab, create a new gallery tab first
            if (this.tabs.length === 1) {
                this.addTab('gallery');
            }

            this.tabs.splice(index, 1);

            // Switch to another tab if we closed the active one
            if (this.activeTabID === tabID) {
                this.activeTabID = this.tabs[this.tabs.length - 1]!.id;
            }
        }
    }
});

export default useTabStore;
