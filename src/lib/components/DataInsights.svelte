<script lang="ts">
	import { formatRp } from '$lib/utils/format';
	import { incomeCategoryData, categoryComparison, monthlyTrend } from '$lib/stores/stats';

	let monthlyRecap = $derived(
		$monthlyTrend.map((m, i, arr) => {
			const prevBalance = i > 0 ? arr.slice(0, i).reduce((s, v) => s + (v.income - v.expense), 0) : 0;
			return {
				month: m.month,
				income: m.income,
				expense: m.expense,
				net: m.income - m.expense,
				runningBalance: prevBalance + (m.income - m.expense)
			};
		})
		.toReversed()
	);
</script>

<div class="card">
	<h3 class="text-sm font-semibold text-(--text-color) mb-4">📊 Data Insights</h3>

	<div class="space-y-6">
		<!-- 1. Pemasukan per Kategori -->
		{#if $incomeCategoryData.length > 0}
			<div>
				<h4 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Pemasukan per Kategori</h4>
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-(--border-color)">
								<th class="px-3 py-2 text-left text-slate-500">Kategori</th>
								<th class="px-3 py-2 text-right text-slate-500">Total</th>
								<th class="px-3 py-2 text-right text-slate-500">%</th>
							</tr>
						</thead>
						<tbody>
							{#each $incomeCategoryData as cat}
								<tr class="border-b border-(--border-color)/50">
									<td class="px-3 py-2 text-xs">{cat.kategori}</td>
									<td class="px-3 py-2 text-right font-medium tabular-nums text-(--color-success)">{formatRp(cat.total)}</td>
									<td class="px-3 py-2 text-right text-slate-500">{cat.persentase}%</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}

		<!-- 2. Perbandingan per Kategori -->
		{#if $categoryComparison.length > 0}
			<div>
				<h4 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Perbandingan per Kategori</h4>
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-(--border-color)">
								<th class="px-3 py-2 text-left text-slate-500">Kategori</th>
								<th class="px-3 py-2 text-right text-slate-500">Pemasukan</th>
								<th class="px-3 py-2 text-right text-slate-500">Pengeluaran</th>
								<th class="px-3 py-2 text-right text-slate-500">Selisih</th>
							</tr>
						</thead>
						<tbody>
							{#each $categoryComparison as cat}
								<tr class="border-b border-(--border-color)/50">
									<td class="px-3 py-2 text-xs">{cat.kategori}</td>
									<td class="px-3 py-2 text-right font-medium tabular-nums text-(--color-success)">{formatRp(cat.income)}</td>
									<td class="px-3 py-2 text-right font-medium tabular-nums text-(--color-danger)">{cat.expense > 0 ? formatRp(cat.expense) : '-'}</td>
									<td class="px-3 py-2 text-right font-medium tabular-nums {cat.income - cat.expense >= 0 ? 'text-(--color-success)' : 'text-(--color-danger)'}">{formatRp(cat.income - cat.expense)}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}

		<!-- 3. Rekap Bulanan -->
		{#if monthlyRecap.length > 0}
			<div>
				<h4 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Rekap Bulanan</h4>
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-(--border-color)">
								<th class="px-3 py-2 text-left text-slate-500">Bulan</th>
								<th class="px-3 py-2 text-right text-slate-500">Pemasukan</th>
								<th class="px-3 py-2 text-right text-slate-500">Pengeluaran</th>
								<th class="px-3 py-2 text-right text-slate-500">Bersih</th>
								<th class="px-3 py-2 text-right text-slate-500">Saldo Akumulasi</th>
							</tr>
						</thead>
						<tbody>
							{#each monthlyRecap as m}
								<tr class="border-b border-(--border-color)/50">
									<td class="px-3 py-2 text-xs font-medium">{new Date(m.month + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</td>
									<td class="px-3 py-2 text-right font-medium tabular-nums text-(--color-success)">{formatRp(m.income)}</td>
									<td class="px-3 py-2 text-right font-medium tabular-nums text-(--color-danger)">{formatRp(m.expense)}</td>
									<td class="px-3 py-2 text-right font-medium tabular-nums {m.net >= 0 ? 'text-(--color-success)' : 'text-(--color-danger)'}">{formatRp(m.net)}</td>
									<td class="px-3 py-2 text-right font-medium tabular-nums {m.runningBalance >= 0 ? 'text-(--color-success)' : 'text-(--color-danger)'}">{formatRp(m.runningBalance)}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}

		{#if $incomeCategoryData.length === 0 && $categoryComparison.length === 0 && monthlyRecap.length === 0}
			<p class="text-sm text-slate-400 text-center py-4">Belum ada data untuk ditampilkan</p>
		{/if}
	</div>
</div>
