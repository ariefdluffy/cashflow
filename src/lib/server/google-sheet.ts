import type { Transaksi } from '$lib/types';
import { google } from 'googleapis';
import { env } from '$env/dynamic/private';
import fs from 'node:fs';
import path from 'node:path';

const SHEET_ID = env.SHEET_ID || '1e9zWYNdSXFpDapCj20hO6I_1EAIFlND-s53ywRtOxZY';
const SHEET_RANGE = env.SHEET_RANGE || 'A:E';

const SERVICE_ACCOUNT_EMAIL = env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
const SERVICE_ACCOUNT_KEY = env.GOOGLE_SERVICE_ACCOUNT_KEY || '';
const GOOGLE_CREDENTIALS_PATH = env.GOOGLE_CREDENTIALS_PATH || '';

let cachedData: Transaksi[] | null = null;
let lastFetch = 0;
const CACHE_TTL = 30_000;

// --- Category classification ---
const incomeKeywords: [string, string][] = [
	['gaji', 'Gaji'],
	['upah', 'Gaji'],
	['honor', 'Gaji'],
	['tpp', 'Gaji'],
	['jual', 'Penjualan'],
	['order', 'Penjualan'],
	['produk', 'Penjualan'],
	['dagang', 'Penjualan'],
	['investasi', 'Investasi'],
	['dividen', 'Investasi'],
	['bunga', 'Investasi'],
	['saham', 'Investasi'],
	['pinjam', 'Pendanaan'],
	['hutang', 'Pendanaan'],
	['kredit', 'Pendanaan'],
	['modal', 'Pendanaan'],
	['refund', 'Pendapatan Lain'],
	['komisi', 'Pendapatan Lain'],
	['affiliate', 'Pendapatan Lain'],
];

const expenseKeywords: [string, string][] = [
	['makan', 'Makanan'],
	['minum', 'Makanan'],
	['warung', 'Makanan'],
	['restoran', 'Makanan'],
	['kafe', 'Makanan'],
	['cafe', 'Makanan'],
	['roti', 'Makanan'],
	['kue', 'Makanan'],
	['kurma', 'Makanan'],
	['udang', 'Makanan'],
	['tahu', 'Makanan'],
	['listrik', 'Utilitas'],
	['air', 'Utilitas'],
	['pdam', 'Utilitas'],
	['token', 'Utilitas'],
	['pln', 'Utilitas'],
	['internet', 'Utilitas'],
	['indihome', 'Utilitas'],
	['telpon', 'Utilitas'],
	['pulsa', 'Utilitas'],
	['bensin', 'Transportasi'],
	['parkir', 'Transportasi'],
	['tol', 'Transportasi'],
	['mobil', 'Transportasi'],
	['motor', 'Transportasi'],
	['transport', 'Transportasi'],
	['bahan bakar', 'Transportasi'],
	['oli', 'Transportasi'],
	['bearing', 'Transportasi'],
	['kampas', 'Transportasi'],
	['pasar', 'Belanja'],
	['belanja', 'Belanja'],
	['beli', 'Belanja'],
	['sembako', 'Belanja'],
	['swalayan', 'Belanja'],
	['alfamart', 'Belanja'],
	['indomaret', 'Belanja'],
	['baju', 'Belanja'],
	['songkok', 'Belanja'],
	['parcel', 'Belanja'],
	['sewa', 'Sewa'],
	['kontrak', 'Sewa'],
	['kos', 'Sewa'],
	['rumah', 'Rumah Tangga'],
	['gaji', 'Gaji Karyawan'],
	['thr', 'Gaji Karyawan'],
	['bonus', 'Gaji Karyawan'],
	['iklan', 'Marketing'],
	['promo', 'Marketing'],
	['sponsor', 'Marketing'],
	['ads', 'Marketing'],
	['hosting', 'Hosting & Domain'],
	['domain', 'Hosting & Domain'],
	['server', 'Hosting & Domain'],
	['ssl', 'Hosting & Domain'],
	['vps', 'Hosting & Domain'],
	['pajak', 'Pajak & Asuransi'],
	['bpjs', 'Pajak & Asuransi'],
	['asuransi', 'Pajak & Asuransi'],
	['obat', 'Kesehatan'],
	['dokter', 'Kesehatan'],
	['rumah sakit', 'Kesehatan'],
	['berobat', 'Kesehatan'],
	['hiburan', 'Hiburan'],
	['game', 'Hiburan'],
	['netflix', 'Hiburan'],
	['spotify', 'Hiburan'],
	['nonton', 'Hiburan'],
	['hotel', 'Travel'],
	['penginapan', 'Travel'],
	['sekolah', 'Pendidikan'],
	['buku', 'Pendidikan'],
	['kursus', 'Pendidikan'],
	['les', 'Pendidikan'],
	['spp', 'Pendidikan'],
	['uang saku', 'Pendidikan'],
	['tarik tunai', 'Penarikan Tunai'],
	['patungan', 'Lainnya'],
];

