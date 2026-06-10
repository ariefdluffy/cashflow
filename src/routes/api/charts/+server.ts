import { json } from '@sveltejs/kit';
import { fetchTransactions } from '$lib/server/google-sheet';
import type { ChartDataPoint, CategoryData } from '$lib/types';

export async function GET() {
	try {
		const tx = await fetchTransactions();
		const sorted = [...tx].sort((a, b) => a.tanggal.localeCompare(b.tanggal));

		const lineGrouped = new Map<string, { income: number; expense: number }>();
		for (const t of sorted) {
			const existing = lineGrouped.get(t.tanggal) || { income: 0, expense: 0 };
			if (t.jenis === 'Masuk') existing.income += t.nominal;
			else existing.expense += t.nominal;
			lineGrouped.set(t.tanggal, existing);
		}
		const lineData: ChartDataPoint[] = Array.from(lineGrouped.entries()).map(([label, val]) => ({
			label, income: val.income, expense: val.expense
		}));

		const expense = tx.filter(t => t.jenis === 'Keluar');
		const catGrouped = new Map<string, number>();
		let catTotal = 0;
		for (const t of expense) {
			catGrouped.set(t.kategori, (catGrouped.get(t.kategori) || 0) + t.nominal);
			catTotal += t.nominal;
		}
		const categoryData: CategoryData[] = Array.from(catGrouped.entries())
			.map(([kategori, total]) => ({
				kategori, total,
				persentase: catTotal > 0 ? Math.round((total / catTotal) * 100) : 0
			}))
			.sort((a, b) => b.total - a.total);

		const totalIncome = tx.filter(t => t.jenis === 'Masuk').reduce((s, t) => s + t.nominal, 0);
		const totalExpense = expense.reduce((s, t) => s + t.nominal, 0);

		return json({ lineData, categoryData, totalIncome, totalExpense });
	} catch (err) {
		return json({ error: 'Failed to fetch chart data' }, { status: 500 });
	}
}
