import crypto from 'node:crypto';
import { env } from '$env/dynamic/private';
import { fetchTransactions } from './google-sheet';

const SECRET = env.AUTH_SECRET || 'cashflow-dev-secret-change-me';

if (!env.AUTH_SECRET) {
	console.warn('[Auth] AUTH_SECRET belum diatur — pakai default (tidak aman untuk produksi)');
}

export const SESSION_COOKIE = 'session';

function hmac(value: string): string {
	return crypto.createHmac('sha256', SECRET).update(value).digest('hex');
}

/** Buat token session: {userUrlEncoded}.{hmac} */
export function createSessionToken(user: string): string {
	const safe = encodeURIComponent(user);
	return `${safe}.${hmac(safe)}`;
}

/** Verifikasi token, balikkan username kalau valid, null kalau tidak */
export function verifySessionToken(token: string): string | null {
	if (!token || !token.includes('.')) return null;

	const lastDot = token.lastIndexOf('.');
	const safe = token.slice(0, lastDot);
	const sig = token.slice(lastDot + 1);
	const expected = hmac(safe);

	// constant-time compare (panjang harus sama dulu)
	if (sig.length !== expected.length) return null;
	try {
		if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
	} catch {
		return null;
	}

	try {
		return decodeURIComponent(safe);
	} catch {
		return null;
	}
}

/** Ambil daftar nomor user unik dari Google Sheet */
export async function getValidUsers(): Promise<string[]> {
	const tx = await fetchTransactions();
	const set = new Set<string>();
	for (const t of tx) {
		const u = (t.user || '').trim();
		if (u) set.add(u);
	}
	return [...set].sort();
}
