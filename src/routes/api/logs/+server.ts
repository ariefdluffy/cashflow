import { json } from '@sveltejs/kit';
import { fetchTransactions } from '$lib/server/google-sheet';
import type { ActivityLog } from '$lib/types';

export async function GET() {
	try {
		const tx = await fetchTransactions();
		const logs: ActivityLog[] = [...tx]
			.sort((a, b) => b.timestamp - a.timestamp)
			.slice(0, 50)
			.map(t => ({
				time: new Date(t.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
				jenis: t.jenis,
				nominal: t.nominal,
				keterangan: t.keterangan
			}));
		return json(logs);
	} catch (err) {
		return json({ error: 'Failed to fetch logs' }, { status: 500 });
	}
}
