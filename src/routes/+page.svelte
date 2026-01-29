<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Label from '$lib/components/ui/Label.svelte';
  import Select from '$lib/components/ui/Select.svelte';
  import Textarea from '$lib/components/ui/Textarea.svelte';
  import { createWalletClient, http, parseEther, parseGwei } from 'viem';
  import { mainnet } from 'viem/chains';
  import { privateKeyToAccount } from 'viem/accounts';

  type LogEntry = {
    id: number;
    status: 'info' | 'success' | 'error';
    message: string;
  };

  let rpcUrl = '';
  let transactionType = 'eip1559';
  let gasLimit = 21000;
  let gasPriceGwei = '25';
  let maxFeePerGasGwei = '35';
  let maxPriorityFeeGwei = '2';
  let accessListJson = '';
  let valueEth = '0.001';
  let dataHex = '';
  let txCount = 5;
  let concurrency = 2;

  let recipients = '';
  let keyFileName = '';
  let privateKeys: string[] = [];

  let isSending = false;
  let logEntries: LogEntry[] = [];
  let errorMessage = '';

  const addLog = (status: LogEntry['status'], message: string) => {
    logEntries = [...logEntries, { id: Date.now() + Math.random(), status, message }];
  };

  const resetLogs = () => {
    logEntries = [];
    errorMessage = '';
  };

  const parseKeyText = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      return [] as string[];
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((key) => String(key));
      }
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.privateKeys)) {
        return parsed.privateKeys.map((key: string) => String(key));
      }
    } catch (error) {
      // fallback to delimited values
    }

    return trimmed
      .split(/\s|,|;|\n/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  };

  const handleKeyFile = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (!target.files || !target.files[0]) {
      return;
    }

    const file = target.files[0];
    keyFileName = file.name;
    const content = await file.text();
    privateKeys = parseKeyText(content);
    addLog('info', `Loaded ${privateKeys.length} private key(s) from ${file.name}.`);
  };

  const parseRecipients = () => {
    return recipients
      .split(/\s|,|;|\n/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  };

  const normalizeKey = (key: string) => {
    if (!key.startsWith('0x')) {
      return `0x${key}`;
    }
    return key;
  };

  const parseAccessList = () => {
    if (!accessListJson.trim()) {
      return undefined;
    }
    try {
      return JSON.parse(accessListJson);
    } catch (error) {
      throw new Error('Access list JSON is invalid.');
    }
  };

  const runWithConcurrency = async <T,>(tasks: (() => Promise<T>)[], limit: number) => {
    const results: T[] = [];
    let index = 0;

    const runners = new Array(Math.min(limit, tasks.length)).fill(null).map(async () => {
      while (index < tasks.length) {
        const currentIndex = index;
        index += 1;
        results[currentIndex] = await tasks[currentIndex]();
      }
    });

    await Promise.all(runners);
    return results;
  };

  const sendTransactions = async () => {
    resetLogs();

    if (!rpcUrl) {
      errorMessage = 'Please enter a mainnet RPC URL.';
      return;
    }

    if (privateKeys.length === 0) {
      errorMessage = 'Please upload a private key file.';
      return;
    }

    const recipientList = parseRecipients();
    if (recipientList.length === 0) {
      errorMessage = 'Please enter at least one recipient address.';
      return;
    }

    if (!txCount || txCount < 1) {
      errorMessage = 'Please enter a transaction count per key.';
      return;
    }

    isSending = true;

    try {
      const accounts = privateKeys.map((key) => privateKeyToAccount(normalizeKey(key) as `0x${string}`));
      const accessList = parseAccessList();
      const totalTransactions = txCount * accounts.length;

      const tasks = Array.from({ length: totalTransactions }).map((_, idx) => {
        return async () => {
          const account = accounts[idx % accounts.length];
          const to = recipientList[idx % recipientList.length] as `0x${string}`;
          const client = createWalletClient({
            account,
            chain: mainnet,
            transport: http(rpcUrl),
          });

          const baseRequest = {
            account,
            to,
            value: parseEther(valueEth || '0'),
            data: dataHex ? (dataHex as `0x${string}`) : undefined,
            gas: gasLimit ? BigInt(gasLimit) : undefined,
          };

          let hash: `0x${string}`;

          if (transactionType === 'legacy') {
            hash = await client.sendTransaction({
              ...baseRequest,
              type: 'legacy',
              gasPrice: parseGwei(gasPriceGwei || '0'),
            });
          } else if (transactionType === 'eip2930') {
            hash = await client.sendTransaction({
              ...baseRequest,
              type: 'eip2930',
              gasPrice: parseGwei(gasPriceGwei || '0'),
              accessList,
            });
          } else {
            hash = await client.sendTransaction({
              ...baseRequest,
              type: 'eip1559',
              maxFeePerGas: parseGwei(maxFeePerGasGwei || '0'),
              maxPriorityFeePerGas: parseGwei(maxPriorityFeeGwei || '0'),
            });
          }

          await fetch('/api/transactions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              hash,
              account: account.address,
              recipient: to,
              rpcUrl,
            }),
          });

          addLog('success', `#${idx + 1} sent: ${hash}`);
          return hash;
        };
      });

      await runWithConcurrency(tasks, Math.max(1, concurrency));
      addLog('info', `Sent ${totalTransactions} transaction(s) across ${accounts.length} account(s).`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred.';
      addLog('error', message);
    } finally {
      isSending = false;
    }
  };

  const createSettingsPayload = () => ({
    rpcUrl,
    transactionType,
    gasLimit,
    gasPriceGwei,
    maxFeePerGasGwei,
    maxPriorityFeeGwei,
    accessListJson,
    valueEth,
    dataHex,
    txCount,
    concurrency,
    recipients,
  });

  const downloadSettings = () => {
    const payload = JSON.stringify(createSettingsPayload(), null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'eth-bombard-settings.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleSettingsUpload = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (!target.files || !target.files[0]) {
      return;
    }

    const file = target.files[0];
    const content = await file.text();
    try {
      const parsed = JSON.parse(content);
      rpcUrl = parsed.rpcUrl ?? '';
      transactionType = parsed.transactionType ?? 'eip1559';
      gasLimit = parsed.gasLimit ?? 21000;
      gasPriceGwei = parsed.gasPriceGwei ?? '25';
      maxFeePerGasGwei = parsed.maxFeePerGasGwei ?? '35';
      maxPriorityFeeGwei = parsed.maxPriorityFeeGwei ?? '2';
      accessListJson = parsed.accessListJson ?? '';
      valueEth = parsed.valueEth ?? '0.001';
      dataHex = parsed.dataHex ?? '';
      txCount = parsed.txCount ?? 1;
      concurrency = parsed.concurrency ?? 1;
      recipients = parsed.recipients ?? '';
      addLog('info', `Settings loaded from ${file.name}.`);
    } catch (error) {
      addLog('error', 'Settings file is not valid JSON.');
    }
  };
