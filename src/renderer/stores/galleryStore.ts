import {DEFAULT_PAGINATION_LIMIT} from "../../shared/constants.ts";
import {defineStore} from 'pinia';

const useGalleryStore = defineStore('gallery', {
    state: () => ({
        searchQuery: '',
        searchResults: [],
        pageAmount: 0,
        pageIndex: 0,
    }),

    getters: {
        hasResults: (state) => state.searchResults.length > 0,
        isLastPage: (state) => state.pageIndex >= state.pageAmount - 1,
        isFirstPage: (state) => state.pageIndex === 0,
    },

    actions: {

    }
});

export default useGalleryStore;
