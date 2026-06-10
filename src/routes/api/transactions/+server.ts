import { json } from '@sveltejs/kit';
import { fetchTransactions } from '$lib/server/google-sheet';

export async function GET({ url }) {
	try {
		const tx = await fetchTransactions();
		const search = url.searchParams.get('search')?.toLowerCase() || '';
		const sortBy = url.searchParams.get('sort') || 'tanggal';
		const sortOrder = url.searchParams.get('order') === 'asc' ? 1 : -1;
		const page = parseInt(url.searchParams.get('page') || '1', 10);
		const pageSize = parseInt(url.searchParams.get('pageSize') || '50', 10);
		const startDate = url.searchParams.get('startDate');
		const endDate = url.searchParams.get('endDate');

		let filtered = [...tx];

		if (startDate) filtered = filtered.filter(t => t.tanggal >= startDate);
		if (endDate) filtered = filtered.filter(t => t.tanggal <= endDate);

		if (search) {
			filtered = filtered.filter(t =>
				t.kategori.toLowerCase().includes(search) ||
				t.keterangan.toLowerCase().includes(search) ||
				t.jenis.toLowerCase().includes(search)
			);
		}

		filtered.sort((a, b) => {
			const aVal = a[sortBy as keyof typeof a] ?? '';
			const bVal = b[sortBy as keyof typeof b] ?? '';
			if (typeof aVal === 'string' && typeof bVal === 'string') {
				return aVal.localeCompare(bVal) * sortOrder;
			}
			return ((aVal as number) - (bVal as number)) * sortOrder;
		});

		const total = filtered.length;
		const totalPages = Math.ceil(total / pageSize);
		const start = (page - 1) * pageSize;
		const data = filtered.slice(start, start + pageSize);

		return json({ data, total, totalPages, page, pageSize });
	} catch (err) {
		return json({ error: 'Failed to fetch transactions' }, { status: 500 });
	}
}
