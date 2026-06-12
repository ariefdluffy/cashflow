import { writable, derived } from 'svelte/store';
import type { Transaksi, DashboardStats, ChartDataPoint, CategoryData, ActivityLog, ForecastData, BurnRateInfo } from '$lib/types';
import { filterStore, getDateRange } from './filters';

export const transactions = writable<Transaksi[]>([]);
export const loading = writable<boolean>(true);
export const lastSync = writable<string>('');
export const connected = writable<boolean>(false);

// Derived: filtered transactions based on filterStore, sorted by tanggal desc (terbaru di atas)
export const filteredTransactions = derived(
	[transactions, filterStore],
	([$transactions, $filterStore]) => {
		const { startDate, endDate } = $filterStore.preset !== 'custom'
			? getDateRange($filterStore.preset)
			: { startDate: $filterStore.startDate || '', endDate: $filterStore.endDate || '' };

		let result = $transactions;

		if (startDate || endDate) {
			result = result.filter(t => {
				if (startDate && t.tanggal < startDate) return false;
				if (endDate && t.tanggal > endDate) return false;
				return true;
			});
		}

		// Sort by tanggal desc (terbaru di atas) biar konsisten
		return [...result].sort((a, b) => a.tanggal < b.tanggal ? 1 : a.tanggal > b.tanggal ? -1 : 0);
	}
);

// Derived: dashboard stats
export const stats = derived(
	filteredTransactions,
	($tx) => {
		const income = $tx.filter(t => t.jenis === 'Masuk');
		const expense = $tx.filter(t => t.jenis === 'Keluar');

		const totalIncome = income.reduce((sum, t) => sum + t.nominal, 0);
		const totalExpense = expense.reduce((sum, t) => sum + t.nominal, 0);
		const largestExpense = expense.length > 0
			? Math.max(...expense.map(t => t.nominal))
			: 0;

		// Rata-rata harian bersih (saldo / jumlah hari)
		const dates = [...new Set($tx.map(t => t.tanggal))].sort();
		const dayCount = dates.length || 1;
		const averageDaily = Math.round((totalIncome - totalExpense) / dayCount);

		return {
			totalIncome,
			totalExpense,
			balance: totalIncome - totalExpense,
			totalTransactions: $tx.length,
			averageDaily,
			largestExpense
		} satisfies DashboardStats;
	}
);

// Derived: chart data (line chart)
export const chartData = derived(
	filteredTransactions,
	($tx) => {
		const grouped = new Map<string, { income: number; expense: number }>();
		const sorted = [...$tx].sort((a, b) => a.tanggal.localeCompare(b.tanggal));

		for (const t of sorted) {
			const existing = grouped.get(t.tanggal) || { income: 0, expense: 0 };
			if (t.jenis === 'Masuk') {
				existing.income += t.nominal;
			} else {
				existing.expense += t.nominal;
			}
			grouped.set(t.tanggal, existing);
		}

		return Array.from(grouped.entries()).map(([label, val]) => ({
			label,
			income: val.income,
			expense: val.expense
		})) satisfies ChartDataPoint[];
	}
);

// Derived: category breakdown (donut chart)
export const categoryData = derived(
	filteredTransactions,
	($tx) => {
		const expense = $tx.filter(t => t.jenis === 'Keluar');
		const grouped = new Map<string, number>();
		let total = 0;

		for (const t of expense) {
			grouped.set(t.kategori, (grouped.get(t.kategori) || 0) + t.nominal);
			total += t.nominal;
		}

		return Array.from(grouped.entries())
			.map(([kategori, totalKategori]) => ({
				kategori,
				total: totalKategori,
				persentase: total > 0 ? Math.round((totalKategori / total) * 100) : 0
			}))
			.sort((a, b) => b.total - a.total) satisfies CategoryData[];
	}
);

