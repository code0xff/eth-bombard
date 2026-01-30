<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  let isFetching = false;
  let fetchError = '';

  const fetchReceipt = async () => {
    isFetching = true;
    fetchError = '';
    try {
      const response = await fetch(`/api/transactions/${data.transaction.id}/receipt`, {
        method: 'POST',
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error ?? 'Failed to fetch receipt.');
      }
      window.location.reload();
    } catch (error) {
      fetchError = error instanceof Error ? error.message : 'Failed to fetch receipt.';
    } finally {
      isFetching = false;
    }
  };
</script>

<main class="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 px-6 py-10">
  <div class="mx-auto flex w-full max-w-5xl flex-col gap-8">
    <header class="space-y-3">
      <p class="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">Transaction Details</p>
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-semibold text-white">{data.transaction.hash}</h1>
          <p class="text-sm text-stone-300">Status: {data.transaction.status}</p>
        </div>
        <a
          href="/transactions"
          class="rounded-md border border-stone-700 bg-stone-900 px-4 py-2 text-sm font-semibold text-stone-100 transition hover:border-stone-500"
        >
          Back to Dashboard
        </a>
      </div>
    </header>

    <Card className="space-y-4">
      <div class="grid gap-4 md:grid-cols-2">
        <div>
          <p class="text-xs uppercase text-stone-400">From</p>
          <p class="text-sm text-stone-100">{data.transaction.account}</p>
        </div>
        <div>
          <p class="text-xs uppercase text-stone-400">To</p>
          <p class="text-sm text-stone-100">{data.transaction.recipient}</p>
        </div>
        <div>
          <p class="text-xs uppercase text-stone-400">Created</p>
          <p class="text-sm text-stone-100">{data.transaction.createdAt}</p>
        </div>
        {#if data.transaction.error}
          <div>
            <p class="text-xs uppercase text-rose-300">Error</p>
            <p class="text-sm text-rose-200">{data.transaction.error}</p>
          </div>
        {/if}
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <Button type="button" on:click={fetchReceipt} disabled={isFetching}>
          {isFetching ? 'Fetching Receipt...' : 'Fetch Receipt'}
        </Button>
        {#if fetchError}
          <p class="text-sm text-rose-300">{fetchError}</p>
        {/if}
      </div>

      <div class="space-y-2">
        <h2 class="text-lg font-semibold">Receipt</h2>
        {#if data.transaction.receipt}
          <pre class="max-h-96 overflow-auto rounded-md bg-stone-950/80 p-3 text-xs text-stone-100">
{JSON.stringify(data.transaction.receipt, null, 2)}
          </pre>
        {:else}
          <p class="text-sm text-stone-400">Receipt not loaded yet. Click fetch to retrieve it.</p>
        {/if}
      </div>
    </Card>
  </div>
</main>
