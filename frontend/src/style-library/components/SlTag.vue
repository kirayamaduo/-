<template>
  <text class="sl-tag" :class="`sl-tag--${variant}`">
    <slot>{{ text }}</slot>
  </text>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    text?: string;
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  }>(),
  {
    text: '',
    variant: 'default',
  },
);
</script>

<style scoped>
.sl-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}

.sl-tag--default {
  background: var(--surface-3, #f1f5f9);
  color: var(--text-secondary, #64748b);
}

.sl-tag--primary {
  background: var(--primary-soft, #eff6ff);
  color: var(--primary-hover, #1d4ed8);
}

.sl-tag--success {
  background: var(--success-soft, #dcfce7);
  color: var(--success-color, #059669);
}

.sl-tag--warning {
  background: var(--accent-soft, #fff7ed);
  color: var(--accent-hover, #ea580c);
}

.sl-tag--danger {
  background: var(--danger-soft, #fef2f2);
  color: var(--danger-color, #ef4444);
}
</style>
