<script lang="ts">
	import type { CategoryData } from '$lib/types';
	import { formatRp } from '$lib/utils/format';

	interface Props {
		data: CategoryData[];
	}

	let { data }: Props = $props();

	const colors = ['#2563EB', '#22C55E', '#EF4444', '#F59E0B', '#8B5CF6'];
</script>

{#if data.length > 0}
	<div class="card">
		<h3 class="text-sm font-semibold text-(--text-color) mb-4">Top Kategori Pengeluaran</h3>
		<div class="space-y-3">
			{#each data as cat, i}
				<div>
					<div class="flex items-center justify-between text-sm mb-1">
						<div class="flex items-center gap-2">
							<span class="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white" style="background: {colors[i]}">
								{i + 1}
							</span>
							<span class="text-slate-700 dark:text-slate-300">{cat.kategori}</span>
						</div>
						<span class="font-medium tabular-nums">{formatRp(cat.total)}</span>
					</div>
					<div class="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
						<div class="h-full rounded-full transition-all duration-500" style="width: {cat.persentase}%; background: {colors[i]}"></div>
					</div>
					<p class="text-xs text-slate-400 mt-0.5">{cat.persentase}% dari total pengeluaran</p>
				</div>
			{/each}
		</div>
	</div>
{/if}
