<script lang="ts">
  import { cn } from '$lib/utils';

  export let value: string | number | undefined = undefined;
  export let type = 'text';
  export let placeholder = '';
  export let className = '';
  export let min: number | undefined = undefined;
  export let step: number | undefined = undefined;
  export let disabled = false;

  const handleInput = (event: Event) => {
    const target = event.currentTarget as HTMLInputElement;
    value = type === 'number' ? (target.value === '' ? '' : Number(target.value)) : target.value;
  };
</script>

<input
  value={value}
  type={type}
  {placeholder}
  {min}
  {step}
  {disabled}
  on:input={handleInput}
  class={cn(
    'flex h-10 w-full rounded-md border border-stone-800 bg-stone-900 px-3 py-2 text-sm text-stone-100 shadow-sm placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:cursor-not-allowed disabled:bg-stone-800',
    className
  )}
/>
