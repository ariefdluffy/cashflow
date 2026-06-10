import { realtime } from '$lib/server/realtime';

export function GET({ request }) {
	const stream = new ReadableStream({
		start(controller) {
			const clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2)}`;

			controller.enqueue(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`);

			realtime.register(clientId, (data) => {
				try {
					controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
				} catch { /* disconnected */ }
			});

			const keepalive = setInterval(() => {
				try { controller.enqueue(`:keepalive\n\n`); }
				catch { clearInterval(keepalive); }
			}, 15_000);

			request.signal.addEventListener('abort', () => {
				clearInterval(keepalive);
				realtime.unregister(clientId);
			});
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive'
		}
	});
}