</script>

<main class="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 px-6 py-10">
  <div class="mx-auto flex w-full max-w-6xl flex-col gap-8">
    <header class="space-y-3">
      <p class="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">Ethereum Mainnet Stress Tool</p>
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-4xl font-semibold text-white">ETH Bombard</h1>
          <p class="max-w-2xl text-sm text-stone-300">
            Validate your RPC endpoint, keys, and recipients before sending large volumes of mainnet transactions. You can
            tune transaction types and gas parameters to match each testing scenario.
          </p>
        </div>
        <a
          href="/transactions"
          class="rounded-md border border-stone-700 bg-stone-900 px-4 py-2 text-sm font-semibold text-stone-100 transition hover:border-stone-500"
        >
          View Transactions
        </a>
      </div>
    </header>

    <div class="grid gap-6 lg:grid-cols-[2fr,1fr]">
      <Card className="space-y-6">
        <div class="grid gap-6 md:grid-cols-2">
          <div class="space-y-2">
            <Label>RPC URL</Label>
            <Input bind:value={rpcUrl} placeholder="https://mainnet.infura.io/v3/..." />
            <p class="text-xs text-stone-400">Enter your mainnet RPC endpoint.</p>
          </div>
          <div class="space-y-2">
            <Label>Transaction Type</Label>
            <Select bind:value={transactionType}>
              <option value="legacy">Legacy (Type 0)</option>
              <option value="eip1559">EIP-1559 (Type 2)</option>
              <option value="eip2930">EIP-2930 (Type 1)</option>
            </Select>
          </div>
          <div class="space-y-2">
            <Label>Transactions per Key</Label>
            <Input bind:value={txCount} type="number" min={1} step={1} />
          </div>
          <div class="space-y-2">
            <Label>Concurrency</Label>
            <Input bind:value={concurrency} type="number" min={1} step={1} />
            <p class="text-xs text-stone-400">Number of transactions to send in parallel.</p>
          </div>
          <div class="space-y-2">
            <Label>Value (ETH)</Label>
            <Input bind:value={valueEth} type="number" min={0} step={0.0001} />
          </div>
          <div class="space-y-2">
            <Label>Gas Limit</Label>
            <Input bind:value={gasLimit} type="number" min={21000} step={1} />
          </div>
        </div>

        <div class="grid gap-6 md:grid-cols-2">
          {#if transactionType === 'legacy' || transactionType === 'eip2930'}
            <div class="space-y-2">
              <Label>Gas Price (Gwei)</Label>
              <Input bind:value={gasPriceGwei} type="number" min={1} step={1} />
            </div>
          {:else}
            <div class="space-y-2">
              <Label>Max Fee Per Gas (Gwei)</Label>
              <Input bind:value={maxFeePerGasGwei} type="number" min={1} step={1} />
            </div>
            <div class="space-y-2">
              <Label>Max Priority Fee (Gwei)</Label>
              <Input bind:value={maxPriorityFeeGwei} type="number" min={1} step={1} />
            </div>
          {/if}
          {#if transactionType === 'eip2930'}
            <div class="space-y-2 md:col-span-2">
              <Label>Access List (JSON)</Label>
              <Textarea
                bind:value={accessListJson}
                placeholder={'[{"address":"0x...","storageKeys":["0x..."]}]'}
                rows={3}
              />
            </div>
          {/if}
        </div>

        <div class="space-y-2">
          <Label>Data (hex)</Label>
          <Input bind:value={dataHex} placeholder="0x... (optional)" />
        </div>

        <div class="space-y-2">
          <Label>Recipients</Label>
          <Textarea bind:value={recipients} placeholder="0xAddress1\n0xAddress2" rows={4} />
          <p class="text-xs text-stone-400">Separate addresses with new lines or commas.</p>
        </div>

        <div class="space-y-2">
          <Label>Private Keys File</Label>
          <Input type="file" on:change={handleKeyFile} />
          <p class="text-xs text-stone-400">
            Upload a JSON array or newline-delimited private key file. {#if keyFileName}Selected: {keyFileName}{/if}
          </p>
        </div>

        <div class="space-y-2">
          <Label>Settings</Label>
          <div class="flex flex-wrap gap-2">
            <Button type="button" className="bg-stone-700 text-stone-100 hover:bg-stone-600" on:click={downloadSettings}>
              Download Settings
            </Button>
            <label class="inline-flex cursor-pointer items-center gap-2 rounded-md bg-stone-800 px-3 py-2 text-sm font-semibold text-stone-100 hover:bg-stone-700">
              Upload Settings
              <input class="hidden" type="file" accept="application/json" on:change={handleSettingsUpload} />
            </label>
          </div>
        </div>

        {#if errorMessage}
          <div class="rounded-md border border-rose-500/40 bg-rose-950/40 px-4 py-2 text-sm text-rose-200">
            {errorMessage}
          </div>
        {/if}

        <div class="flex items-center gap-3">
          <Button type="button" disabled={isSending} on:click={sendTransactions}>
            {isSending ? 'Sending...' : 'Send Transactions'}
          </Button>
          <Button type="button" className="bg-stone-700 text-stone-100 hover:bg-stone-600" on:click={resetLogs}>
            Reset Logs
          </Button>
        </div>
      </Card>

      <Card className="space-y-4">
        <div class="space-y-2">
          <h2 class="text-lg font-semibold">Send Logs</h2>
          <p class="text-xs text-stone-400">Track each transaction hash and any errors.</p>
        </div>
        <div class="space-y-3 text-sm">
          {#if logEntries.length === 0}
            <p class="text-stone-400">No logs yet.</p>
          {:else}
            {#each logEntries as entry (entry.id)}
              <div
                class={`rounded-md border px-3 py-2 ${
                  entry.status === 'success'
                    ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-100'
                    : entry.status === 'error'
                    ? 'border-rose-500/40 bg-rose-950/40 text-rose-100'
                    : 'border-stone-800 bg-stone-900/70 text-stone-200'
                }`}
              >
                {entry.message}
              </div>
            {/each}
          {/if}
        </div>
      </Card>
    </div>
  </div>
</main>
