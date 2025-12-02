import {DEFAULT_PAGINATION_LIMIT} from "../../shared/constants.ts";
import type {Media, DatabaseError} from "../../shared/types.ts";
import {ref} from "vue";
import {defineStore} from 'pinia';

const useGalleryStore = defineStore('gallery', {
    state: () => ({
        searchQuery: ref<string>(''),
        searchResults: [] as Media[],
        pageAmount: 0,
        pageIndex: 0,
    }),

    getters: {
        hasResults: (state) => state.searchResults.length > 0,
        isLastPage: (state) => state.pageIndex >= state.pageAmount - 1,
        isFirstPage: (state) => state.pageIndex === 0,
    },

    actions: {
        async search() {
            const result = await window.api.media.search(this.searchQuery, this.pageIndex);
            if (!result.ok) {
                console.error(result.error);
                return;
            }
            this.searchResults = result.value.media;
            this.pageAmount = result.value.totalPages;
        }
    }
});

export default useGalleryStore;
