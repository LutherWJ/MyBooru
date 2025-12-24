import {defineStore} from "pinia";
import type {Tab, TabState, TabType} from "@/types.ts";
import useGallery from "@/composables/useGallery.ts"
import useUploadStore from "@/stores/uploadStore.ts";
import router from "@/router/index.ts";
import useMedia from "@/composables/useMedia.ts";

const useTabStore = defineStore('tabs', {
    state: () => ({
        tabs: [] as Tab[],
        activeTabID: 0,
        activeComponent: 'Gallery' as TabType
    }),

    getters: {
        activeTab: (state) => state.tabs.find(t => t.id === state.activeTabID)! as Tab,
        activeTabIndex: (state) => state.tabs.findIndex(t => t.id === state.activeTabID),
        tabState: (state) => state.tabs.find(t => t.id === state.activeTabID)!.state
    },

    actions: {
        addTab(tabType: TabType) {
            const tabID = Date.now();
            let tabState = getTabState(tabType);

            const tab = {
                id: tabID,
                title: tabType,
                type: tabType,
                state: tabState
            } as Tab;

            // Pinia is being weird about unwrapping values
            // @ts-ignore
            this.tabs.push(tab);
            this.setActiveTab(tabID);
            return tab.id;
        },

                setActiveTab(tabID: number, params?: any) {
                    const tab = this.tabs.find(t => t.id === tabID);
                    if (!tab) return;
                    
                    this.activeTabID = tabID;
                    this.activeComponent = tab.type;
                    
                    const routeParams = { ...params, tabID: tabID.toString() };
        
                    router.push({
                        name: tab.type,
                        params: routeParams
                    });
                },
        
                updateTabComponent(tabID: number, tabType: TabType, params?: any) {
                    const tabIdx = this.tabs.findIndex(t => t.id === tabID);
                    if (tabIdx === -1) return;
        
                    let newState = getTabState(tabType);
                    const oldType = this.tabs[tabIdx].type
                    
                    // We need to update both simultaneously to satisfy the union type if possible, 
                    // but for reactivity we assign properties. 
                    // @ts-ignore
                    this.tabs[tabIdx].type = tabType;
                    // @ts-ignore
                    this.tabs[tabIdx].state = newState;
        
                    const routeParams = { ...params, tabID: tabID.toString() };
                    
                    if (tabType !== oldType) {
                        router.push({
                            name: tabType,
                            params: routeParams
                        })
                    }
                },
        removeTab(tabID: number) {
            const index = this.tabs.findIndex(t => t.id === tabID);
            if (index === -1) return;

            // If removing the last tab, create a new gallery tab first.
            if (this.tabs.length === 1) {
                this.addTab('Gallery');
            }

            this.tabs.splice(index, 1);

            // Switch to another tab if we closed the active one
            if (this.activeTabID === tabID) {
                this.setActiveTab(this.tabs[this.tabs.length - 1]!.id);
            }
        },

        reorderTabs(fromIndex: number, toIndex: number) {
            if (fromIndex < 0 || fromIndex >= this.tabs.length || toIndex < 0 || toIndex >= this.tabs.length) return;
            const [movedTab] = this.tabs.splice(fromIndex, 1);
            this.tabs.splice(toIndex, 0, movedTab);
        }
    },
});

const getTabState = (tabType: TabType): TabState => {
    switch (tabType) {
        case "Gallery": return useGallery();
        case "Upload": return useUploadStore();
        case "Media": return useMedia();
    }
}

export default useTabStore;
