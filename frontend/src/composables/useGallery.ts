import { computed, ref } from "vue";
import { SearchMedia } from "../../wailsjs/go/app/App";
import { models } from "../../wailsjs/go/models";
import SearchResult = models.SearchResult;
import { useAppStore } from "@/stores/appStore.ts";
import useTabStore from "@/stores/tabStore";

export const ITEMS_PER_PAGE = 20;

// TODO: create logic to dynamically generate rows/cols based on screen size
// It should only calculate the width to see how many cols can fit.
const ROWS = 4;
export const COLS = 5;

const useGallery = () => {
  // Search State
  let activeQuery = "";
  const searchBox = ref<string>("");
  const searchResults = ref<models.SearchResult>(new SearchResult());
  const pageAmount = computed(() =>
    Math.ceil(searchResults.value.TotalCount / ITEMS_PER_PAGE),
  );
  const pageIndex = ref<number>(0);
  const hasResults = computed(() => searchResults.value.Media.length > 0);
  const isFirstPage = computed(() => pageIndex.value === 0);
  const isLastPage = computed(() => pageIndex.value >= pageAmount.value - 1);
  // Keyboard state
  const selectedIdx = ref<number>(0); // Searchbox has the index of 0

  const search = async () => {
    activeQuery = searchBox.value;
    try {
      const result = await SearchMedia(
        activeQuery,
        ITEMS_PER_PAGE,
        0,
        null,
        null,
      );
      pageIndex.value = 0;
      searchResults.value = result;
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  const nextPage = async () => {
    if (!searchResults.value.HasMore || !searchResults.value.LastID) return;

    try {
      const result = await SearchMedia(
        activeQuery,
        ITEMS_PER_PAGE,
        0,
        searchResults.value.LastID,
        null,
      );
      pageIndex.value++;
      searchResults.value = result;
    } catch (error) {
      console.error("Failed to load next page:", error);
    }
  };

  const prevPage = async () => {
    if (pageIndex.value === 0 || !searchResults.value.FirstID) return;

    try {
      const result = await SearchMedia(
        activeQuery,
        ITEMS_PER_PAGE,
        0,
        null,
        searchResults.value.FirstID,
      );
      pageIndex.value--;
      searchResults.value = result;
    } catch (error) {
      console.error("Failed to load previous page:", error);
    }
  };

  const jumpToPage = async (page: number) => {
    if (page < 0 || page >= pageAmount.value) return;

    try {
      const offset = page * ITEMS_PER_PAGE;
      const result = await SearchMedia(
        activeQuery,
        ITEMS_PER_PAGE,
        offset,
        null,
        null,
      );
      pageIndex.value = page;
      searchResults.value = result;
    } catch (error) {
      console.error("Failed to jump to page:", error);
    }
  };

  const navigateToImage = () => {
    const i = selectedIdx.value - 1;
    const id = searchResults.value.Media[i].ID;
    const tabStore = useTabStore();
    tabStore.updateTabComponent(tabStore.activeTabID, "Media", { mediaID: id });
  };

  const getThumbnail = (md5: string) => {
    const appStore = useAppStore();
    if (!appStore.port) return "";
    return `http://localhost:${appStore.port}/thumbnail/${md5}.jpg`;
  };

  const handleKeydown = (event: KeyboardEvent) => {
    event.preventDefault();
    const key = event.key.toUpperCase();

    switch (key) {
      case "ARROWUP":
      case "W":
        if (selectedIdx.value > COLS) {
          selectedIdx.value -= COLS;
        }
        break;
      case "ARROWDOWN":
      case "S":
        if (selectedIdx.value < ROWS * COLS - COLS) {
          selectedIdx.value += COLS;
        }
        break;
      case "ARROWLEFT":
      case "A":
        if (selectedIdx.value % COLS !== 0) {
          selectedIdx.value -= 1;
        }
        break;
      case "ARROWRIGHT":
        if (selectedIdx.value % COLS !== COLS) {
          selectedIdx.value += 1;
        }
        break;
      case "Q":
        selectedIdx.value = 0;
        break;
      case "ENTER":
        search();
        break;
      case " ":
        navigateToImage();
        break;
      case "Z":
        prevPage();
        break;
      case "X":
        nextPage();
        break;
    }
  };

  const enableKeyboard = () => {
    document.addEventListener("keydown", handleKeydown);
  };

  const disableKeyboard = () => {
    document.removeEventListener("keydown", handleKeydown);
  };

  return {
    searchBox,
    searchResults,
    selectedIdx,
    pageAmount,
    pageIndex,
    hasResults,
    isFirstPage,
    isLastPage,
    search,
    nextPage,
    prevPage,
    jumpToPage,
    getThumbnail,
    enableKeyboard,
    disableKeyboard,
  };
};

export default useGallery;
