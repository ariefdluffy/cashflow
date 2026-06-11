<script lang="ts">
	import type { ActivityLog } from '$lib/types';
	import { formatRp } from '$lib/utils/format';

	interface Props {
		data: ActivityLog[];
	}

	let { data }: Props = $props();
</script>

<div class="card">
	<h3 class="text-sm font-semibold text-(--text-color) mb-4">Aktivitas Terbaru</h3>
	<div class="space-y-2 max-h-[400px] overflow-y-auto pr-1">
		{#each data as log, i}
			<div class="flex items-start gap-3 py-2 border-b border-(--border-color)/50 last:border-0">
				<div class="flex-shrink-0 w-10 text-center">
					<span class="text-xs font-medium text-slate-400">{log.time}</span>
				</div>
				<div class="flex-1 min-w-0">
					<p class="text-sm text-slate-600 dark:text-slate-300 truncate">{log.keterangan}</p>
					<p class="text-xs text-slate-400">{log.jenis === 'Masuk' ? 'Pemasukan' : 'Pengeluaran'}</p>
				</div>
				<div class="flex-shrink-0 text-right">
					<span class="text-sm font-medium tabular-nums {
						log.jenis === 'Masuk' ? 'text-(--color-success)' : 'text-(--color-danger)'
					}">
						{log.jenis === 'Masuk' ? '+' : '-'}{formatRp(log.nominal)}
					</span>
				</div>
			</div>
		{/each}
	</div>
</div>
