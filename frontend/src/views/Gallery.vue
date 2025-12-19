<script setup lang="ts">
import SearchBar from "@/components/SearchBar.vue";
import useTabStore from "@/stores/tabStore.ts";
import {computed, onMounted, type UnwrapRef} from "vue";
import {useRoute} from "vue-router";
import type {UseGallery} from "@/types.ts";
import {GetThumbnailPath} from "../../wailsjs/go/app/App";

const route = useRoute();
const tabStore = useTabStore();

const tabId = computed(() => parseInt(route.params.tabId as string));

function isGalleryState(state: any): state is UnwrapRef<UseGallery> {
  return (state as UnwrapRef<UseGallery>).searchResults !== undefined;
}

const state = computed(() => {
  const tab = tabStore.tabs.find(t => t.id === tabId.value);
  if (tab && isGalleryState(tab.state)) {
    return tab.state;
  }
  return undefined;
});

const searchResults = computed(() => state.value?.searchResults.Media || []);

const searchBox = computed({
  get: () => state.value?.searchBox || '',
  set: (val) => { if (state.value) state.value.searchBox = val; }
});

onMounted(() => {

})
</script>

<template>
  <div class="p-4 flex flex-col items-center w-full">
    <div class="w-full max-w-4xl mt-12">
      <SearchBar v-model="searchBox" @search="state?.search()" />
    </div>
  </div>
    
    <div class="w-full mt-12">
      <h1 class="text-white text-4xl mb-8">GALLERY (Tab: {{ tabId }})</h1>
      <div class="grid grid-cols-4 gap-4">
      <div v-for="media in searchResults" :key="media.ID" class="bg-gray-800 p-4 rounded shadow">
        <p class="text-white">{{ GetThumbnailPath(media.MD5) }}</p>
      </div>
    </div>
    <div v-if="searchResults.length === 0" class="text-gray-500 text-center mt-20">
      No results found
    </div>
  </div>
</template>
