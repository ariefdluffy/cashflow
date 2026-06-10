import { google } from 'googleapis';
import { env } from '$env/dynamic/private';
import { realtime } from './realtime';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

let channelId: string | null = null;
let resourceId: string | null = null;
let expirationMs: number | null = null;
let renewalTimer: ReturnType<typeof setTimeout> | null = null;
let active = false;

function getDriveAuth(): google.auth.JWT {
	const GOOGLE_CREDENTIALS_PATH = env.GOOGLE_CREDENTIALS_PATH || '';
	const SERVICE_ACCOUNT_EMAIL = env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
	const SERVICE_ACCOUNT_KEY = env.GOOGLE_SERVICE_ACCOUNT_KEY || '';

	if (GOOGLE_CREDENTIALS_PATH) {
		const resolvedPath = path.isAbsolute(GOOGLE_CREDENTIALS_PATH)
			? GOOGLE_CREDENTIALS_PATH
			: path.resolve(process.cwd(), GOOGLE_CREDENTIALS_PATH);
		const raw = fs.readFileSync(resolvedPath, 'utf8');
		const creds = JSON.parse(raw);
		return new google.auth.JWT({
			email: creds.client_email,
			key: creds.private_key,
			scopes: ['https://www.googleapis.com/auth/drive.readonly']
		});
	}

	if (SERVICE_ACCOUNT_EMAIL && SERVICE_ACCOUNT_KEY) {
		const key = SERVICE_ACCOUNT_KEY
			.replace(/\\n/g, '\n')
			.replace(/"/g, '')
			.trim();
		return new google.auth.JWT({
			email: SERVICE_ACCOUNT_EMAIL,
			key,
			scopes: ['https://www.googleapis.com/auth/drive.readonly']
		});
	}

	throw new Error('Google credentials belum diatur untuk Drive Watch');
}

export async function setupDriveWatch(webhookUrl: string): Promise<void> {
	if (active) {
		await stopDriveWatch();
	}

	const auth = getDriveAuth();
	const drive = google.drive({ version: 'v3', auth });
	const SHEET_ID = env.SHEET_ID || '1e9zWYNdSXFpDapCj20hO6I_1EAIFlND-s53ywRtOxZY';

	channelId = randomUUID();
	// Expire in 24 hours (max lifetime for Drive watch channels)
	expirationMs = Date.now() + 24 * 60 * 60 * 1000;

	try {
		const response = await drive.files.watch({
			fileId: SHEET_ID,
			requestBody: {
				id: channelId,
				type: 'web_hook',
				address: webhookUrl,
				expiration: expirationMs
			}
		});

		resourceId = response.data.resourceId ?? null;
		active = true;

		console.log('[DriveWatch] Channel created:', {
			channelId,
			resourceId,
			expiration: new Date(expirationMs).toISOString()
		});

		// Schedule renewal before expiration
		scheduleRenewal(webhookUrl);
	} catch (err) {
		active = false;
		console.error('[DriveWatch] Setup failed, falling back to polling:', err);
	}
}

function scheduleRenewal(webhookUrl: string): void {
	if (renewalTimer) clearTimeout(renewalTimer);

	// Renew 5 minutes before expiration
	const renewIn = Math.max(0, expirationMs! - Date.now() - 5 * 60 * 1000);

	renewalTimer = setTimeout(() => {
		console.log('[DriveWatch] Renewing channel...');
		setupDriveWatch(webhookUrl);
	}, renewIn);

	// Also renew every 12 hours as safety net
	const safetyTimer = 12 * 60 * 60 * 1000;
	if (renewIn > safetyTimer) {
		setTimeout(() => {
			console.log('[DriveWatch] Safety renewal...');
			setupDriveWatch(webhookUrl);
		}, safetyTimer);
	}
}

export async function stopDriveWatch(): Promise<void> {
	if (!channelId || !resourceId) return;

	const auth = getDriveAuth();
	const drive = google.drive({ version: 'v3', auth });

	try {
		await drive.channels.stop({
			requestBody: {
				id: channelId,
				resourceId
			}
		});
		console.log('[DriveWatch] Channel stopped:', channelId);
	} catch (err) {
		console.error('[DriveWatch] Stop failed:', err);
	}

	active = false;
	channelId = null;
	resourceId = null;
	expirationMs = null;
	if (renewalTimer) {
		clearTimeout(renewalTimer);
		renewalTimer = null;
	}
}

export function isDriveWatchActive(): boolean {
	return active;
}
