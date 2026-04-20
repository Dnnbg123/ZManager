<script setup lang="ts">
/**
 * SplitViewManager - Root component for managing unlimited split-panel layout.
 * Renders a recursive tree of containers and panels.
 */

import { computed } from "vue"
import {
  useSplitViewStore,
  type SplitContainerNode,
  type PanelNode,
  type LayoutRoot,
} from "@/stores/splitView.store"
import SplitContainer from "./SplitContainer.vue"
import FilePanel from "./FilePanel.vue"

const splitViewStore = useSplitViewStore()

const layout = computed(() => splitViewStore.layout)

function renderNode(node: PanelNode | SplitContainerNode, size?: number) {
  if (node.type === "panel") {
    return (
      <div
        key={node.id}
        class="relative h-full"
        style={{ width: size ? `${size}%` : "100%" }}
      >
        <FilePanel panelId={node.id} />
      </div>
    )
  }

  return <SplitContainer key={node.id} container={node as SplitContainerNode} />
}
</script>

<template>
  <div class="h-full w-full overflow-hidden">
    <div class="flex h-full w-full">
      <template v-for="(child, index) in layout.children" :key="child.id">
        <component
          :is="child.type === 'panel' ? FilePanel : SplitContainer"
          :panel-id="child.type === 'panel' ? child.id : undefined"
          :container="child.type === 'container' ? child : undefined"
          :size="layout.sizes[index]"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
/* Root split view container */
</style>
