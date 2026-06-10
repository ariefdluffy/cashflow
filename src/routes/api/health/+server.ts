import { json } from '@sveltejs/kit';
import { google } from 'googleapis';
import { env } from '$env/dynamic/private';
import fs from 'node:fs';
import path from 'node:path';

function getAuth() {
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
			scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
		});
	}

	if (SERVICE_ACCOUNT_EMAIL && SERVICE_ACCOUNT_KEY) {
		const key = SERVICE_ACCOUNT_KEY.replace(/\\n/g, '\n').replace(/"/g, '').trim();
		return new google.auth.JWT({
			email: SERVICE_ACCOUNT_EMAIL,
			key,
			scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
		});
	}
	return null;
}

export async function GET() {
	try {
		const auth = getAuth();
		if (!auth) {
			return json({ status: 'error', message: 'Kredensial Google tidak ditemukan' }, { status: 500 });
		}

		const SHEET_ID = env.SHEET_ID || '1e9zWYNdSXFpDapCj20hO6I_1EAIFlND-s53ywRtOxZY';
		const sheets = google.sheets({ version: 'v4', auth });

		// Dapatkan metadata sheet
		const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
		const sheetNames = spreadsheet.data.sheets?.map(s => ({
			title: s.properties?.title,
			rowCount: s.properties?.gridProperties?.rowCount,
			columnCount: s.properties?.gridProperties?.columnCount
		})) || [];

		// Baca raw data dari sheet pertama
		let rawRows: string[][] = [];
		let usedSheet = '';
		if (sheetNames.length > 0) {
			usedSheet = sheetNames[0].title || '';
			const res = await sheets.spreadsheets.values.get({
				spreadsheetId: SHEET_ID,
				range: `${usedSheet}!A:G`
			});
			rawRows = res.data.values || [];
		}

		return json({
			status: 'connected',
			sheetId: SHEET_ID,
			sheets: sheetNames,
			usedSheet,
			rawRowsCount: rawRows.length,
			headerRow: rawRows.length > 0 ? rawRows[0] : null,
			sampleData: rawRows.slice(1, 6),
			message: 'Google Sheets API berhasil terhubung'
		});
	} catch (err) {
		return json({
			status: 'error',
			message: String(err)
		}, { status: 500 });
	}
}
