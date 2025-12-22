import {computed, ref} from "vue";
import {SearchMedia} from "../../wailsjs/go/app/App";
import {models} from '../../wailsjs/go/models'
import SearchResult = models.SearchResult;

const ITEMS_PER_PAGE = 20;

const useGallery = () => {
    let activeQuery = '';
    const searchBox = ref<string>('');
    const searchResults = ref<models.SearchResult>(new SearchResult());
    const pageAmount = computed(() => Math.ceil(searchResults.value.TotalCount / ITEMS_PER_PAGE))
    const pageIndex = ref<number>(0);
    const hasResults = computed(() => searchResults.value.Media.length > 0);
    const isFirstPage = computed(() => pageIndex.value === 0);
    const isLastPage = computed(() => pageIndex.value >= pageAmount.value - 1);

    const search = async () => {
        activeQuery = searchBox.value;
        try {
            const result = await SearchMedia(activeQuery, ITEMS_PER_PAGE, 0, null, null);
            pageIndex.value = 0;
            searchResults.value = result;
        } catch (error) {
            console.error('Search failed:', error);
        }
    };

    const nextPage = async () => {
        if (!searchResults.value.HasMore || !searchResults.value.LastID) return;

        try {
            const result = await SearchMedia(activeQuery, ITEMS_PER_PAGE, 0, searchResults.value.LastID, null);
            pageIndex.value++;
            searchResults.value = result;
        } catch (error) {
            console.error('Failed to load next page:', error);
        }
    };

    const prevPage = async () => {
        if (pageIndex.value === 0 || !searchResults.value.FirstID) return;

        try {
            const result = await SearchMedia(activeQuery, ITEMS_PER_PAGE, 0, null, searchResults.value.FirstID);
            pageIndex.value--;
            searchResults.value = result;
        } catch (error) {
            console.error('Failed to load previous page:', error);
        }
    };

    const jumpToPage = async (page: number) => {
        if (page < 0 || page >= pageAmount.value) return;

        try {
            const offset = page * ITEMS_PER_PAGE;
            const result = await SearchMedia(activeQuery, ITEMS_PER_PAGE, offset, null, null);
            pageIndex.value = page;
            searchResults.value = result;
        } catch (error) {
            console.error('Failed to jump to page:', error);
        }
    };

    return {
        searchBox,
        searchResults,
        pageAmount,
        pageIndex,
        hasResults,
        isFirstPage,
        isLastPage,
        search,
        nextPage,
        prevPage,
        jumpToPage
    }
}

const searchMedia = (query: string, limit: number, offset: number, lastID: string | null, firstID: string | null) => {

}

export default useGallery;