// Derived: activity log (pake ALL transaksi biar log gak ilang pas filter berubah)
export const activityLog = derived(
	transactions,
	($tx) => {
		return [...$tx]
			.sort((a, b) => b.timestamp - a.timestamp)
			.slice(0, 50)
			.map(t => ({
				time: new Date(t.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
				jenis: t.jenis,
				nominal: t.nominal,
				keterangan: t.keterangan
			})) satisfies ActivityLog[];
	}
);

// Derived: forecast 30 hari (pake ALL transaksi = prediksi lebih akurat)
export const forecast = derived(
	transactions,
	($tx) => {
		const sorted = [...$tx].sort((a, b) => a.timestamp - b.timestamp);
		if (sorted.length < 7) return [] as ForecastData[];

		// Calculate average daily net
		const days = [...new Set(sorted.map(t => t.tanggal))].sort();
		const dailyNet = days.map(day => {
			const dayTx = sorted.filter(t => t.tanggal === day);
			const income = dayTx.filter(t => t.jenis === 'Masuk').reduce((s, t) => s + t.nominal, 0);
			const expense = dayTx.filter(t => t.jenis === 'Keluar').reduce((s, t) => s + t.nominal, 0);
			return income - expense;
		});

		const avgNet = Math.round(dailyNet.reduce((s, v) => s + v, 0) / dailyNet.length);
		const lastBalance = sorted.filter(t => t.jenis === 'Masuk').reduce((s, t) => s + t.nominal, 0)
			- sorted.filter(t => t.jenis === 'Keluar').reduce((s, t) => s + t.nominal, 0);

		const result: ForecastData[] = [];
		const lastDate = new Date(days[days.length - 1]);

		for (let i = 1; i <= 30; i++) {
			const date = new Date(lastDate);
			date.setDate(date.getDate() + i);
			const predicted = lastBalance + avgNet * i;
			result.push({
				date: date.toISOString().split('T')[0],
				predictedBalance: predicted,
				optimistic: predicted + Math.abs(avgNet) * 0.3,
				pessimistic: predicted - Math.abs(avgNet) * 0.3
			});
		}

		return result;
	}
);

// Derived: burn rate (pake ALL — perlu total historis buat hitung rata-rata harian)
export const burnRate = derived(
	transactions,
	($tx) => {
		const expense = $tx.filter(t => t.jenis === 'Keluar');
		const income = $tx.filter(t => t.jenis === 'Masuk');
		if (expense.length === 0) return { daysRemaining: 0, averageDailyExpense: 0, currentBalance: 0 } satisfies BurnRateInfo;

		const totalExpense = expense.reduce((s, t) => s + t.nominal, 0);
		const totalIncome = income.reduce((s, t) => s + t.nominal, 0);
		const balance = totalIncome - totalExpense;

		const dates = [...new Set(expense.map(t => t.tanggal))].sort();
		const dayCount = dates.length || 1;
		const avgDailyExpense = Math.round(totalExpense / dayCount);

		const daysRemaining = avgDailyExpense > 0 ? Math.floor(balance / avgDailyExpense) : 999;

		return {
			daysRemaining,
			averageDailyExpense: avgDailyExpense,
			currentBalance: balance
		} satisfies BurnRateInfo;
	}
);

// Derived: top categories
export const topCategories = derived(
	categoryData,
	($cat) => $cat.slice(0, 5)
);

// Derived: income category breakdown (baru — gak ditampilkan sebelumnya)
export const incomeCategoryData = derived(
	filteredTransactions,
	($tx) => {
		const income = $tx.filter(t => t.jenis === 'Masuk');
		const grouped = new Map<string, number>();
		let total = 0;
		for (const t of income) {
			grouped.set(t.kategori, (grouped.get(t.kategori) || 0) + t.nominal);
			total += t.nominal;
		}
		return Array.from(grouped.entries())
			.map(([kategori, totalKategori]) => ({
				kategori,
				total: totalKategori,
				persentase: total > 0 ? Math.round((totalKategori / total) * 100) : 0
			}))
			.sort((a, b) => b.total - a.total);
	}
);

// Derived: category comparison income vs expense per category (baru)
export const categoryComparison = derived(
	filteredTransactions,
	($tx) => {
		const incomeMap = new Map<string, number>();
		const expenseMap = new Map<string, number>();
		for (const t of $tx) {
			if (t.jenis === 'Masuk') incomeMap.set(t.kategori, (incomeMap.get(t.kategori) || 0) + t.nominal);
			else expenseMap.set(t.kategori, (expenseMap.get(t.kategori) || 0) + t.nominal);
		}
		const allCats = new Set([...incomeMap.keys(), ...expenseMap.keys()]);
		return Array.from(allCats)
			.map(k => ({
				kategori: k,
				income: incomeMap.get(k) || 0,
				expense: expenseMap.get(k) || 0
			}))
			.sort((a, b) => Math.max(b.income, b.expense) - Math.max(a.income, a.expense));
	}
);

// Derived: monthly trend (pake ALL — biar bisa compare antar bulan, gak kepotong filter)
export const monthlyTrend = derived(
	transactions,
	($tx) => {
		const grouped = new Map<string, { income: number; expense: number }>();

		for (const t of $tx) {
			const month = t.tanggal.substring(0, 7); // YYYY-MM
			const existing = grouped.get(month) || { income: 0, expense: 0 };
			if (t.jenis === 'Masuk') {
				existing.income += t.nominal;
			} else {
				existing.expense += t.nominal;
			}
			grouped.set(month, existing);
		}

		return Array.from(grouped.entries())
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([month, val]) => ({
				month,
				income: val.income,
				expense: val.expense
			}));
	}
);
