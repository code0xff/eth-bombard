<script lang="ts">
  import { cn } from '$lib/utils';

  export let className = '';
</script>

<div class={cn('rounded-xl border border-stone-800 bg-stone-950/50 p-6 shadow-lg', className)}>
  <slot />
</div>
