<script lang="ts">
  import { cn } from '$lib/utils';

  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let disabled = false;
  export let className = '';
</script>

<button
  {type}
  {disabled}
  class={cn(
    'inline-flex items-center justify-center rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-stone-950 shadow-sm transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-stone-700 disabled:text-stone-300',
    className
  )}
>
  <slot />
</button>
