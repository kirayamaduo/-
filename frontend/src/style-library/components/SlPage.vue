<template>
  <view class="sl-page" :class="[{ 'is-dark': dark }, customClass]" :style="pageStyle">
    <slot />
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  dark?: boolean;
  customClass?: string;
  safeBottom?: boolean;
  gutter?: string;
}>();

const pageStyle = computed(() => ({
  paddingLeft: props.gutter || undefined,
  paddingRight: props.gutter || undefined,
  paddingBottom: props.safeBottom ? 'env(safe-area-inset-bottom, 0px)' : undefined,
}));
</script>

<style scoped>
.sl-page {
  min-height: 100vh;
  background-color: var(--surface-1, #ffffff);
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif;
  box-sizing: border-box;
}

.sl-page.is-dark {
  background-color: var(--bg-color, #0f172a);
}
</style>
