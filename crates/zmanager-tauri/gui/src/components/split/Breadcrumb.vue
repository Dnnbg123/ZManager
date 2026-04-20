<script setup lang="ts">
/**
 * Breadcrumb - Navigation breadcrumb component.
 * Shows the current path with clickable segments.
 */

import { computed } from 'vue';

const props = defineProps<{
  path: string;
}>();

const emit = defineEmits<{
  navigate: [path: string];
}>();

const segments = computed(() => {
  if (!props.path) return [];

  // Handle Windows paths (C:\...) and Unix paths (/...)
  const parts = props.path.split(/[\\/]/).filter(Boolean);

  // For Windows paths, preserve drive letter
  if (props.path.match(/^[A-Za-z]:/)) {
    const drive = props.path.charAt(0) + ':';
    return [drive, ...parts.slice(1)];
  }

  // For Unix paths, start with root
  if (props.path.startsWith('/')) {
    return ['/', ...parts];
  }

  return parts;
});

function handleSegmentClick(index: number) {
  // Build path up to this segment
  const selectedSegments = segments.value.slice(0, index + 1);
  let newPath: string;

  if (selectedSegments[0] === '/') {
    newPath = '/' + selectedSegments.slice(1).join('/');
  } else if (selectedSegments.length === 1 && selectedSegments[0].endsWith(':')) {
    newPath = selectedSegments[0];
  } else {
    newPath = selectedSegments.join('/');
  }

  emit('navigate', newPath);
}

function handleRootClick() {
  // Navigate to root based on current path
  if (props.path.match(/^[A-Za-z]:/)) {
    emit('navigate', props.path.charAt(0) + ':\\');
  } else {
    emit('navigate', '/');
  }
}
</script>

<template>
  <div class="flex items-center border-b border-gray-700 bg-gray-800 px-3 py-1.5 text-sm">
    <!-- Root button -->
    <button
      class="flex items-center gap-1 rounded px-2 py-1 text-gray-400 hover:bg-gray-700 hover:text-white"
      @click="handleRootClick"
    >
      <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
      </svg>
    </button>

    <!-- Separator -->
    <span class="mx-1 text-gray-600">/</span>

    <!-- Path segments -->
    <template v-for="(segment, index) in segments" :key="index">
      <button
        :class="[
          'max-w-[150px] truncate rounded px-2 py-1 transition-colors',
          index === segments.length - 1
            ? 'font-medium text-white'
            : 'text-gray-400 hover:bg-gray-700 hover:text-white',
        ]"
        @click="handleSegmentClick(index)"
      >
        {{ segment }}
      </button>

      <!-- Separator (not after last segment) -->
      <span
        v-if="index < segments.length - 1"
        class="mx-1 text-gray-600"
      >
        /
      </span>
    </template>
  </div>
</template>

<style scoped>
/* Breadcrumb styles */
</style>