<script setup lang="ts">
import { onMounted, onUnmounted, unref } from "vue";
import useTabStore from "@/stores/tabStore.ts";
import { useRoute } from "vue-router";
import { validateTabType } from "@/types.ts";
import { useAppStore } from "@/stores/appStore.ts";

const tabStore = useTabStore();
const appStore = useAppStore();
const route = useRoute();

const activeTab = tabStore.activeTab;
if (!validateTabType(activeTab, "Media")) {
  throw new Error("Media component mounted without Media state");
}

const state = activeTab.state;

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === "Backspace" || e.key === "Escape") {
    tabStore.goBack(tabStore.activeTabID);
  }
};

onMounted(async () => {
  window.addEventListener("keydown", handleKeydown);
  await state.init(Number(route.params.mediaID));
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <div
    v-if="unref(state.media)"
    class="relative flex items-center justify-center w-full h-full bg-black group"
  >
    <!-- Back Button -->
    <button
      @click="tabStore.goBack(tabStore.activeTabID)"
      class="absolute top-4 left-4 z-10 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white transition-opacity opacity-0 group-hover:opacity-100"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
    </button>

    <!--Content Box-->
    <div class="flex flex-row">
      <!--Media Window-->
      <img
        :src="
          appStore.getMediaUrl(
            unref(state.media)!.MD5,
            unref(state.media)!.FileExt,
          )
        "
        class="max-w-full max-h-full object-contain"
        alt="Failed to load media"
      />

      <!--Metadata sidebar-->
      <div>
        <span v-for="tag in state.tags">
          {{ tag.Name }}
        </span>
      </div>
    </div>
  </div>
  <div
    v-else
    class="flex items-center justify-center w-full h-full text-gray-500"
  >
    Loading...
  </div>
</template>
