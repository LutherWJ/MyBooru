<script setup lang="ts">
import SearchBar from "@/components/SearchBar.vue";
import useTabStore from "@/stores/tabStore.ts";
import {useAppStore} from "@/stores/appStore";
import {computed, onMounted, unref, isRef, type UnwrapRef} from "vue";
import {useRoute} from "vue-router";
import type {UseGallery} from "@/types.ts";

const route = useRoute();
const tabStore = useTabStore();
const appStore = useAppStore();

const tabID = computed(() => parseInt(route.params.tabID as string));

function isGalleryState(state: any): state is UnwrapRef<UseGallery> {
  return (state as UnwrapRef<UseGallery>).searchResults !== undefined;
}

const state = computed(() => {
  const tab = tabStore.tabs.find(t => t.id === tabID.value);
  if (tab && isGalleryState(tab.state)) {
    return tab.state;
  }
  return undefined;
});

const searchResults = computed(() => state.value?.searchResults.Media || []);

const searchBox = computed({
  get: () => unref(state.value?.searchBox) || '',
  set: (val) => {
    if (state.value) {
      if (isRef(state.value.searchBox)) {
        state.value.searchBox.value = val;
      } else {
        (state.value as any).searchBox = val;
      }
    }
  }
});

onMounted(() => {
  if (state.value) {
    state.value.search();
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
      <h1 class="text-white text-4xl mb-8">GALLERY (Tab: {{ tabID }})</h1>
      <div class="grid grid-cols-4 gap-4">
      <div v-for="media in searchResults" :key="media.ID" class="bg-gray-800 p-4 rounded shadow">
        <img :src="appStore.getThumbnailPath(media.MD5)" class="w-full h-auto" />
      </div>
    </div>
    <div v-if="searchResults.length === 0" class="text-gray-500 text-center mt-20">
      No results found
    </div>
  </div>
</template>