function classifyCategory(jenis: string, keterangan: string): string {
	const desc = (keterangan || '').toLowerCase();
	if (jenis === 'Masuk') {
		for (const [keyword, category] of incomeKeywords) {
			if (desc.includes(keyword)) return category;
		}
		return 'Pemasukan Lain';
	} else {
		for (const [keyword, category] of expenseKeywords) {
			if (desc.includes(keyword)) return category;
		}
		return 'Pengeluaran Lain';
	}
}

// --- Sheet parsing ---
function parseSheetRows(rows: string[][]): Transaksi[] {
	const result: Transaksi[] = [];
	const seen = new Set<string>();
	for (let i = 0; i < rows.length; i++) {
		const row = rows[i];
		if (row.length < 5) continue;
		const [tanggalRaw, user, jenisRaw, nominalStr, keterangan] = row;

		const nominal = parseInt(String(nominalStr || '0').replace(/[^0-9\-]/g, ''), 10);
		if (isNaN(nominal) || nominal <= 0) continue;

		const jenisNorm = String(jenisRaw || '').trim().toUpperCase();
		if (jenisNorm !== 'MASUK' && jenisNorm !== 'KELUAR') continue;
		const jenis = jenisNorm === 'MASUK' ? 'Masuk' : 'Keluar';

		// Parse tanggal (DD/MM/YYYY HH:MM:SS)
		let tanggal = String(tanggalRaw || '').trim();
		let timestamp = Date.now();
		if (tanggal) {
			const dtParts = tanggal.split(' ');
			const dateParts = dtParts[0].split('/');
			const timeParts = dtParts[1] ? dtParts[1].split(':') : [0, 0, 0];
			if (dateParts.length === 3) {
				const d = new Date(
					parseInt(dateParts[2]),
					parseInt(dateParts[1]) - 1,
					parseInt(dateParts[0]),
					parseInt(timeParts[0] || '0'),
					parseInt(timeParts[1] || '0'),
					parseInt(timeParts[2] || '0')
				);
				tanggal = d.toISOString().split('T')[0];
				timestamp = d.getTime();
			} else {
				timestamp = new Date(tanggal).getTime() || Date.now();
				tanggal = new Date(timestamp).toISOString().split('T')[0];
			}
		}

		const keteranganStr = String(keterangan || '').trim();
		const kategori = classifyCategory(jenis, keteranganStr);

		const key = `${tanggal}-${jenis}-${nominal}-${keteranganStr}`;
		if (seen.has(key)) continue;
		seen.add(key);

		result.push({
			id: `sheet-${i}-${Date.now()}`,
			tanggal,
			kategori,
			keterangan: keteranganStr,
			jenis,
			nominal,
			timestamp
		});
	}
	return result;
}

// --- Auth ---
function getAuth(): google.auth.JWT {
	if (GOOGLE_CREDENTIALS_PATH) {
		try {
			const resolvedPath = path.isAbsolute(GOOGLE_CREDENTIALS_PATH)
				? GOOGLE_CREDENTIALS_PATH
				: path.resolve(process.cwd(), GOOGLE_CREDENTIALS_PATH);
			const raw = fs.readFileSync(resolvedPath, 'utf8');
			const creds = JSON.parse(raw);
			return new google.auth.JWT({
				email: creds.client_email,
				key: creds.private_key,
				scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
			});
		} catch (err) {
			throw new Error(`Gagal load credentials file (${GOOGLE_CREDENTIALS_PATH}): ${err}`);
		}
	}

	if (SERVICE_ACCOUNT_EMAIL && SERVICE_ACCOUNT_KEY) {
		if (!SERVICE_ACCOUNT_EMAIL.includes('@')) {
			throw new Error(
				`GOOGLE_SERVICE_ACCOUNT_EMAIL salah: "${SERVICE_ACCOUNT_EMAIL}"\n` +
				`Format: nama@project.iam.gserviceaccount.com`
			);
		}
		const key = SERVICE_ACCOUNT_KEY
			.replace(/\\n/g, '\n')
			.replace(/"/g, '')
			.trim();
		return new google.auth.JWT({
			email: SERVICE_ACCOUNT_EMAIL,
			key,
			scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
		});
	}

	throw new Error('Google credentials belum diatur. Lihat .env.example');
}

// --- Main fetch ---
export async function fetchTransactions(): Promise<Transaksi[]> {
	const now = Date.now();
	if (cachedData && now - lastFetch < CACHE_TTL) return cachedData;

	const auth = getAuth();
	const sheets = google.sheets({ version: 'v4', auth });

	const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
	const sheetNames = spreadsheet.data.sheets?.map(s => s.properties?.title) || [];
	if (sheetNames.length === 0) throw new Error('Tidak ada sheet');

	for (const sheetName of sheetNames) {
		try {
			const range = `${sheetName}!A:E`;
			const response = await sheets.spreadsheets.values.get({
				spreadsheetId: SHEET_ID,
				range
			});
			const rows = response.data.values;
			if (rows && rows.length >= 2) {
				cachedData = parseSheetRows(rows.slice(1));
				lastFetch = now;
				return cachedData!;
			}
		} catch { /* coba sheet berikutnya */ }
	}

	throw new Error(`Tidak ada data. Sheets: ${sheetNames.join(', ')}`);
}

export function invalidateCache(): void {
	cachedData = null;
	lastFetch = 0;
}
