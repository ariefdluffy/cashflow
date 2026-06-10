import 'dotenv/config';
import { setupDriveWatch } from '$lib/server/drive-watch';
import { env } from '$env/dynamic/private';

export async function init() {
	const webhookUrl = env.GOOGLE_DRIVE_WEBHOOK_URL;

	if (webhookUrl) {
		console.log('[Hooks] Setting up Drive watch →', webhookUrl);
		await setupDriveWatch(webhookUrl);
	} else {
		console.log('[Hooks] GOOGLE_DRIVE_WEBHOOK_URL not set — using polling fallback (30s)');
	}
}
