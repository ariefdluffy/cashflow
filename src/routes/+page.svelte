<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Header from '$lib/components/Header.svelte';
	import StatCard from '$lib/components/StatCard.svelte';
	import FilterBar from '$lib/components/FilterBar.svelte';
	import CashChart from '$lib/components/CashChart.svelte';
	import CategoryChart from '$lib/components/CategoryChart.svelte';
	import TransactionTable from '$lib/components/TransactionTable.svelte';
	import ActivityLog from '$lib/components/ActivityLog.svelte';
	import DataInsights from '$lib/components/DataInsights.svelte';
	import TopCategories from '$lib/components/TopCategories.svelte';
	import {
		transactions, loading, lastSync, connected,
		filteredTransactions, stats, chartData, categoryData,
		activityLog, forecast, burnRate, topCategories, monthlyTrend,
		incomeCategoryData, categoryComparison, runningBalance
	} from '$lib/stores/stats';
	import { filterStore } from '$lib/stores/filters';
	import { fetchTransactions } from '$lib/api';
	import { formatRp } from '$lib/utils/format';

	let { data } = $props();

	// Kunci filter user ke user yang login
	$effect(() => {
		if (data.user) {
			filterStore.update((f) => (f.user === data.user ? f : { ...f, user: data.user }));
		}
	});

	let sseConn: EventSource | null = null;

	onMount(async () => {
		await loadData();
		connectSSE();
	});

	onDestroy(() => {
		sseConn?.close();
	});

	async function loadData(showLoader = true) {
		if (showLoader) loading.set(true);
		try {
			const result = await fetchTransactions({ pageSize: 500 });
			transactions.set(result.data);
			lastSync.set(new Date().toISOString());
			connected.set(true);
		} catch (err) {
			console.error('Failed to load data:', err);
			connected.set(false);
		} finally {
			if (showLoader) loading.set(false);
		}
	}

	function connectSSE() {
		sseConn = new EventSource('/api/realtime');

		sseConn.onopen = () => {
			connected.set(true);
			console.log('[SSE] Terhubung — auto-sync aktif');
		};

		sseConn.onmessage = async (event) => {
			try {
				const data = JSON.parse(event.data);
				if (data.type === 'update' || data.type === 'refresh') {
					console.log('[SSE] Perubahan terdeteksi, re-fetch data...');
					await loadData(false);
				}
			} catch { /* abaikan parse error */ }
		};

		// EventSource auto-reconnect bawaan browser akan handle putus koneksi
		sseConn.onerror = () => {
			connected.set(false);
			console.warn('[SSE] Koneksi terputus — auto-reconnect browser mencoba...');
		};
	}
</script>

<Header user={data.user} />

<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
	<FilterBar />

	{#if $loading}
		<div class="flex items-center justify-center py-20">
			<div class="text-center space-y-4">
				<div class="w-10 h-10 border-4 border-(--color-primary) border-t-transparent rounded-full animate-spin mx-auto"></div>
				<p class="text-slate-500 dark:text-slate-400 text-sm">Memuat data...</p>
			</div>
		</div>
	{:else}
		<!-- Stats Cards -->
		<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
			<StatCard title="Total Pemasukan" value={formatRp($stats.totalIncome)} icon="📈" color="success" trend="up" trendValue="Pemasukan" />
			<StatCard title="Total Pengeluaran" value={formatRp($stats.totalExpense)} icon="📉" color="danger" trend="down" trendValue="Pengeluaran" />
			<StatCard title="Saldo Bersih" value={formatRp($stats.balance)} icon="💰" color={$stats.balance >= 0 ? 'success' : 'danger'} trend={$stats.balance >= 0 ? 'up' : 'down'} trendValue="Saldo" />
			<StatCard title="Saldo Berjalan" value={formatRp($runningBalance)} icon="💸" color="info" trend="neutral" trendValue="Akumulasi" />
			<StatCard title="Jumlah Transaksi" value={$stats.totalTransactions.toLocaleString('id-ID')} icon="📋" color="primary" />
			<StatCard title="Rata-rata Harian" value={formatRp($stats.averageDaily)} icon="📊" color="info" />
			<StatCard title="Pengeluaran Terbesar" value={formatRp($stats.largestExpense)} icon="🔥" color="warning" />
		</div>

		<!-- Keterangan Saldo -->
		<div class="card bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/40 dark:to-slate-800/10 border-(--border-color)">
			<div class="flex items-center gap-3">
				<span class="text-2xl">📝</span>
				<div class="space-y-0.5">
					<p class="text-sm font-medium text-slate-600 dark:text-slate-300">Keterangan Saldo</p>
					<p class="text-lg font-bold text-(--text-color)">
						Saldo berjalan {formatRp($runningBalance)}
						<span class={$runningBalance >= 0 ? 'text-(--color-success)' : 'text-(--color-danger)'}>
							({$runningBalance >= 0 ? 'Surplus' : 'Defisit'})
						</span>
					</p>
					<p class="text-xs text-slate-500 dark:text-slate-400">
						Pemasukan {formatRp($stats.totalIncome)} − Pengeluaran {formatRp($stats.totalExpense)} = {formatRp($stats.balance)}
					</p>
				</div>
			</div>
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
			<CashChart data={$chartData} title="Arus Kas Harian" type="line" height={320} />
			<CategoryChart data={$categoryData} title="Pengeluaran per Kategori" height={320} />
		</div>

		<!-- Monthly Trend -->
		{#if $monthlyTrend.length > 0}
			{@const trendData = $monthlyTrend.map(m => ({
				label: new Date(m.month + '-01').toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }),
				income: m.income,
				expense: m.expense
			}))}
			<CashChart data={trendData} title="Tren Bulanan" type="bar" height={320} showNet={true} />
		{/if}

		<!-- Data Insights (gantikan Forecast) -->
		{#if $incomeCategoryData.length > 0 || $categoryComparison.length > 0 || $monthlyTrend.length > 0}
			<DataInsights />
		{/if}

		<!-- Activity Log + Table + Top Categories -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<div class="lg:col-span-2">
				<TransactionTable data={$filteredTransactions} />
			</div>
			<div class="space-y-6">
				<ActivityLog data={$activityLog} />
				<TopCategories data={$topCategories} />
			</div>
		</div>
	{/if}
</main>

<footer class="text-center py-6 text-xs text-slate-400 dark:text-slate-500">
	Cash Flow Dashboard &copy; {new Date().getFullYear()} &mdash; Data dari Google Sheets
</footer>
