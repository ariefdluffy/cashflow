import { invalidateCache } from './google-sheet';

type SSECallback = (data: unknown) => void;

class RealtimeService {
	private clients = new Map<string, SSECallback>();
	private pollInterval: ReturnType<typeof setInterval> | null = null;

	register(id: string, callback: SSECallback): void {
		this.clients.set(id, callback);
		if (this.clients.size === 1) {
			this.startPolling();
		}
	}

	unregister(id: string): void {
		this.clients.delete(id);
		if (this.clients.size === 0) {
			this.stopPolling();
		}
	}

	broadcast(data: unknown): void {
		for (const callback of this.clients.values()) {
			try {
				callback(data);
			} catch (err) {
				console.error('SSE broadcast error:', err);
			}
		}
	}

	/**
	 * Notify clients of an update (dipanggil dari Drive webhook).
	 * Langsung invalidate cache + broadcast.
	 */
	notifyUpdate(): void {
		invalidateCache();
		this.broadcast({ type: 'update', timestamp: Date.now() });
	}

	private startPolling(): void {
		// Fallback polling tiap 30 detik kalo webhook gak aktif
		this.pollInterval = setInterval(() => {
			this.checkForUpdates();
		}, 30_000);
	}

	private stopPolling(): void {
		if (this.pollInterval) {
			clearInterval(this.pollInterval);
			this.pollInterval = null;
		}
	}

	private async checkForUpdates(): Promise<void> {
		try {
			// Broadcast refresh — frontend bakal re-fetch.
			// GAK invalidate cache biar Google Sheet API gak dipanggil tiap 30 detik
			// kalo data gak berubah. Cache di google-sheet.ts punya TTL 30s sendiri.
			this.broadcast({ type: 'refresh', timestamp: Date.now() });
		} catch (err) {
			console.error('[Realtime] Polling error:', err);
		}
	}
}

export const realtime = new RealtimeService();
