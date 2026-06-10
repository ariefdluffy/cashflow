import type { Transaksi, DashboardStats, ChartDataPoint, CategoryData, ActivityLog } from '$lib/types';

const BASE = '';

async function fetchJSON<T>(url: string): Promise<T> {
	const res = await fetch(`${BASE}${url}`);
	if (!res.ok) throw new Error(`API error: ${res.status}`);
	return res.json();
}

export async function fetchStats(): Promise<DashboardStats> {
	return fetchJSON<DashboardStats>('/api/stats');
}

export async function fetchTransactions(params?: {
	search?: string;
	sort?: string;
	order?: string;
	page?: number;
	pageSize?: number;
	startDate?: string;
	endDate?: string;
}): Promise<{ data: Transaksi[]; total: number; totalPages: number; page: number; pageSize: number }> {
	const qs = new URLSearchParams();
	if (params?.search) qs.set('search', params.search);
	if (params?.sort) qs.set('sort', params.sort);
	if (params?.order) qs.set('order', params.order);
	if (params?.page) qs.set('page', String(params.page));
	if (params?.pageSize) qs.set('pageSize', String(params.pageSize));
	if (params?.startDate) qs.set('startDate', params.startDate);
	if (params?.endDate) qs.set('endDate', params.endDate);
	const query = qs.toString();
	return fetchJSON(`/api/transactions${query ? `?${query}` : ''}`);
}

export async function fetchChartData(): Promise<{
	lineData: ChartDataPoint[];
	categoryData: CategoryData[];
	totalIncome: number;
	totalExpense: number;
}> {
	return fetchJSON('/api/charts');
}

export async function fetchLogs(): Promise<ActivityLog[]> {
	return fetchJSON('/api/logs');
}
