<script lang="ts">
	import { onMount } from 'svelte';
	import Header from '$lib/components/Header.svelte';
	import StatCard from '$lib/components/StatCard.svelte';
	import FilterBar from '$lib/components/FilterBar.svelte';
	import CashChart from '$lib/components/CashChart.svelte';
	import CategoryChart from '$lib/components/CategoryChart.svelte';
	import TransactionTable from '$lib/components/TransactionTable.svelte';
	import ActivityLog from '$lib/components/ActivityLog.svelte';
	import {
		transactions, loading, lastSync, connected,
		filteredTransactions, stats, chartData, categoryData,
		activityLog, forecast, burnRate, topCategories, monthlyTrend
	} from '$lib/stores/stats';
	import { fetchTransactions } from '$lib/api';

	let forecastPage = $state(1);
	let forecastPageSize = $state(10);
	let forecastTotalPages = $derived(Math.ceil($forecast.length / forecastPageSize));
	let forecastPaged = $derived($forecast.slice((forecastPage - 1) * forecastPageSize, forecastPage * forecastPageSize));

	function formatRp(n: number): string {
		return 'Rp ' + n.toLocaleString('id-ID');
	}

	onMount(async () => {
		loading.set(true);
		try {
			const result = await fetchTransactions({ pageSize: 500 });
			transactions.set(result.data);
			lastSync.set(new Date().toISOString());
			connected.set(true);
		} catch (err) {
			console.error('Failed to load data:', err);
			connected.set(false);
		} finally {
			loading.set(false);
		}
	});
</script>

<Header />

