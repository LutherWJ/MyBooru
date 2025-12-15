import {computed, ref} from "vue";
import {models, SearchMedia} from "../../wailsjs/go/app/App";

const ITEMS_PER_PAGE = 20;

const useGallery = () => {
    let activeQuery = '';
    const searchBox = ref<string>('');
    const searchResults = ref<models.Media[]>([]);
    const pageAmount = ref<number>(0);
    const pageIndex = ref<number>(0);
    let firstID: number | null = null;
    let lastID: number | null = null;
    let hasMore: boolean = false;

    const hasResults = computed(() => searchResults.value.length > 0);
    const isFirstPage = computed(() => pageIndex.value === 0);
    const isLastPage = computed(() => pageIndex.value >= pageAmount.value - 1);

    const search = async () => {
        activeQuery = searchBox.value;
        try {
            const result = await SearchMedia(activeQuery, ITEMS_PER_PAGE, 0, null, null);
            pageIndex.value = 0;
            searchResults.value = result.Media;
            firstID = result.FirstID ?? null;
            lastID = result.LastID ?? null;
            hasMore = result.HasMore;
            pageAmount.value = Math.ceil(result.TotalCount / ITEMS_PER_PAGE);
        } catch (error) {
            console.error('Search failed:', error);
        }
    };

    const nextPage = async () => {
        if (!hasMore || !lastID) return;

        try {
            const result = await SearchMedia(activeQuery, ITEMS_PER_PAGE, 0, lastID, null);
            pageIndex.value++;
            searchResults.value = result.Media;
            firstID = result.FirstID ?? null;
            lastID = result.LastID ?? null;
            hasMore = result.HasMore;
            pageAmount.value = Math.ceil(result.TotalCount / ITEMS_PER_PAGE);
        } catch (error) {
            console.error('Failed to load next page:', error);
        }
    };

    const prevPage = async () => {
        if (pageIndex.value === 0 || !firstID) return;

        try {
            const result = await SearchMedia(activeQuery, ITEMS_PER_PAGE, 0, null, firstID);
            pageIndex.value--;
            searchResults.value = result.Media;
            firstID = result.FirstID ?? null;
            lastID = result.LastID ?? null;
            hasMore = result.HasMore;
            pageAmount.value = Math.ceil(result.TotalCount / ITEMS_PER_PAGE);
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
            searchResults.value = result.Media;
            firstID = result.FirstID ?? null;
            lastID = result.LastID ?? null;
            hasMore = result.HasMore;
            pageAmount.value = Math.ceil(result.TotalCount / ITEMS_PER_PAGE);
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

export default useGallery;
