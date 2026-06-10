import { invalidateCache } from './google-sheet';

type SSECallback = (data: unknown) => void;

class RealtimeService {
	private clients = new Map<string, SSECallback>();
	private pollInterval: ReturnType<typeof setInterval> | null = null;
	private lastDataHash = '';

	/**
	 * Register a client SSE callback.
	 */
	register(id: string, callback: SSECallback): void {
		this.clients.set(id, callback);
		if (this.clients.size === 1) {
			this.startPolling();
		}
	}

	/**
	 * Unregister a client.
	 */
	unregister(id: string): void {
		this.clients.delete(id);
		if (this.clients.size === 0) {
			this.stopPolling();
		}
	}

	/**
	 * Broadcast data to all connected clients.
	 */
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
	 * Notify clients of an update.
	 */
	notifyUpdate(): void {
		invalidateCache();
		this.broadcast({ type: 'update', timestamp: Date.now() });
	}

	private startPolling(): void {
		// Poll every 30 seconds as per PRD
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
			// In a real implementation, this would check a hash/etag
			// For now, we just invalidate cache and broadcast
			invalidateCache();
			this.broadcast({ type: 'refresh', timestamp: Date.now() });
		} catch (err) {
			console.error('Polling error:', err);
		}
	}
}

export const realtime = new RealtimeService();
