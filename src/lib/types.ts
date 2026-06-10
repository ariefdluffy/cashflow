export type JenisTransaksi = 'Masuk' | 'Keluar';

export interface Transaksi {
	id: string;
	tanggal: string;
	kategori: string;
	keterangan: string;
	jenis: JenisTransaksi;
	nominal: number;
	timestamp: number;
}

export interface DashboardStats {
	totalIncome: number;
	totalExpense: number;
	balance: number;
	totalTransactions: number;
	averageDaily: number;
	largestExpense: number;
}

export interface ChartDataPoint {
	label: string;
	income: number;
	expense: number;
}

export interface CategoryData {
	kategori: string;
	total: number;
	persentase: number;
}

export interface ActivityLog {
	time: string;
	jenis: JenisTransaksi;
	nominal: number;
	keterangan: string;
}

export interface FilterParams {
	startDate: string | null;
	endDate: string | null;
	preset: 'today' | '7days' | '30days' | 'this-month' | 'this-year' | 'custom' | 'all';
}

export interface ForecastData {
	date: string;
	predictedBalance: number;
	optimistic: number;
	pessimistic: number;
}

export interface BurnRateInfo {
	daysRemaining: number;
	averageDailyExpense: number;
	currentBalance: number;
}
