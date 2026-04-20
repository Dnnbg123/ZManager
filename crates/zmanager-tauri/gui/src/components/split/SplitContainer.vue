<script setup lang="ts">
/**
 * SplitContainer - Recursive container component for split layouts.
 * Handles horizontal or vertical splitting with drag-to-resize.
 */

import { computed, ref } from "vue"
import {
  useSplitViewStore,
  type SplitContainerNode,
  type PanelNode,
} from "@/stores/splitView.store"
import FilePanel from "./FilePanel.vue"

const props = defineProps<{
  container: SplitContainerNode
  size?: number
}>()

const splitViewStore = useSplitViewStore()

const isDragging = ref(false)
const draggingIndex = ref(-1)
const dragStartX = ref(0)
const dragStartY = ref(0)
const dragStartSize = ref(0)

const isHorizontal = computed(() => props.container.direction === "horizontal")
const isVertical = computed(() => props.container.direction === "vertical")

const containerClass = computed(() => ({
  "flex h-full w-full": true,
  "flex-row": isHorizontal.value,
  "flex-col": isVertical.value,
}))

const styleProps = computed(() => {
  if (props.size !== undefined) {
    return isHorizontal.value
      ? { width: `${props.size}%` }
      : { height: `${props.size}%` }
  }
  return {}
})

function handleMouseDown(event: MouseEvent, index: number) {
  event.preventDefault()
  isDragging.value = true
  draggingIndex.value = index
  dragStartX.value = event.clientX
  dragStartY.value = event.clientY
  dragStartSize.value = props.container.sizes[index]

  document.addEventListener("mousemove", handleMouseMove)
  document.addEventListener("mouseup", handleMouseUp)
}

function handleMouseMove(event: MouseEvent) {
  if (!isDragging.value || draggingIndex.value === -1) return

  const containerElement = document.getElementById(
    `container-${props.container.id}`,
  )
  if (!containerElement) return

  const rect = containerElement.getBoundingClientRect()
  let newSize: number

  if (isHorizontal.value) {
    const deltaX = event.clientX - dragStartX.value
    const deltaPercent = (deltaX / rect.width) * 100
    newSize = dragStartSize.value + deltaPercent
  } else {
    const deltaY = event.clientY - dragStartY.value
    const deltaPercent = (deltaY / rect.height) * 100
    newSize = dragStartSize.value + deltaPercent
  }

  splitViewStore.resizeSplit(props.container.id, draggingIndex.value, newSize)
}

function handleMouseUp() {
  isDragging.value = false
  draggingIndex.value = -1
  document.removeEventListener("mousemove", handleMouseMove)
  document.removeEventListener("mouseup", handleMouseUp)
}

function renderChild(child: PanelNode | SplitContainerNode, index: number) {
  const childSize = props.container.sizes[index]

  if (child.type === "panel") {
    return (
      <div
        key={child.id}
        class="relative"
        style={
          isHorizontal.value
            ? { width: `${childSize}%` }
            : { height: `${childSize}%` }
        }
      >
        <FilePanel panelId={child.id} />
      </div>
    )
  }

  return <SplitContainer key={child.id} container={child} size={childSize} />
}
</script>

<template>
  <div
    :id="`container-${container.id}`"
    :class="containerClass"
    :style="styleProps"
  >
    <template v-for="(child, index) in container.children" :key="child.id">
      <!-- Child node -->
      <component
        :is="child.type === 'panel' ? FilePanel : SplitContainer"
        :panel-id="child.type === 'panel' ? child.id : undefined"
        :container="child.type === 'container' ? child : undefined"
        :size="container.sizes[index]"
      />

      <!-- Resize handle (not after last child) -->
      <div
        v-if="index < container.children.length - 1"
        :class="[
          'split-handle',
          isHorizontal ? 'split-handle-horizontal' : 'split-handle-vertical',
          isDragging && draggingIndex === index ? 'dragging' : '',
        ]"
        @mousedown="handleMouseDown($event, index)"
      >
        <div class="handle-grip">
          <span v-if="isHorizontal" class="grip-dots-horizontal">⋮</span>
          <span v-else class="grip-dots-vertical">⋯</span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.split-handle {
  position: relative;
  background-color: transparent;
  transition: background-color 0.15s ease;
  z-index: 10;
  flex-shrink: 0;
}

.split-handle-horizontal {
  width: 4px;
  cursor: col-resize;
  margin-left: -2px;
  margin-right: -2px;
}

.split-handle-vertical {
  height: 4px;
  cursor: row-resize;
  margin-top: -2px;
  margin-bottom: -2px;
}

.split-handle:hover,
.split-handle.dragging {
  background-color: rgb(59 130 246 / 0.5);
}

.handle-grip {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.split-handle:hover .handle-grip,
.split-handle.dragging .handle-grip {
  opacity: 1;
}

.grip-dots-horizontal,
.grip-dots-vertical {
  font-size: 8px;
  color: #9ca3af;
  line-height: 1;
  user-select: none;
}

/* Prevent text selection during drag */
.split-handle.dragging {
  user-select: none;
}
</style>
