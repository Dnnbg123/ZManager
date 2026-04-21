<script setup lang="ts">
import { computed } from "vue"
import type { LayoutNode } from "@/entities/types"
import SplitView from "./SplitView.vue"
const props = defineProps<{
  node: LayoutNode
}>()
const isSplit = computed(() => props.node.type === "split")
</script>
<template>
  <div class="w-full h-full">
    <template v-if="isSplit">
      <SplitView :node="node" />
    </template>
    <template v-else>
      <FilePanel :node="node" />
    </template>
  </div>
</template>
