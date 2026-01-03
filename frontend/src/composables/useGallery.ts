import { computed, reactive, toRefs } from "vue";
import { SearchMedia } from "../../wailsjs/go/app/App";
import { models } from "../../wailsjs/go/models";
import SearchResult = models.SearchResult;
import { useAppStore } from "@/stores/appStore.ts";
import useTabStore from "@/stores/tabStore";

export const ITEMS_PER_PAGE = 20;

// TODO: create logic to dynamically generate rows/cols based on screen size
// It should only calculate the width to see how many cols can fit.
export const COLS = 5;

const useGallery = () => {
  const state = reactive({
    searchBox: "",
    searchResults: new SearchResult({
      Media: [],
      TotalCount: 0,
      FirstID: 0,
      LastID: 0,
      HasMore: false,
    }),
    pageIndex: 0,
    selectedIdx: 0, // Searchbox has the index of 0
  });

  // Computed properties based on state
  const pageAmount = computed(() =>
    Math.ceil(state.searchResults.TotalCount / ITEMS_PER_PAGE),
  );
  const hasResults = computed(() => state.searchResults.Media.length > 0);
  const isFirstPage = computed(() => state.pageIndex === 0);
  const isLastPage = computed(() => !state.searchResults.HasMore);

  let activeQuery = "";

  const search = async () => {
    activeQuery = state.searchBox;
    try {
      const result = await SearchMedia(
        activeQuery,
        ITEMS_PER_PAGE,
        0,
        null,
        null,
      );
      state.pageIndex = 0;
      state.searchResults = result;
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  const nextPage = async () => {
    // DEBUG TIME
    console.log(`LastID: ${state.searchResults.LastID}`);
    console.log(`HasMore: ${state.searchResults.HasMore}`);
    if (!state.searchResults.HasMore || !state.searchResults.LastID) return;

    if (state.selectedIdx > state.searchResults.Media.length) {
      state.selectedIdx = state.searchResults.Media.length;
    }

    try {
      const result = await SearchMedia(
        activeQuery,
        ITEMS_PER_PAGE,
        0,
        state.searchResults.LastID,
        null,
      );
      state.pageIndex++;
      state.searchResults = result;
    } catch (error) {
      console.error("Failed to load next page:", error);
    }
  };

  const prevPage = async () => {
    if (state.pageIndex === 0 || !state.searchResults.FirstID) return;

    if (state.selectedIdx > state.searchResults.Media.length) {
      state.selectedIdx = state.searchResults.Media.length;
    }

    try {
      const result = await SearchMedia(
        activeQuery,
        ITEMS_PER_PAGE,
        0,
        null,
        state.searchResults.FirstID,
      );
      state.pageIndex--;
      state.searchResults = result;
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
      state.pageIndex = page;
      state.searchResults = result;
    } catch (error) {
      console.error("Failed to jump to page:", error);
    }
  };

  const navigateToImage = () => {
    const i = state.selectedIdx - 1;
    const id = state.searchResults.Media[i].ID;
    const tabStore = useTabStore();
    tabStore.navigate(tabStore.activeTabID, "Media", { mediaID: id });
  };

  const getThumbnail = (md5: string) => {
    const appStore = useAppStore();
    if (!appStore.port) return "";
    return `http://localhost:${appStore.port}/thumbnail/${md5}.jpg`;
  };

  const handleKeydown = (event: KeyboardEvent) => {
    // Check if we are typing in an input field
    const target = event.target as HTMLElement;
    const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA";
    const key = event.key.toUpperCase();

    // If typing in an input, ignore navigation keys that conflict with typing
    if (isInput && ["W", "A", "S", "D", "Z", "X"].includes(key)) {
      return;
    }

    // Only prevent default if we're handling the key
    if (
      [
        "ARROWUP",
        "ARROWDOWN",
        "ARROWLEFT",
        "ARROWRIGHT",
        "W",
        "S",
        "A",
        "D",
      ].includes(key)
    ) {
      // Don't prevent default if search bar is focused
      if (state.selectedIdx !== 0) {
        event.preventDefault();
      }
    }

    // Handle initial activation from neutral state (WASD/Arrows only activate grid)
    if (state.selectedIdx === -1) {
      if (
        [
          "ARROWUP",
          "ARROWDOWN",
          "ARROWLEFT",
          "ARROWRIGHT",
          "W",
          "S",
          "A",
          "D",
        ].includes(key)
      ) {
        if (state.searchResults.Media.length > 0) {
          state.selectedIdx = 1;
          return;
        }
      }
    }

    switch (key) {
      case "ARROWUP":
      case "W":
        if (state.selectedIdx > COLS) {
          state.selectedIdx -= COLS;
        }
        break;
      case "ARROWDOWN":
      case "S":
        if (
          state.selectedIdx > 0 &&
          state.selectedIdx + COLS <= state.searchResults.Media.length
        ) {
          state.selectedIdx += COLS;
        } else if (
          state.selectedIdx === 0 &&
          state.searchResults.Media.length > 0
        ) {
          state.selectedIdx = 1;
        }
        break;
      case "ARROWLEFT":
      case "A":
        if (state.selectedIdx > 1 && (state.selectedIdx - 1) % COLS !== 0) {
          state.selectedIdx -= 1;
        }
        break;
      case "ARROWRIGHT":
      case "D":
        if (
          state.selectedIdx > 0 &&
          state.selectedIdx % COLS !== 0 &&
          state.selectedIdx < state.searchResults.Media.length
        ) {
          state.selectedIdx += 1;
        }
        break;
      case "Q":
        state.selectedIdx = 0;
        break;
      case "ENTER":
        if (state.selectedIdx === 0) search();
        break;
      case " ":
        if (state.selectedIdx > 0) navigateToImage();
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
    ...toRefs(state),
    pageAmount,
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
