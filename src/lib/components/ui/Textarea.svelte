<script lang="ts">
  import { cn } from '$lib/utils';

  export let value: string | undefined = undefined;
  export let placeholder = '';
  export let rows = 4;
  export let className = '';
</script>

<textarea
  bind:value
  {rows}
  {placeholder}
  class={cn(
    'flex w-full rounded-md border border-stone-800 bg-stone-900 px-3 py-2 text-sm text-stone-100 shadow-sm placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500',
    className
  )}
></textarea>
