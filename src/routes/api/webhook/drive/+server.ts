import { realtime } from '$lib/server/realtime';
import { json } from '@sveltejs/kit';

/**
 * Webhook endpoint untuk Google Drive push notifications.
 *
 * Google kirim POST ke sini tiap ada perubahan di Google Sheet.
 * Headers:
 *   X-Goog-Channel-ID       — ID channel yg didaftarin pas setup
 *   X-Goog-Resource-ID      — ID resource Google Drive
 *   X-Goog-Resource-State   — "sync" (konfirmasi) | "update" (ada perubahan)
 *   X-Goog-Changed          — "content" | "properties" | dll
 */
export async function POST({ request }) {
	const channelId = request.headers.get('X-Goog-Channel-ID');
	const resourceState = request.headers.get('X-Goog-Resource-State');
	const changed = request.headers.get('X-Goog-Changed');
	const resourceId = request.headers.get('X-Goog-Resource-ID');

	console.log('[DriveWebhook] Received:', { channelId, resourceState, changed, resourceId });

	// "sync" = notifikasi awal Google utk konfirmasi channel aktif
	if (resourceState === 'sync') {
		return new Response('OK', { status: 200 });
	}

	// "update" = ada perubahan di sheet → invalidate cache + broadcast SSE
	if (resourceState === 'update') {
		realtime.notifyUpdate();
	}

	return new Response('OK', { status: 200 });
}
