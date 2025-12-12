import {computed, ref} from "vue";
import type {Media} from "../../shared/types.ts";
import { GetAllMedia } from "../../wailsjs/go/app/App";

const ITEMS_PER_PAGE = 50;

const useGallery = () => {
    let activeQuery = '';
    const searchBox = ref<string>('');
    const searchResults = ref<Media[]>([]);
    const pageAmount = ref<number>(0);
    const pageIndex = ref<number>(0);

    const hasResults = computed(() => searchResults.value.length > 0);
    const isFirstPage = computed(() => pageIndex.value === 0);
    const isLastPage = computed(() => pageIndex.value >= pageAmount.value - 1);

    const search = async () => {
        activeQuery = searchBox.value;
        try {
            // TODO: Implement search query parser and use SearchMedia
            // For now, just get all media
            const media = await GetAllMedia(0, ITEMS_PER_PAGE);
            pageIndex.value = 0;
            searchResults.value = media;
            // TODO: Get total count to calculate pageAmount
            pageAmount.value = 1;
        } catch (error) {
            console.error('Search failed:', error);
            // TODO: show error to user
        }
    }

    const changePage = async (page: number) => {
        if (page < 0 || page >= pageAmount.value) {
            return;
        }
        pageIndex.value = page;

        try {
            const offset = page * ITEMS_PER_PAGE;
            const media = await GetAllMedia(offset, ITEMS_PER_PAGE);
            searchResults.value = media;
        } catch (error) {
            console.error('Failed to change page:', error);
            // TODO: show error to user
        }
    }

    return {
        searchBox,
        searchResults,
        pageAmount,
        pageIndex,
        hasResults,
        isFirstPage,
        isLastPage,
        search,
        changePage,
    }
}

export default useGallery;
