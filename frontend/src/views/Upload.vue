<script setup lang="ts">
import useUploadStore from "@/stores/uploadStore.ts";
import {computed} from "vue";
import {useRoute} from "vue-router";
import {useAPI} from "@/composables/useAPI.ts";

const route = useRoute();
const uploadStore = useUploadStore();

const mediaList = computed(() => uploadStore.mediaList);
const selectedMedia = computed(() => uploadStore.selectedMedia);
const selectedTagBox = computed({
  get: () => uploadStore.selectedTagBox,
  set: (value) => {
    if (value !== undefined) {
      uploadStore.mediaTagList[uploadStore.selectedIndex] = value;
    }
  }
});
const uploadProgress = computed(() => uploadStore.uploadProgress);

const handleFileSelect = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    for (const file of Array.from(input.files)) {
      uploadStore.queueMedia(file);
      uploadStore.mediaTagList.push('');
    }
  }
};

const handleSave = async () => {
  try {
    await uploadStore.uploadMedia();
    uploadStore.unqueueMedia(uploadStore.selectedIndex);
  } catch (error) {
    console.error('Upload failed:', error);
  }
};

</script>

<template>
  <div class="flex flex-col h-screen p-4 gap-4">
    <div class="flex-1 border border-gray-300 rounded p-2 overflow-y-auto">
      <h2 class="text-lg font-bold mb-2">Upload Queue ({{ mediaList.length }})</h2>
      <div v-for="(media, index) in mediaList" :key="index" class="mb-1">
        <button
          @click="uploadStore.setselectedIndex(index)"
          :class="[
            'w-full text-left px-3 py-2 rounded border',
            uploadStore.selectedIndex === index
              ? 'bg-blue-500 text-white border-blue-600'
              : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
          ]"
        >
          Media {{ index + 1 }} ({{ Math.round(media.size / 1024) }}KB)
        </button>
      </div>
      <div v-if="mediaList.length === 0" class="text-gray-500 text-center py-8">
        No files queued
      </div>
    </div>

    <div class="border border-gray-300 rounded p-4 space-y-3">
      <h2 class="text-lg font-bold">Upload Controls</h2>

      <div class="flex gap-2 items-center">
        <label for="file-select" class="font-medium">Select Files:</label>
        <input type="file" id="file-select" name="file-select" multiple @change="handleFileSelect" class="flex-1"/>
      </div>

      <div class="flex flex-col gap-1">
        <label for="tag-input" class="font-medium">Tags (space-separated):</label>
        <textarea
          id="tag-input"
          v-model="selectedTagBox"
          :disabled="mediaList.length === 0"
          class="border border-gray-300 rounded p-2 h-24 resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="tag1 tag2 tag3"
        />
      </div>

      <div class="flex gap-2">
        <button
          @click="handleSave"
          :disabled="mediaList.length === 0 || uploadProgress > 0"
          class="px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {{ uploadProgress > 0 ? 'Uploading...' : 'Upload Selected' }}
        </button>
        <button
          @click="uploadStore.clearQueue"
          :disabled="mediaList.length === 0 || uploadProgress > 0"
          class="px-4 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Clear Queue
        </button>
      </div>

      <div v-if="uploadProgress > 0" class="mt-2">
        <div class="text-sm font-medium mb-1">Upload Progress: {{ uploadProgress }}%</div>
        <div class="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            class="bg-blue-600 h-full transition-all duration-300"
            :style="{ width: uploadProgress + '%' }"
          />
        </div>
      </div>
    </div>
  </div>
</template>
