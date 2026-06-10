<script lang="ts">
	import type { ForecastData } from '$lib/types';
	import { formatRp, formatTanggalPanjang } from '$lib/utils/format';

	interface Props {
		data: ForecastData[];
	}

	let { data }: Props = $props();

	let page = $state(1);
	let pageSize = $state(10);
	let totalPages = $derived(Math.ceil(data.length / pageSize));
	let paged = $derived(data.slice((page - 1) * pageSize, page * pageSize));
</script>

<div class="card">
	<h3 class="text-sm font-semibold text-(--text-color) mb-4">Forecast 30 Hari</h3>
	<div class="overflow-x-auto">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b border-(--border-color)">
					<th class="px-3 py-2 text-left text-slate-500">Tanggal</th>
					<th class="px-3 py-2 text-right text-slate-500">Prediksi Saldo</th>
					<th class="px-3 py-2 text-right text-slate-500">Optimis</th>
					<th class="px-3 py-2 text-right text-slate-500">Pessimis</th>
				</tr>
			</thead>
			<tbody>
				{#each paged as f}
					<tr class="border-b border-(--border-color)/50">
						<td class="px-3 py-2 text-xs">{formatTanggalPanjang(f.date)}</td>
						<td class="px-3 py-2 text-right font-medium tabular-nums {f.predictedBalance >= 0 ? 'text-(--color-success)' : 'text-(--color-danger)'}">{formatRp(f.predictedBalance)}</td>
						<td class="px-3 py-2 text-right text-(--color-success)">{formatRp(f.optimistic)}</td>
						<td class="px-3 py-2 text-right text-(--color-danger)">{formatRp(f.pessimistic)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	{#if totalPages > 1}
		<div class="flex items-center justify-between mt-3 pt-3 border-t border-(--border-color)">
			<p class="text-xs text-slate-500">{pageSize} per page</p>
			<div class="flex items-center gap-1">
				<button onclick={() => page = Math.max(1, page - 1)} disabled={page <= 1} class="px-2 py-1 text-xs rounded-lg border border-(--border-color) disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:cursor-not-allowed">‹</button>
				{#each Array.from({ length: totalPages }, (_, i) => i + 1) as pg}
					<button onclick={() => page = pg} class="px-2 py-1 text-xs rounded-lg border transition-colors cursor-pointer {pg === page ? 'bg-(--color-primary) text-white border-(--color-primary)' : 'border-(--border-color) hover:bg-slate-100 dark:hover:bg-slate-700'}">{pg}</button>
				{/each}
				<button onclick={() => page = Math.min(totalPages, page + 1)} disabled={page >= totalPages} class="px-2 py-1 text-xs rounded-lg border border-(--border-color) disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:cursor-not-allowed">›</button>
			</div>
		</div>
	{/if}
</div>
