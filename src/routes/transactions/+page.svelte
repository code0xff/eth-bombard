<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  const totalPages = () => Math.max(1, Math.ceil(data.total / data.pageSize));
</script>

<main class="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 px-6 py-10">
  <div class="mx-auto flex w-full max-w-6xl flex-col gap-8">
    <header class="space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p class="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">Transaction Dashboard</p>
          <h1 class="text-4xl font-semibold text-white">Mainnet Transactions</h1>
          <p class="max-w-2xl text-sm text-stone-300">
            Review stored transactions, inspect receipt status, and navigate to detailed views.
          </p>
        </div>
        <a
          href="/"
          class="rounded-md border border-stone-700 bg-stone-900 px-4 py-2 text-sm font-semibold text-stone-100 transition hover:border-stone-500"
        >
          Back to Sender
        </a>
      </div>
    </header>

    <div class="grid gap-4 md:grid-cols-3">
      <Card className="space-y-2">
        <p class="text-xs uppercase text-stone-400">Confirmed</p>
        <p class="text-3xl font-semibold text-emerald-300">{data.summary.confirmed}</p>
      </Card>
      <Card className="space-y-2">
        <p class="text-xs uppercase text-stone-400">Pending</p>
        <p class="text-3xl font-semibold text-amber-200">{data.summary.pending}</p>
      </Card>
      <Card className="space-y-2">
        <p class="text-xs uppercase text-stone-400">Failed</p>
        <p class="text-3xl font-semibold text-rose-300">{data.summary.failed}</p>
      </Card>
    </div>

    <Card className="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 class="text-lg font-semibold">Transactions</h2>
          <p class="text-xs text-stone-400">Page {data.page} of {totalPages()} • {data.total} total entries</p>
        </div>
        <div class="flex items-center gap-2">
          <Button
            type="button"
            className="bg-stone-700 text-stone-100 hover:bg-stone-600"
            disabled={data.page <= 1}
            on:click={() => {
              const next = new URL(window.location.href);
              next.searchParams.set('page', String(data.page - 1));
              window.location.href = next.toString();
            }}
          >
            Previous
          </Button>
          <Button
            type="button"
            className="bg-stone-700 text-stone-100 hover:bg-stone-600"
            disabled={data.page >= totalPages()}
            on:click={() => {
              const next = new URL(window.location.href);
              next.searchParams.set('page', String(data.page + 1));
              window.location.href = next.toString();
            }}
          >
            Next
          </Button>
        </div>
      </div>

      {#if data.items.length === 0}
        <p class="text-sm text-stone-400">No transactions stored yet.</p>
      {:else}
        <div class="space-y-2 text-sm">
          {#each data.items as item}
            <a
              href={`/transactions/${item.id}`}
              class={`block rounded-md border px-4 py-3 transition ${
                item.status === 'confirmed'
                  ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-100'
                  : item.status === 'failed'
                  ? 'border-rose-500/40 bg-rose-950/30 text-rose-100'
                  : 'border-stone-800 bg-stone-900/70 text-stone-200 hover:border-stone-600'
              }`}
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p class="text-xs uppercase tracking-wide text-stone-400">{item.status}</p>
                  <p class="font-semibold">{item.hash}</p>
                  <p class="text-xs text-stone-400">From {item.account} → {item.recipient}</p>
                </div>
                <div class="text-xs text-stone-400">{item.createdAt}</div>
              </div>
            </a>
          {/each}
        </div>
      {/if}
    </Card>
  </div>
</main>
