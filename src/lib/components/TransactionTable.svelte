<script lang="ts">
	import type { Transaksi } from '$lib/types';

	function formatTanggal(tgl: string): string {
		const hari = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
		const parts = tgl.split('-');
		if (parts.length !== 3) return tgl;
		const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
		return `${hari[d.getDay()]}, ${parts[2]}/${parts[1]}/${parts[0]}`;
	}

	interface Props {
		data: Transaksi[];
	}

	let { data }: Props = $props();

	let searchQuery = $state('');
	let sortColumn = $state<string>('tanggal');
	let sortDirection = $state<'asc' | 'desc'>('desc');
	let currentPage = $state(1);
	const pageSize = $state(20);

	let filtered = $derived.by(() => {
		if (!searchQuery) return data;
		const q = searchQuery.toLowerCase();
		return data.filter(t =>
			t.kategori.toLowerCase().includes(q) ||
			t.keterangan.toLowerCase().includes(q) ||
			t.jenis.toLowerCase().includes(q) ||
			t.nominal.toString().includes(q)
		);
	});

	let sorted = $derived.by(() => {
		const arr = [...filtered];
		arr.sort((a, b) => {
			const aVal = a[sortColumn as keyof Transaksi] ?? '';
			const bVal = b[sortColumn as keyof Transaksi] ?? '';
			let cmp: number;
			if (typeof aVal === 'string' && typeof bVal === 'string') {
				cmp = aVal.localeCompare(bVal);
			} else {
				cmp = (aVal as number) - (bVal as number);
			}
			return sortDirection === 'asc' ? cmp : -cmp;
		});
		return arr;
	});

	let totalPages = $derived(Math.max(1, Math.ceil(sorted.length / pageSize)));
	let paged = $derived(sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize));

	function toggleSort(col: string) {
		if (sortColumn === col) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortColumn = col;
			sortDirection = 'desc';
		}
	}

	function exportCSV() {
		const headers = ['Tanggal', 'Kategori', 'Keterangan', 'Jenis', 'Nominal'];
		const rows = sorted.map(t => [
			t.tanggal, t.kategori, t.keterangan, t.jenis, t.nominal.toString()
		]);
		const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
		const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function formatRp(n: number): string {
		return 'Rp ' + n.toLocaleString('id-ID');
	}
</script>

<div class="card">
	<!-- Toolbar -->
	<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
		<h3 class="text-sm font-semibold text-(--text-color)">Transaksi ({sorted.length})</h3>
		<div class="flex items-center gap-2 w-full sm:w-auto">
			<div class="relative flex-1 sm:flex-none">
				<input
					type="text"
					placeholder="Cari transaksi..."
					bind:value={searchQuery}
					class="w-full sm:w-64 px-3 py-1.5 text-sm rounded-lg border border-(--border-color) bg-(--card-bg) text-(--text-color) placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-(--color-primary)/50"
				/>
			</div>
			<button
				onclick={exportCSV}
				class="px-3 py-1.5 text-sm font-medium rounded-lg bg-(--color-primary) text-white hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap"
			>
				Export CSV
			</button>
		</div>
	</div>

	<!-- Table -->
	<div class="overflow-x-auto -mx-4 sm:-mx-6">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b border-(--border-color)">
					<th
						onclick={() => toggleSort('tanggal')}
						class="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400 cursor-pointer hover:text-(--text-color) transition-colors whitespace-nowrap"
					>
						Tanggal {sortColumn === 'tanggal' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
					</th>
					<th
						onclick={() => toggleSort('kategori')}
						class="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400 cursor-pointer hover:text-(--text-color) transition-colors whitespace-nowrap"
					>
						Kategori {sortColumn === 'kategori' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
					</th>
					<th class="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">Keterangan</th>
					<th
						onclick={() => toggleSort('jenis')}
						class="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400 cursor-pointer hover:text-(--text-color) transition-colors whitespace-nowrap"
					>
						Jenis {sortColumn === 'jenis' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
					</th>
					<th
						onclick={() => toggleSort('nominal')}
						class="px-4 py-3 text-right font-medium text-slate-500 dark:text-slate-400 cursor-pointer hover:text-(--text-color) transition-colors whitespace-nowrap"
					>
						Nominal {sortColumn === 'nominal' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
					</th>
				</tr>
			</thead>
			<tbody>
				{#each paged as tx (tx.id)}
					<tr class="border-b border-(--border-color) hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
						<td class="px-4 py-3 whitespace-nowrap text-xs">{formatTanggal(tx.tanggal)}</td>
						<td class="px-4 py-3">
							<span class="px-2 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
								{tx.kategori}
							</span>
						</td>
						<td class="px-4 py-3 text-slate-600 dark:text-slate-400">{tx.keterangan}</td>
						<td class="px-4 py-3">
							<span class="inline-flex items-center gap-1 text-xs font-medium {
								tx.jenis === 'Masuk' ? 'text-(--color-success)' : 'text-(--color-danger)'
							}">
								<span class="w-1.5 h-1.5 rounded-full {
									tx.jenis === 'Masuk' ? 'bg-(--color-success)' : 'bg-(--color-danger)'
								}"></span>
								{tx.jenis}
							</span>
						</td>
						<td class="px-4 py-3 text-right font-medium tabular-nums {
							tx.jenis === 'Masuk' ? 'text-(--color-success)' : 'text-(--color-danger)'
						}">
							{formatRp(tx.nominal)}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<!-- Pagination -->
	{#if totalPages > 1}
		<div class="flex flex-wrap items-center justify-between gap-2 mt-4 pt-4 border-t border-(--border-color)">
			<p class="text-sm text-slate-500">{pageSize} per page</p>
			<div class="flex items-center gap-1">
				<button
					onclick={() => currentPage = 1}
					disabled={currentPage <= 1}
					class="px-2 py-1 text-xs rounded-lg border border-(--border-color) disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:cursor-not-allowed"
				>&#171;</button>
				<button
					onclick={() => currentPage = Math.max(1, currentPage - 1)}
					disabled={currentPage <= 1}
					class="px-2 py-1 text-xs rounded-lg border border-(--border-color) disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:cursor-not-allowed"
				>&#8249;</button>
				{#each Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
					const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
					return start + i;
				}) as pg}
					<button
						onclick={() => currentPage = pg}
						class="px-2.5 py-1 text-xs rounded-lg border transition-colors cursor-pointer {pg === currentPage ? 'bg-(--color-primary) text-white border-(--color-primary)' : 'border-(--border-color) hover:bg-slate-100 dark:hover:bg-slate-700'}"
					>{pg}</button>
				{/each}
				<button
					onclick={() => currentPage = Math.min(totalPages, currentPage + 1)}
					disabled={currentPage >= totalPages}
					class="px-2 py-1 text-xs rounded-lg border border-(--border-color) disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:cursor-not-allowed"
				>&#8250;</button>
				<button
					onclick={() => currentPage = totalPages}
					disabled={currentPage >= totalPages}
					class="px-2 py-1 text-xs rounded-lg border border-(--border-color) disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:cursor-not-allowed"
				>&#187;</button>
			</div>
		</div>
	{/if}
</div>
