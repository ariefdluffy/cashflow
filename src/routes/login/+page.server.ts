import { dev } from '$app/environment';
import { fail, redirect } from '@sveltejs/kit';
import { createSessionToken, getValidUsers, SESSION_COOKIE } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) throw redirect(303, '/');
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const nomor = String(data.get('nomor') || '').trim();

		if (!nomor) {
			return fail(400, { error: 'Nomor user wajib diisi', nomor });
		}

		let users: string[];
		try {
			users = await getValidUsers();
		} catch (err) {
			console.error('[Login] Gagal ambil daftar user:', err);
			return fail(500, { error: 'Gagal terhubung ke data. Coba lagi.', nomor });
		}

		// Case-insensitive match, tapi pakai nilai asli dari sheet
		const match = users.find((u) => u.toLowerCase() === nomor.toLowerCase());
		if (!match) {
			return fail(401, { error: 'Nomor user tidak ditemukan', nomor });
		}

		const token = createSessionToken(match);
		cookies.set(SESSION_COOKIE, token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: !dev,
			maxAge: 60 * 60 * 24 * 7 // 7 hari
		});

		throw redirect(303, '/?login=success');
	}
};