<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
	<!-- Filter -->
	<FilterBar />

	<!-- Loading State -->
	{#if $loading}
		<div class="flex items-center justify-center py-20">
			<div class="text-center space-y-4">
				<div class="w-10 h-10 border-4 border-(--color-primary) border-t-transparent rounded-full animate-spin mx-auto"></div>
				<p class="text-slate-500 dark:text-slate-400 text-sm">Memuat data...</p>
			</div>
		</div>
	{:else}
		<!-- Stats Cards -->
		<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
			<StatCard
				title="Total Pemasukan"
				value={formatRp($stats.totalIncome)}
				icon="📈"
				color="success"
				trend="up"
				trendValue="Pemasukan"
			/>
			<StatCard
				title="Total Pengeluaran"
				value={formatRp($stats.totalExpense)}
				icon="📉"
				color="danger"
				trend="down"
				trendValue="Pengeluaran"
			/>
			<StatCard
				title="Saldo Bersih"
				value={formatRp($stats.balance)}
				icon="💰"
				color={$stats.balance >= 0 ? 'success' : 'danger'}
				trend={$stats.balance >= 0 ? 'up' : 'down'}
				trendValue="Saldo"
			/>
			<StatCard
				title="Jumlah Transaksi"
				value={$stats.totalTransactions.toLocaleString('id-ID')}
				icon="📋"
				color="primary"
			/>
			<StatCard
				title="Rata-rata Harian"
				value={formatRp($stats.averageDaily)}
				icon="📊"
				color="info"
			/>
			<StatCard
				title="Pengeluaran Terbesar"
				value={formatRp($stats.largestExpense)}
				icon="🔥"
				color="warning"
			/>
		</div>

		<!-- Burn Rate -->
		{#if $burnRate.daysRemaining > 0}
			<div class="card bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
				<div class="flex items-center gap-3">
					<span class="text-2xl">⏳</span>
					<div>
						<p class="text-sm font-medium text-amber-800 dark:text-amber-200">Cash Burn Rate</p>
						<p class="text-lg font-bold text-amber-900 dark:text-amber-100">
							Jika tidak ada pemasukan lagi, saldo cukup untuk {$burnRate.daysRemaining} hari
						</p>
						<p class="text-xs text-amber-600 dark:text-amber-400 mt-1">
							Rata-rata pengeluaran harian: {formatRp($burnRate.averageDailyExpense)}
						</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- Charts -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<CashChart
				data={$chartData}
				title="Arus Kas Harian"
				type="line"
				height={320}
			/>
			<CategoryChart
				data={$categoryData}
				title="Pengeluaran per Kategori"
				height={320}
			/>
		</div>

		<!-- Monthly Trend -->
		{#if $monthlyTrend.length > 0}
			<CashChart
				data={$monthlyTrend.map(m => ({
					label: m.month,
					income: m.income,
					expense: m.expense
				}))}
				title="Tren Bulanan"
				type="bar"
				height={280}
			/>
		{/if}

		<!-- Forecast -->
		{#if $forecast.length > 0}
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
							{#each forecastPaged as f}
								<tr class="border-b border-(--border-color)/50">
									<td class="px-3 py-2 text-xs">{['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'][new Date(f.date).getDay()]}, {f.date}</td>
									<td class="px-3 py-2 text-right font-medium tabular-nums {
										f.predictedBalance >= 0 ? 'text-(--color-success)' : 'text-(--color-danger)'
									}">{formatRp(f.predictedBalance)}</td>
									<td class="px-3 py-2 text-right text-(--color-success)">{formatRp(f.optimistic)}</td>
									<td class="px-3 py-2 text-right text-(--color-danger)">{formatRp(f.pessimistic)}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
				{#if forecastTotalPages > 1}
					<div class="flex items-center justify-between mt-3 pt-3 border-t border-(--border-color)">
						<p class="text-xs text-slate-500">{forecastPageSize} per page</p>
						<div class="flex items-center gap-1">
							<button onclick={() => forecastPage = Math.max(1, forecastPage - 1)} disabled={forecastPage <= 1} class="px-2 py-1 text-xs rounded-lg border border-(--border-color) disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:cursor-not-allowed">&#8249;</button>
							{#each Array.from({ length: forecastTotalPages }, (_, i) => i + 1) as pg}
								<button onclick={() => forecastPage = pg} class="px-2 py-1 text-xs rounded-lg border transition-colors cursor-pointer {pg === forecastPage ? 'bg-(--color-primary) text-white border-(--color-primary)' : 'border-(--border-color) hover:bg-slate-100 dark:hover:bg-slate-700'}">{pg}</button>
							{/each}
							<button onclick={() => forecastPage = Math.min(forecastTotalPages, forecastPage + 1)} disabled={forecastPage >= forecastTotalPages} class="px-2 py-1 text-xs rounded-lg border border-(--border-color) disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:cursor-not-allowed">&#8250;</button>
						</div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Activity Log + Table -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<div class="lg:col-span-2">
				<TransactionTable data={$filteredTransactions} />
			</div>
			<div class="space-y-6">
				<ActivityLog data={$activityLog} />

				<!-- Top Categories -->
				{#if $topCategories.length > 0}
					<div class="card">
						<h3 class="text-sm font-semibold text-(--text-color) mb-4">Top Kategori Pengeluaran</h3>
						<div class="space-y-3">
							{#each $topCategories as cat, i}
								<div>
									<div class="flex items-center justify-between text-sm mb-1">
										<div class="flex items-center gap-2">
											<span class="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white" style="background: {['#2563EB', '#22C55E', '#EF4444', '#F59E0B', '#8B5CF6'][i]}">
												{i + 1}
											</span>
											<span class="text-slate-700 dark:text-slate-300">{cat.kategori}</span>
										</div>
										<span class="font-medium tabular-nums">{formatRp(cat.total)}</span>
									</div>
									<div class="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
										<div
											class="h-full rounded-full transition-all duration-500"
											style="width: {cat.persentase}%; background: {['#2563EB', '#22C55E', '#EF4444', '#F59E0B', '#8B5CF6'][i]}"
										></div>
									</div>
									<p class="text-xs text-slate-400 mt-0.5">{cat.persentase}% dari total pengeluaran</p>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</main>

<footer class="text-center py-6 text-xs text-slate-400 dark:text-slate-500">
	Cash Flow Dashboard &copy; {new Date().getFullYear()} &mdash; Data dari Google Sheets
</footer>
