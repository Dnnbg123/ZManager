<script setup lang="ts">
import type { LayoutNode } from "@/entities/types"
import LayoutNodeComponent from "./LayoutNode.vue"
defineProps<{
  node: LayoutNode
}>()
</script>
<template>
  <div
    class="flex w-full h-full"
    :class="node.direction === 'vertical' ? 'flex-col' : 'flex-row'"
  >
    <div
      v-for="(child, index) in node.children"
      :key="child.id"
      class="relative"
      :class="
        node.direction === 'vertical' ? 'flex-1 border-b' : 'flex-1 border-r'
      "
      :style="{ flex: child.size || 1 }"
    >
      <LayoutNodeComponent :node="child" />
      <div
        v-if="index < (node.children?.length || 0) - 1"
        class="absolute bg-gray-600 hover:bg-primary-500 transition-colors"
        :class="
          node.direction === 'vertical'
            ? 'h-1 w-full cursor-ns-resize bottom-0 left-0'
            : 'w-1 h-full cursor-ew-resize right-0 top-0'
        "
      />
    </div>
  </div>
</template>
