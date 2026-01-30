<script lang="ts">
  import { cn } from '$lib/utils';

  export let value: string | undefined = undefined;
  export let className = '';
</script>

<select
  bind:value
  class={cn(
    'flex h-10 w-full rounded-md border border-stone-800 bg-stone-900 px-3 py-2 text-sm text-stone-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500',
    className
  )}
>
  <slot />
</select>
