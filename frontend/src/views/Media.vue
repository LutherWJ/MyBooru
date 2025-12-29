<script setup lang="ts">
import {onMounted} from "vue";
import useTabStore from "@/stores/tabStore.ts";
import {useRoute} from "vue-router";
import {validateTabType} from "@/types.ts";
import {useAppStore} from "@/stores/appStore.ts";

const tabStore = useTabStore();
const appStore = useAppStore();
const route = useRoute();

const activeTab = tabStore.activeTab;
if (!validateTabType(activeTab, 'Media')) {
  throw new Error("Media component mounted without Media state");
}

const state = activeTab.state;

onMounted(() => {
  state.init(Number(route.params.mediaID));
});
</script>

<template>
  <div v-if="state.media.value" class="flex items-center justify-center w-full h-full bg-black">
    <img
        :src="appStore.getMediaUrl(state.media.value.MD5, state.media.value.FileExt)"
        class="max-w-full max-h-full object-contain"
        alt="Failed to load media"
    />
  </div>
  <div v-else class="flex items-center justify-center w-full h-full text-gray-500">
    Loading...
  </div>
</template>