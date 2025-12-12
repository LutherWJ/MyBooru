import {defineStore} from "pinia";
import type {Tab, TabState, TabType} from "../types.ts";
import useGallery from "../composables/useGallery.ts"
import useUploadStore from "./uploadStore.ts";
import {useRouter} from "vue-router";

const router = useRouter();

const useTabStore = defineStore('tabs', {
    state: () => ({
        tabs: [] as Tab[],
        activeTabID: 0,
        activeComponent: 'Gallery' as TabType
    }),

    getters: {
        activeTab: (state) => state.tabs.find(t => t.id === state.activeTabID)!,
        activeTabIndex: (state) => state.tabs.findIndex(t => t.id === state.activeTabID),
    },

    actions: {
        addTab(tabType: TabType) {
            let tabState: TabState;
            switch (tabType) {
                case 'Gallery': {
                    tabState = useGallery();
                    break;
                }
                case 'Upload': {
                    tabState = useUploadStore();
                    break;
                }
                default: return;
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
            this.activeTabID = tabID;
            const newComp = this.tabs.find(t => t.id === tabID)!.type;
            if (newComp !== this.activeComponent) {
                this.activeComponent = newComp;
                router.push({name: newComp});
            }
        },

        invalidateGalleryTabs() {
            for (const tab of this.tabs) {
                if (tab.type === 'Gallery') {
                    tab.isDirty = true;
                }
            }
        },

        removeTab(tabID: number) {
            const index = this.tabs.findIndex(t => t.id === tabID);
            if (index === -1) return;

            // If removing the last tab, create a new gallery tab first
            if (this.tabs.length === 1) {
                this.addTab('Gallery');
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
