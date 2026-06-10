import { json } from '@sveltejs/kit';
import { fetchTransactions } from '$lib/server/google-sheet';
import type { DashboardStats } from '$lib/types';

export async function GET() {
	try {
		const tx = await fetchTransactions();
		const income = tx.filter(t => t.jenis === 'Masuk');
		const expense = tx.filter(t => t.jenis === 'Keluar');

		const totalIncome = income.reduce((sum, t) => sum + t.nominal, 0);
		const totalExpense = expense.reduce((sum, t) => sum + t.nominal, 0);
		const dates = [...new Set(tx.map(t => t.tanggal))].length;

		const stats: DashboardStats = {
			totalIncome,
			totalExpense,
			balance: totalIncome - totalExpense,
			totalTransactions: tx.length,
			averageDaily: dates > 0 ? Math.round((totalIncome - totalExpense) / dates) : 0,
			largestExpense: expense.length > 0 ? Math.max(...expense.map(t => t.nominal)) : 0
		};

		return json(stats);
	} catch (err) {
		return json({ error: 'Failed to fetch stats' }, { status: 500 });
	}
}
