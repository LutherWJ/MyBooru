<script setup lang="ts">
import SearchBar from "@/components/SearchBar.vue";
import useTabStore from "@/stores/tabStore.ts";
import { ref, computed, onMounted, onUnmounted, unref, watch } from "vue";
import { validateTabType } from "@/types.ts";
import { COLS } from '@/composables/useGallery';

const tabStore = useTabStore();

const state = computed(() => {
    const tab = tabStore.activeTab;
    return validateTabType(tab, 'Gallery') ? tab.state : null;
});

onMounted(() => {
// Ensure we have a valid state before rendering/acting
    if (!state.value) {
        console.warn("Gallery component mounted without Gallery state");
        if (tabStore.tabs.length === 0) {
            const id = tabStore.addTab('Gallery');
            tabStore.setActiveTab(id);
            return;
        }
    } 
    
    if (state.value) {
        if (!unref(state.value.hasResults)) {
            state.value.search();
        }
        state.value.enableKeyboard();
    }

});

onUnmounted(() => {
    state.value?.disableKeyboard();
});

// Use unref to handle potential unwrapping nuances and safe access
const searchResults = computed(() => unref(state.value?.searchResults)?.Media || []);
const selectedIdx = computed(() => unref(state.value?.selectedIdx) ?? -1);

const searchBox = computed({
    get: () => unref(state.value?.searchBox) || '',
    set: (val) => {
        if (state.value) {
            // @ts-ignore
            state.value.searchBox = val;
        }
    }
});

// Selection handling
const mediaRefs = ref<HTMLElement[]>([]);

// Auto-scroll to selected element
watch(selectedIdx, (newIdx) => {
    console.log(selectedIdx.value)
    if (newIdx > 0) {
        // newIdx is 1-based (0 is search bar), so subtract 1 for array index
        const el = mediaRefs.value[newIdx - 1];
        if (el) {
            el.focus();
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
});

</script>

<template>
    <div class="flex flex-col h-full bg-app-bg overflow-hidden items-center">
        <!-- Sticky Header -->
        <div
            class="w-full flex-none p-4 z-10 bg-app-bg/95 backdrop-blur-md border-b border-gray-800 sticky top-0 flex justify-center">
            <div class="w-full max-w-3xl">
                <SearchBar v-model="searchBox" @search="state?.search()" :is-focused="selectedIdx === 0" />
            </div>
        </div>

        <!-- Scrollable Content -->
        <div class="w-full flex-1 overflow-y-auto custom-scrollbar p-8 flex flex-col items-center">
            <div v-if="searchResults.length > 0" class="grid gap-6 max-w-[1400px] w-full"
                :style="{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }">
                <div v-for="(media, index) in searchResults" :key="media.ID" :id="`media-${index + 1}`"
                    class="group relative aspect-square rounded-xl overflow-hidden bg-gray-800/50 transition-all duration-300 cursor-pointer border-2"
                    :class="[
                        selectedIdx === index + 1
                            ? 'border-blue-500 shadow-lg shadow-blue-500/20 scale-105 z-10'
                            : 'border-transparent hover:border-gray-600'
                    ]" @click="tabStore.navigate(tabStore.activeTabID, 'Media', { mediaID: media.ID })"
                    ref="mediaRefs" tabindex="-1">
                    <img :src="state?.getThumbnail(media.MD5)"
                        class="w-full h-full object-cover transform transition-transform duration-500 ease-out will-change-transform"
                        :class="{ 'group-hover:scale-110': selectedIdx !== index + 1 }" />

                    <!-- Hover/Selection Overlay -->
                    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300 pointer-events-none"
                        :class="selectedIdx === index + 1 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'">
                        <div class="absolute bottom-0 left-0 right-0 p-3">
                            <p class="text-[10px] text-gray-400 font-mono">{{ media.MD5.substring(0, 8) }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div v-else class="flex flex-col items-center justify-center h-[60vh] text-gray-500">
                <p class="text-lg font-medium">No results found</p>
                <p class="text-sm opacity-60 mt-1">Try adjusting your search terms</p>
            </div>
        </div>
    </div>
</template>
