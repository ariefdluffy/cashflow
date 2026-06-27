import { writable } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
	id: number;
	message: string;
	type: ToastType;
}

let counter = 0;

export const toasts = writable<Toast[]>([]);

export function addToast(message: string, type: ToastType = 'info', duration = 3500): void {
	const id = ++counter;
	toasts.update((list) => [...list, { id, message, type }]);
	if (duration > 0) {
		setTimeout(() => removeToast(id), duration);
	}
}

export function removeToast(id: number): void {
	toasts.update((list) => list.filter((t) => t.id !== id));
}
