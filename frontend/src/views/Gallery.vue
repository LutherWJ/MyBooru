<script setup lang="ts">
import SearchBar from "@/components/SearchBar.vue";
import useTabStore from "@/stores/tabStore.ts";
import {computed, onMounted, unref} from "vue";
import { validateTabType } from "@/types.ts";

const tabStore = useTabStore();

const state = computed(() => {
  const tab = tabStore.activeTab;
  // TODO: Create edgecase error handling / recovery
  // For now, if we are in Gallery view but state is wrong, we return null
  return validateTabType(tab, 'Gallery') ? tab.state : null;
});

// Ensure we have a valid state before rendering/acting
onMounted(() => {
  if (!state.value) {
      // If state is missing on mount, try to recover or just log
      console.warn("Gallery component mounted without Gallery state");
      if (tabStore.tabs.length === 0) {
           const id = tabStore.addTab('Gallery');
           tabStore.setActiveTab(id);
      }
  } else {
      state.value.search();
  }
});

const searchResults = computed(() => state.value?.searchResults.Media || []);

const searchBox = computed({
  get: () => unref(state.value?.searchBox) || '',
  set: (val) => {
    if (state.value) {
      state.value.searchBox.value = val;
    }
  }
});

</script>

<template>
  <div class="p-4 flex flex-col items-center w-full">
    <div class="w-full max-w-4xl mt-12">
      <SearchBar v-model="searchBox" @search="state?.search()" />
    </div>
  </div>
    
    <div class="w-full mt-12">
      <div class="grid grid-cols-4 gap-4">
      <div
          v-for="media in searchResults"
          :key="media.ID" class="bg-gray-800 p-4 rounded shadow"
          @click="tabStore.updateTabComponent(tabStore.activeTabID, 'Media', {mediaID: media.ID})">

        <img :src="state?.getThumbnail(media.MD5)" class="w-full h-auto" />
      </div>
    </div>
    <div v-if="searchResults.length === 0" class="text-gray-500 text-center mt-20">
      No results found
    </div>
  </div>
</template>