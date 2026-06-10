/** Format Rupiah */
export function formatRp(n: number): string {
	return 'Rp ' + n.toLocaleString('id-ID');
}

/** Format tanggal YYYY-MM-DD jadi "Senin, 31/01/2026" */
export function formatTanggal(tgl: string): string {
	const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
	const parts = tgl.split('-');
	if (parts.length !== 3) return tgl;
	const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
	return `${hari[d.getDay()]}, ${parts[2]}/${parts[1]}/${parts[0]}`;
}

/** Format date string jadi "Senin, 2026-06-10" */
export function formatTanggalPanjang(tgl: string): string {
	const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
	const parts = tgl.split('-');
	if (parts.length !== 3) return tgl;
	const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
	return `${hari[d.getDay()]}, ${tgl}`;
}

/** Format timestamp ke jam:menit */
export function formatJam(ts: number): string {
	return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}
